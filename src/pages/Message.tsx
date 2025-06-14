import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext'; // Adjust path if necessary
import { formatDistance, format } from 'date-fns'; // Added format
import { ClipboardIcon, DownloadIcon, CopyIcon, LinkIcon, Trash2Icon, Edit3Icon, Share2Icon } from 'lucide-react';
import api, { messagesApi, reactionsApi, messageLinksApi } from '@/services/api';
import { MESSAGE_ROUTES } from '@/components/constants/apiRoutes';
import type { MessageWithReactions } from '../types/message';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input'; // Added Input
import toast from 'react-hot-toast';
import type { Reaction } from '../types/reaction';
import { normalizeMessage } from '../utils/normalizeKeys';
import { getTransformedCloudinaryUrl } from '../utils/mediaHelpers';
import { QRCodeSVG } from 'qrcode.react';
import VideoPlayer from '../components/dashboard/VideoPlayer'; // Added VideoPlayer import
import LinksModal from '../components/dashboard/LinksModal';

const Message: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteReactionModal, setShowDeleteReactionModal] = useState(false);
  const [reactionToDeleteId, setReactionToDeleteId] = useState<string | null>(null);
  const [isDeletingReaction, setIsDeletingReaction] = useState(false);
  const [showDeleteAllReactionsModal, setShowDeleteAllReactionsModal] = useState(false);
  const [isDeletingAllReactions, setIsDeletingAllReactions] = useState(false);
  const [manualReviewReactionId, setManualReviewReactionId] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageWithReactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState({ passcode: false, link: false });
  const [showQrCode, setShowQrCode] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [linkStats, setLinkStats] = useState({ liveOneTime: 0, expiredOneTime: 0 });

  const { user: loggedInUser } = useAuth();
  const isGuestUser = loggedInUser?.role === 'guest';

  // State for Passcode Edit Modal
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [currentPasscodeValue, setCurrentPasscodeValue] = useState('');
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);

  // State for Reaction Length Edit Modal
  const [isReactionLengthModalOpen, setIsReactionLengthModalOpen] = useState(false);
  const [currentReactionLengthValue, setCurrentReactionLengthValue] = useState(15); // Default to 15s, will be clamped
  const [isUpdatingReactionLength, setIsUpdatingReactionLength] = useState(false);
  const [isSubmittingManualReview, setIsSubmittingManualReview] = useState(false);

  useEffect(() => {
    const fetchMessageDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(MESSAGE_ROUTES.GET_BY_ID(id!));
        if (!response.data) throw new Error('No message found');
        setMessage(response.data);
      } catch (err) {
        setError('Failed to load message details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMessageDetails();
  }, [id]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!id) return;
      try {
        const res = await messageLinksApi.list(id);
        if (res.data.stats) {
          setLinkStats({
            liveOneTime: res.data.stats.liveOneTime || 0,
            expiredOneTime: res.data.stats.expiredOneTime || 0,
          });
        }
      } catch (e) {
        console.error('Failed to fetch link stats');
      }
    };
    fetchStats();
  }, [id]);

  // Scroll to top when message details are loaded (keep this effect separate)
  useEffect(() => {
    if (message) {
      window.scrollTo(0, 0);
    }
  }, [message]);

  // Passcode Modal Handlers
  const handleOpenPasscodeModal = () => {
    setCurrentPasscodeValue(message?.passcode || '');
    setIsPasscodeModalOpen(true);
  };

  const handleClosePasscodeModal = () => {
    setIsPasscodeModalOpen(false);
  };

  const handleLinksModalClose = () => {
    setIsLinksModalOpen(false);
    if (id) {
      messageLinksApi
        .list(id)
        .then(res => {
          if (res.data.stats) {
            setLinkStats({
              liveOneTime: res.data.stats.liveOneTime || 0,
              expiredOneTime: res.data.stats.expiredOneTime || 0,
            });
          }
        })
        .catch(() => {});
    }
  };

  const handleSavePasscode = async () => {
    if (!id || !message) return;
    setIsUpdatingPasscode(true);

    const originalPasscode = message?.passcode || '';
    const newPasscode = currentPasscodeValue || null; // Treat empty string as null for backend

    if (newPasscode === originalPasscode || (newPasscode === null && originalPasscode === '')) {
      toast('No changes made.');
      setIsUpdatingPasscode(false);
      return;
    }

    const updateData = { passcode: newPasscode };

    try {
      const response = await messagesApi.updateMessageDetails(id, updateData);
      const updatedFields = normalizeMessage(response.data);
      setMessage(prevMessage => {
        if (!prevMessage) return null;
        const newReactions = updatedFields.reactions !== undefined ? updatedFields.reactions : prevMessage.reactions;
        return {
          ...prevMessage,
          ...updatedFields,
          reactions: newReactions,
        };
      });
      toast.success('Passcode updated successfully!');
      handleClosePasscodeModal();
      setTimeout(() => window.location.reload(), 1000); // Reload after 1 second
    } catch (err) {
      toast.error('Failed to update passcode.');
      console.error('Error updating passcode:', err);
    } finally {
      setIsUpdatingPasscode(false);
    }
  };

  // Reaction Length Modal Handlers
  const handleOpenReactionLengthModal = () => {
    // Ensure value is within 10-30 range, default 15
    const currentLength = message?.reaction_length || 15;
    setCurrentReactionLengthValue(Math.max(10, Math.min(30, currentLength)));
    setIsReactionLengthModalOpen(true);
  };

  const handleCloseReactionLengthModal = () => {
    setIsReactionLengthModalOpen(false);
  };

  const handleSaveReactionLength = async () => {
    if (!id || !message) return;
    setIsUpdatingReactionLength(true);

    // Ensure value is within 10-30 range before saving
    const validatedLength = Math.max(10, Math.min(30, currentReactionLengthValue));

    if (validatedLength === message?.reaction_length) {
      toast('No changes made.');
      setIsUpdatingReactionLength(false);
      return;
    }

    const updateData = { reaction_length: validatedLength };

    try {
      const response = await messagesApi.updateMessageDetails(id, updateData);
      const updatedFields = normalizeMessage(response.data);
      setMessage(prevMessage => {
        if (!prevMessage) return null;
        const newReactions = updatedFields.reactions !== undefined ? updatedFields.reactions : prevMessage.reactions;
        return {
          ...prevMessage,
          ...updatedFields,
          reactions: newReactions,
        };
      });
      toast.success('Reaction length updated successfully!');
      handleCloseReactionLengthModal();
      setTimeout(() => window.location.reload(), 1000); // Reload after 1 second
    } catch (err) {
      toast.error('Failed to update reaction length.');
      console.error('Error updating reaction length:', err);
    } finally {
      setIsUpdatingReactionLength(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await messagesApi.delete(id);
      toast.success('Message deleted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete message. Please try again.');
      console.error('Error deleting message:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmModal(false);
    }
  };

  const handleDeleteSingleReaction = async () => {
    if (!reactionToDeleteId) return;
    setIsDeletingReaction(true);
    try {
      await reactionsApi.deleteReactionById(reactionToDeleteId);
      setMessage(prevMessage => {
        if (!prevMessage || !prevMessage.reactions) return prevMessage;
        return {
          ...prevMessage,
          reactions: prevMessage.reactions.filter(reaction => reaction.id !== reactionToDeleteId),
        };
      });
      toast.success('Reaction deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete reaction. Please try again.');
      console.error('Error deleting reaction:', err);
    } finally {
      setIsDeletingReaction(false);
      setShowDeleteReactionModal(false);
      setReactionToDeleteId(null);
    }
  };

  const openDeleteReactionModal = (rId: string) => {
    setReactionToDeleteId(rId);
    setShowDeleteReactionModal(true);
  };

  const handleDeleteAllReactions = async () => {
    if (!id) return; // id is the messageId from useParams
    setIsDeletingAllReactions(true);
    try {
      await reactionsApi.deleteAllForMessage(id);
      setMessage(prevMessage => {
        if (!prevMessage) return null;
        return {
          ...prevMessage,
          reactions: [], // Set reactions to an empty array
        };
      });
      toast.success('All reactions for this message deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete all reactions. Please try again.');
      console.error('Error deleting all reactions:', err);
    } finally {
      setIsDeletingAllReactions(false);
      setShowDeleteAllReactionsModal(false);
    }
  };
  
  const normalizedMessage = message ? normalizeMessage(message) : null;
  
  const copyToClipboard = (text: string | undefined, type: 'passcode' | 'link') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };

  const handleShare = () => {
    if (!normalizedMessage?.shareableLink) return;

    if (navigator.share) {
      let shareText;
      if (message?.passcode) {
        shareText = `Check out my surprise message!\nPasscode: ${message.passcode}\n`;
      } else {
        shareText = 'Check out my surprise message!\n\n';
      }

      navigator
        .share({
          title: 'Reactlyve Message',
          text: shareText,
          url: normalizedMessage.shareableLink,
        })
        .catch(error => {
          console.error('Error sharing:', error);
          copyToClipboard(normalizedMessage.shareableLink, 'link');
        });
    } else {
      copyToClipboard(normalizedMessage.shareableLink, 'link');
    }
  };

  const downloadVideo = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      formattedDate: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      timeAgo: formatDistance(date, new Date(), { addSuffix: true }),
    };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !message) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="mt-2 text-neutral-700 dark:text-neutral-300">
              {error || 'Message not found'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Message is guaranteed to be non-null here due to the check above,
  // so normalizedMessage will also be non-null.
  const { formattedDate, timeAgo } = formatDate(normalizedMessage!.createdAt);
  
  const hasReactions = normalizedMessage && normalizedMessage.reactions && normalizedMessage.reactions.length > 0;

  let imageElement = null;
  // normalizedMessage could be null if message was null, but the `if (error || !message)` block handles that.
  // However, to be extremely safe, we can add a check for normalizedMessage here.
  if (
    normalizedMessage &&
    normalizedMessage.moderationStatus !== 'rejected' &&
    normalizedMessage.moderationStatus !== 'manual_review' &&
    normalizedMessage.mediaType === 'image' &&
    normalizedMessage.imageUrl
  ) {
      const transformedImgUrl = normalizedMessage.imageUrl ? getTransformedCloudinaryUrl(normalizedMessage.imageUrl, normalizedMessage.fileSizeInBytes || 0) : '';
      imageElement = (
          <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Image</h2>
              <img src={transformedImgUrl} alt="Message" className="w-full max-w-lg rounded object-cover" />
          </div>
      );
  }

  let videoElement = null;
  // Similar safety check for normalizedMessage
  if (
    normalizedMessage &&
    normalizedMessage.moderationStatus !== 'rejected' &&
    normalizedMessage.moderationStatus !== 'manual_review' &&
    normalizedMessage.mediaType === 'video' &&
    normalizedMessage.videoUrl
  ) {
      const transformedVidUrl = normalizedMessage.videoUrl ? getTransformedCloudinaryUrl(normalizedMessage.videoUrl, normalizedMessage.fileSizeInBytes || 0) : '';
      videoElement = (
          <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Video</h2>
              <VideoPlayer
                  src={transformedVidUrl}
                  poster={normalizedMessage.thumbnailUrl || undefined}
                  className="w-full max-w-lg"
                  autoPlay={false}
                   initialDurationSeconds={typeof message.duration === 'number' ? message.duration : undefined}
              />
              <div className="mt-3">
                <button
                  onClick={() => {
                    if (transformedVidUrl) {
                      const extension = transformedVidUrl?.split('.').pop()?.split('?')[0] || 'mp4';
                      const filename = `message-video.${extension}`;
                      downloadVideo(transformedVidUrl, filename);
                    } else {
                      // Optionally, provide feedback to the user or log this case
                      console.warn('Download button clicked, but transformedVidUrl is not available.');
                      toast.error('Video URL is not available for download.');
                    }
                  }}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  disabled={!transformedVidUrl} // Disable button if URL is not available
                >
                  <DownloadIcon size={16} />
                  Download Video
                </button>
                {message.duration && ( // message is confirmed non-null here
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Duration: {Math.floor(message.duration / 60)}:{(message.duration % 60).toString().padStart(2, '0')}
                  </p>
                )}

              </div>
          </div>
      );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-neutral-800">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-700">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Message Details</h1>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {formattedDate} ({timeAgo})
                </p>
              </div>
              <div className="flex space-x-2">
                {/* The old "Edit Options" button is removed by not including it here. */}
                {message && !loading && (
                  <Button
                    variant="outline" // Changed from dangerOutline
                    size="sm"
                    onClick={() => setShowDeleteConfirmModal(true)}
                    disabled={isDeleting}
                    className="text-red-600 border-red-600 hover:bg-red-100 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                    leftIcon={<Trash2Icon size={16} />}
                  >
                    Delete Message
                  </Button>
                )}
              </div>
            </div>

            {/* Message content */}
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Message Content</h2>
              <div className="rounded-md bg-neutral-100 p-4 dark:bg-neutral-700">
                <p className="text-neutral-700 dark:text-neutral-200">{message.content}</p>
              </div>
            </div>

            {(normalizedMessage.moderationStatus === 'rejected' ||
              normalizedMessage.moderationStatus === 'manual_review') && (
              <div className="mb-6 rounded-md bg-neutral-100 p-4 dark:bg-neutral-700">
                <p className="mb-1 break-words text-base font-medium text-neutral-500 dark:text-neutral-400">
                  {normalizedMessage.moderationDetails ? `This image was rejected: ${normalizedMessage.moderationDetails}` : 'This media failed moderation.'}
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={normalizedMessage.moderationStatus === 'manual_review'}
                  onClick={async () => {
                    setIsSubmittingManualReview(true);
                    try {
                      await messagesApi.submitForManualReview(id!);
                      toast.success('Submitted for manual review');
                    } catch (err) {
                      toast.error('Failed to submit for review');
                    } finally {
                      setIsSubmittingManualReview(false);
                    }
                  }}
                  isLoading={isSubmittingManualReview}
                >
                  {normalizedMessage.moderationStatus === 'manual_review' ? 'Manual Review Pending' : 'Request Manual Review'}
                </Button>
              </div>
            )}

            {/* Media */}
            {imageElement}
            {videoElement}

            {/* Shareable link, passcode, reaction length, and reaction stats */}
            <div className="mb-6 flex flex-col gap-4"> {/* Outer container for rows */}
              {/* Desktop Row 1: Shareable Link and Passcode */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-4 flex flex-col gap-4">
                {normalizedMessage.shareableLink && (
                  <div>
                    <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Shareable Link</h2>
                    <div className="rounded-md bg-neutral-100 dark:bg-neutral-700">
                      <div className="flex items-center gap-2 p-3">
                        <p className="flex-1 truncate text-sm text-neutral-700 dark:text-neutral-300">
                          {normalizedMessage.shareableLink}
                        </p>
                        <button
                          onClick={() => copyToClipboard(normalizedMessage.shareableLink, 'link')}
                          className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700"
                        >
                          {copied.link ? <ClipboardIcon size={16} /> : <CopyIcon size={16} />}
                        </button>
                        <button
                          onClick={handleShare}
                          className="ml-2 rounded-md bg-secondary-600 p-2 text-white hover:bg-secondary-700"
                        >
                          <Share2Icon size={16} />
                        </button>
                        <button
                          onClick={() => setShowQrCode(!showQrCode)}
                          aria-label={showQrCode ? 'Hide QR Code' : 'Show QR Code'}
                          className={`ml-2 rounded-md p-2 transition-colors ${
                            showQrCode
                              ? 'bg-neutral-300 text-neutral-800 hover:bg-neutral-400 dark:bg-neutral-600 dark:text-white dark:hover:bg-neutral-500'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z"
                              clipRule="evenodd"
                            />
                            <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
                          </svg>
                        </button>
                      </div>
                      {copied.link && (
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">Link copied to clipboard!</p>
                      )}
                      {showQrCode && normalizedMessage.shareableLink && (
                        <div className="mt-4 text-center">
                          <h3 className="mb-2 text-md font-semibold text-neutral-900 dark:text-white">Scan QR Code</h3>
                          <div className="inline-block rounded-lg bg-white p-4 shadow">
                            <QRCodeSVG
                              value={normalizedMessage.shareableLink}
                              size={200}
                              bgColor={"#ffffff"}
                              fgColor={"#000000"}
                              level={"L"}
                            />
                          </div>
                          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                            Scan this QR code to access the shareable link.
                          </p>
                        </div>
                      )}
                      {id && (
                        <div className="mt-3 border-t border-neutral-200 p-3 flex items-center justify-between dark:border-neutral-600">
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">
                            One-time: {linkStats.liveOneTime} live / {linkStats.expiredOneTime} viewed
                          </p>
                          <button onClick={() => setIsLinksModalOpen(true)} className="text-sm text-blue-600 hover:underline">
                            Manage
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Passcode Display - Always show section, indicate if not set */}
                {message && (
                  <div>
                    <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Passcode</h2>
                    <div className="flex items-center gap-2 rounded-md bg-neutral-100 p-3 dark:bg-neutral-700">
                      <p className="flex-1 text-sm font-mono text-neutral-700 dark:text-neutral-300">
                        {message.passcode ? (
                          message.passcode
                        ) : (
                          <span className="italic">Not Set</span>
                        )}
                      </p>
                      {/* Only show copy button if passcode is set */}
                      {message.passcode && (
                        <button
                          onClick={() => copyToClipboard(message.passcode, 'passcode')}
                          className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700"
                          title="Copy Passcode"
                        >
                          {copied.passcode ? <ClipboardIcon size={16} /> : <CopyIcon size={16} />}
                        </button>
                      )}
                      <button
                        onClick={handleOpenPasscodeModal}
                        className="ml-2 rounded-md p-1 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-500"
                        title="Edit Passcode"
                      >
                        <Edit3Icon size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Row 2: Reaction Length and Reaction Stats */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-4 flex flex-col gap-4">
                {/* Reaction Length Display */}
                {normalizedMessage && typeof normalizedMessage.reaction_length === 'number' && (
                  <div>
                    <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Reaction Length</h2>
                    <div className="flex items-center justify-between gap-2 rounded-md bg-neutral-100 p-3 dark:bg-neutral-700">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        {normalizedMessage.reaction_length} seconds
                      </p>
                      <button
                        onClick={handleOpenReactionLengthModal}
                        className="ml-2 rounded-md p-1 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-500"
                        title="Edit Reaction Length"
                      >
                        <Edit3Icon size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {/* Reaction Stats Display */}
                {normalizedMessage && (normalizedMessage.reactions_used !== undefined || normalizedMessage.reactions_remaining !== undefined || normalizedMessage.max_reactions_allowed !== undefined) && (
                  <div>
                    <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Reaction Stats</h2>
                    <div className="rounded-md bg-neutral-100 p-3 dark:bg-neutral-700">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        Used: {normalizedMessage.reactions_used ?? 'N/A'} / {normalizedMessage.max_reactions_allowed ?? 'Unlimited'}
                      </p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        Remaining: {normalizedMessage.reactions_remaining ?? 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reactions and Replies */}
            {hasReactions ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Reactions</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteAllReactionsModal(true)}
                    disabled={isGuestUser || isDeletingAllReactions || !normalizedMessage?.reactions?.length}
                    isLoading={isDeletingAllReactions}
                    className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/30"
                    title={isGuestUser ? "Guests cannot clear all reactions." : undefined}
                  >
                    <Trash2Icon size={16} className="mr-1" />
                    Clear All Reactions
                  </Button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {hasReactions && normalizedMessage && normalizedMessage.reactions.map((reaction: Reaction & { name?: string; videoUrl?: string; thumbnailUrl?: string; duration?: number; replies?: { id: string; text: string; createdAt: string }[] }) => {
                    // console.log removed as per request
                    return (
                    <div key={reaction.id} className="rounded-md bg-neutral-100 p-4 dark:bg-neutral-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          {reaction.name && (
                           <p className="text-md font-semibold text-neutral-800 dark:text-neutral-100">
                            From:{' '}
                           <Link
                             to={`/reaction/${reaction.id}`}
                             className="text-blue-600 hover:underline dark:text-blue-400"
                             title="View Reaction"
                             >
                             {reaction.name}
                            </Link>
                           </p>
                          )}
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">
                            Received on {new Date(reaction.createdAt).toLocaleString()}
                          </p>
                          {(reaction.moderationStatus === 'rejected' ||
                            reaction.moderationStatus === 'manual_review') && (
                            <div className="mt-2">
                              <p className="mb-1 break-words text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                {reaction.moderationDetails
                                  ? `Rejected: ${reaction.moderationDetails}`
                                  : 'This reaction failed moderation.'}
                              </p>
                              <Button
                                size="sm"
                                disabled={reaction.moderationStatus === 'manual_review'}
                                onClick={async () => {
                                  setManualReviewReactionId(reaction.id);
                                  try {
                                    await reactionsApi.submitForManualReview(reaction.id);
                                    toast.success('Reaction sent for review');
                                  } catch (err) {
                                    toast.error('Failed to submit reaction');
                                  } finally {
                                    setManualReviewReactionId(null);
                                  }
                                }}
                                isLoading={manualReviewReactionId === reaction.id}
                              >
                                {reaction.moderationStatus === 'manual_review' ? 'Manual Review Pending' : 'Request Manual Review'}
                              </Button>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteReactionModal(reaction.id)}
                          className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:text-neutral-400 dark:hover:text-red-500 dark:hover:bg-red-900/30"
                          disabled={isGuestUser || (isDeletingReaction && reactionToDeleteId === reaction.id)}
                          isLoading={isDeletingReaction && reactionToDeleteId === reaction.id}
                          title={isGuestUser ? "Guests cannot delete reactions." : "Delete Reaction"}
                        >
                          <Trash2Icon size={16} />
                        </Button>
                      </div>

                      {reaction.videoUrl &&
                        reaction.moderationStatus !== 'rejected' &&
                        reaction.moderationStatus !== 'manual_review' ? (
                        <>
                          {(() => {
                            let transformedReactionVideoUrl = reaction.videoUrl;
                            if (reaction.videoUrl) {
                              transformedReactionVideoUrl = getTransformedCloudinaryUrl(reaction.videoUrl, 0);
                            }
                            return (
                              <>
                                <VideoPlayer
                                  src={transformedReactionVideoUrl}
                                  poster={reaction.thumbnailUrl || undefined}
                                  className="w-full rounded"
                                  autoPlay={false}
                                  initialDurationSeconds={typeof reaction.duration === 'number' ? reaction.duration : undefined}
                                />
                                <button
                                  onClick={() => {
                                    if (!transformedReactionVideoUrl) {
                                      console.error("Download clicked but no transformedReactionVideoUrl present for reaction:", reaction.id);
                                      toast.error('Video URL is not available for download.');
                                      return;
                                    }
                                    // Construct filename (existing logic)
                                    const prefix = "Reactlyve";
                                    let titlePart = "video";
                                    if (message && message.content) {
                                      titlePart = message.content.replace(/\s+/g, '_').substring(0, 5);
                                    }
                                    const responderNamePart = reaction.name ? reaction.name.replace(/\s+/g, '_') : "UnknownResponder";
                                    let dateTimePart = "timestamp";
                                    if (reaction.createdAt) {
                                      try {
                                        dateTimePart = format(new Date(reaction.createdAt), 'ddMMyyyy-HHmm');
                                      } catch (e) {
                                        console.error("Error formatting date for filename:", e);
                                      }
                                    }
                                    let extension = "video"; // Default fallback
                                    try {
                                      const urlPath = new URL(transformedReactionVideoUrl).pathname;
                                      const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                                      if (lastSegment.includes('.')) {
                                        const ext = lastSegment.split('.').pop()?.split('?')[0];
                                        if (ext) extension = ext;
                                      }
                                    } catch (e) {
                                      console.error("Could not parse transformed reaction video URL for extension:", e);
                                    }
                                    const nameWithoutExtension = `${prefix}-${titlePart}-${responderNamePart}-${dateTimePart}`;
                                    const sanitizedName = nameWithoutExtension.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                                    const finalFilename = `${sanitizedName}.${extension}`;
                                    downloadVideo(transformedReactionVideoUrl, finalFilename);
                                  }}
                                  className="mt-3 flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                  disabled={!transformedReactionVideoUrl}
                                >
                                  <DownloadIcon size={16} />
                                  Download Reaction
                                </button>
                              </>
                            );
                          })()}
                          {/* This button is now part of the self-invoking function above to access transformedReactionVideoUrl */}
                          {/* <button
                            onClick={() => {
                              // For downloading, always use the original, untransformed URL
                              if (!reaction.videoUrl) {
                                console.error("Download clicked but no videoUrl present for reaction:", reaction.id);
                                return;
                              }
                              const prefix = "Reactlyve";
                              let titlePart = "video";
                              if (message && message.content) {
                                titlePart = message.content.replace(/\s+/g, '_').substring(0, 5);
                              }
                              const responderNamePart = reaction.name ? reaction.name.replace(/\s+/g, '_') : "UnknownResponder";
                              let dateTimePart = "timestamp";
                              if (reaction.createdAt) {
                                try {
                                  dateTimePart = format(new Date(reaction.createdAt), 'ddMMyyyy-HHmm');
                                } catch (e) {
                                  console.error("Error formatting date for filename:", e);
                                }
                              }
                              let extension = "video";
                              try {
                                const urlPath = new URL(reaction.videoUrl).pathname;
                                const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                                if (lastSegment.includes('.')) {
                                  const ext = lastSegment.split('.').pop();
                                  if (ext) extension = ext;
                                }
                              } catch (e) {
                                console.error("Could not parse video URL for extension:", e);
                              }
                              const nameWithoutExtension = `${prefix}-${titlePart}-${responderNamePart}-${dateTimePart}`;
                              const sanitizedName = nameWithoutExtension.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                              const finalFilename = `${sanitizedName}.${extension}`;
                              downloadVideo(reaction.videoUrl, finalFilename);
                            }}
                            className="mt-3 flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                          >
                            <DownloadIcon size={16} />
                            Download Reaction
                          </button> */}
                          {reaction.duration && (
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                              Duration: {Math.floor(reaction.duration / 60)}:{(reaction.duration % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </>
                      ) : (
                        (!reaction.replies || reaction.replies.length === 0) &&
                        reaction.moderationStatus !== 'rejected' &&
                        reaction.moderationStatus !== 'manual_review' && (
                          <p className="my-4 text-sm text-neutral-600 dark:text-neutral-400">
                            No reaction video recorded or replies.
                          </p>
                        )
                      )}

                      {reaction.replies && reaction.replies.length > 0 && (
                        <div className="mt-4 border-t pt-3 border-neutral-300 dark:border-neutral-600">
                          <h4 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-white">Replies:</h4>
                          <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                            {reaction.replies.map(reply => (
                              <li key={reply.id} className="border-b pb-1 border-neutral-200 dark:border-neutral-600">
                                "{reply.text}"
                                {' '}
                                <span className="text-xs text-neutral-500">({new Date(reply.createdAt).toLocaleString()})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-md bg-neutral-100 p-5 text-center dark:bg-neutral-700">
                <p className="mb-3 text-neutral-700 dark:text-neutral-300">
                  Share this link with your friend to capture their reaction!
                </p>
                {normalizedMessage.shareableLink && (
                  <button
                    onClick={() => copyToClipboard(normalizedMessage.shareableLink, 'link')}
                    className="mx-auto flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    <LinkIcon size={16} />
                    Copy Shareable Link
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <Modal
          isOpen={showDeleteConfirmModal}
          onClose={() => setShowDeleteConfirmModal(false)}
          title="Delete Message"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowDeleteConfirmModal(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteMessage} disabled={isDeleting} isLoading={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Message'}
              </Button>
            </>
          }
        >
          <p className="text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete this message? This action will also delete all associated reactions and cannot be undone.
          </p>
        </Modal>
        <Modal
          isOpen={showDeleteReactionModal}
          onClose={() => {
            setShowDeleteReactionModal(false);
            setReactionToDeleteId(null); 
          }}
          title="Delete Reaction"
          size="sm"
          footer={
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteReactionModal(false);
                  setReactionToDeleteId(null);
                }} 
                disabled={isDeletingReaction}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteSingleReaction} 
                disabled={isDeletingReaction} 
                isLoading={isDeletingReaction}
              >
                {isDeletingReaction ? 'Deleting...' : 'Delete Reaction'}
              </Button>
            </>
          }
        >
          <p className="text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete this specific reaction? This action cannot be undone.
          </p>
        </Modal>
        <Modal
          isOpen={showDeleteAllReactionsModal}
          onClose={() => setShowDeleteAllReactionsModal(false)}
          title="Clear All Reactions"
          size="sm"
          footer={
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteAllReactionsModal(false)} 
                disabled={isDeletingAllReactions}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteAllReactions} 
                disabled={isDeletingAllReactions} 
                isLoading={isDeletingAllReactions}
              >
                {isDeletingAllReactions ? 'Clearing...' : 'Clear All'}
              </Button>
            </>
          }
        >
          <p className="text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete ALL reactions for this message? This action cannot be undone.
          </p>
        </Modal>

        {/* Passcode Edit Modal */}
        <Modal
          isOpen={isPasscodeModalOpen}
          onClose={handleClosePasscodeModal}
          title="Edit Passcode"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={handleClosePasscodeModal} disabled={isUpdatingPasscode}>
                Cancel
              </Button>
              <Button onClick={handleSavePasscode} disabled={isUpdatingPasscode} isLoading={isUpdatingPasscode}>
                {isUpdatingPasscode ? 'Saving...' : 'Save Passcode'}
              </Button>
            </>
          }
        >
          <div>
            <label htmlFor="passcodeEdit" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Passcode
            </label>
            <Input
              type="text"
              id="passcodeEdit"
              value={currentPasscodeValue}
              onChange={(e) => setCurrentPasscodeValue(e.target.value)}
              placeholder="Leave empty to remove passcode"
              className="w-full dark:bg-neutral-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              If set, users will need this passcode to view the message. Leave empty to remove.
            </p>
          </div>
        </Modal>

        {/* Reaction Length Edit Modal */}
        <Modal
          isOpen={isReactionLengthModalOpen}
          onClose={handleCloseReactionLengthModal}
          title="Edit Reaction Length"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={handleCloseReactionLengthModal} disabled={isUpdatingReactionLength}>
                Cancel
              </Button>
              <Button onClick={handleSaveReactionLength} disabled={isUpdatingReactionLength} isLoading={isUpdatingReactionLength}>
                {isUpdatingReactionLength ? 'Saving...' : 'Save Length'}
              </Button>
            </>
          }
        >
          <div>
            {/* Slider for Reaction Length */}
            <div>
              <label
                htmlFor="reaction_length_modal_slider"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Reaction Recording Length: {currentReactionLengthValue} seconds
              </label>
              <input
                id="reaction_length_modal_slider"
                type="range"
                min="10"
                max="30"
                value={currentReactionLengthValue}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
                onChange={(e) => setCurrentReactionLengthValue(parseInt(e.target.value, 10))}
              />
            </div>
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400"> {/* Adjusted margin for helper text */}
              Adjust the maximum duration for video reactions (10-30 seconds).
            </p>
          </div>
        </Modal>

        <LinksModal
          isOpen={isLinksModalOpen}
          onClose={handleLinksModalClose}
          messageId={id!}
        />
      </div>
    </MainLayout>
  );
};

export default Message;
