import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { format } from 'date-fns';
import { DownloadIcon } from 'lucide-react';
import { reactionsApi, messagesApi } from '@/services/api';
import Button from '../components/common/Button';
import VideoPlayer from '../components/dashboard/VideoPlayer';
import type { MessageWithReactions } from '@/types/message';
import type { Reaction } from '@/types/reaction';
import { normalizeReaction } from '../utils/normalizeKeys';
import { getTransformedCloudinaryUrl } from '../utils/mediaHelpers';
import toast from 'react-hot-toast'; // For user feedback

const ReactionPage: React.FC = () => {
  const { reactionId } = useParams<{ reactionId: string }>();
  const [reaction, setReaction] = useState<Reaction & { replies?: any[] } | null>(null);
  const [parentMessage, setParentMessage] = useState<MessageWithReactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Define processedVideoUrl
  let processedVideoUrl: string | null | undefined = null;
  if (reaction?.videoUrl) {
    processedVideoUrl = getTransformedCloudinaryUrl(reaction.videoUrl, 0);
  } else {
    processedVideoUrl = reaction?.videoUrl; // Could be null or undefined
  }

  useEffect(() => {
    const fetchReactionAndMessage = async () => {
      try {
        if (!reactionId) return;

        const reactionRes = await reactionsApi.getById(reactionId);

        const rawReactionData = reactionRes.data;
        if (rawReactionData) {
          const normalizedReactionData = normalizeReaction(rawReactionData);
          setReaction(normalizedReactionData);

          // Fetch the parent message if available
          if (normalizedReactionData?.messageid) {
            const messageRes = await messagesApi.getById(normalizedReactionData.messageid);
            const fetchedParentMessage = messageRes.data;
            setParentMessage(fetchedParentMessage);

            if (fetchedParentMessage?.reactions) {
              // Ensure reactionFromParent check uses normalizedReactionData.id
              const reactionFromParent = fetchedParentMessage.reactions.find(
                (r: Reaction) => r.id === (normalizedReactionData?.id || reactionId)
              );

              if (reactionFromParent && reactionFromParent.replies) {
                setReaction(prevReaction => {
                  if (!prevReaction) return null;
                  return {
                    ...prevReaction,
                    replies: reactionFromParent.replies,
                  };
                });
              }
            }
          }
        } else {
          setReaction(null);
        }

        window.scrollTo(0, 0);
      } catch (err) {
        console.error(err);
        setError('Failed to load reaction');
      } finally {
        setLoading(false);
      }
    };

    fetchReactionAndMessage();
  }, [reactionId]);

  const downloadVideo = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
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

  // getDownloadFilename function is removed

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !reaction) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="mt-2 text-neutral-700 dark:text-neutral-300">
              {error || 'Reaction not found'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const formattedDateDisplay = reaction?.createdAt ? format(new Date(reaction.createdAt), 'dd MMM yyyy, HH:mm') : 'Date not available';

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-neutral-800">
          <h1 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">Reaction Details</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{formattedDateDisplay}</p>

          {reaction?.name && (
            <p className="mt-2 text-neutral-700 dark:text-neutral-300">
              <strong>From:</strong> {reaction.name}
            </p>
          )}
          {(reaction?.moderationStatus === 'rejected' ||
            reaction?.moderationStatus === 'manual_review') && (
            <div className="mt-2 text-neutral-700 dark:text-neutral-300">
              <p className="mb-1 break-words text-base font-medium text-neutral-500 dark:text-neutral-400">
                {reaction.moderationDetails ? `This video was rejected: ${reaction.moderationDetails}` : 'This video failed moderation.'}
              </p>
              <Button
                size="sm"
                className="mt-1"
                disabled={reaction?.moderationStatus === 'manual_review'}
                onClick={async () => {
                  setIsSubmittingReview(true);
                  try {
                    await reactionsApi.submitForManualReview(reaction.id);
                    toast.success('Submitted for manual review');
                  } catch (err) {
                    toast.error('Failed to submit review');
                  } finally {
                    setIsSubmittingReview(false);
                  }
                }}
                isLoading={isSubmittingReview}
              >
                {reaction?.moderationStatus === 'manual_review' ? 'Manual Review Pending' : 'Request Review'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {processedVideoUrl &&
        reaction?.moderationStatus !== 'rejected' &&
        reaction?.moderationStatus !== 'manual_review' ? (
        <div className="px-4 py-8">
          <VideoPlayer
            src={processedVideoUrl || ''}
            poster={reaction?.thumbnailUrl || undefined}
            className="w-full aspect-video rounded-lg object-contain"
            initialDurationSeconds={typeof reaction?.duration === 'number' ? reaction.duration : undefined}
          />
          <button
            onClick={() => {
              if (processedVideoUrl) {
                const prefix = "Reactlyve";
                let titlePart = "video";
                if (parentMessage && parentMessage.content) {
                  titlePart = parentMessage.content.replace(/\s+/g, '_').substring(0, 5);
                }
                const responderNamePart = reaction?.name ? reaction.name.replace(/\s+/g, '_') : "UnknownResponder";
                let dateTimePart = "timestamp";
                if (reaction?.createdAt) {
                  try {
                    dateTimePart = format(new Date(reaction.createdAt), 'ddMMyyyy-HHmm');
                  } catch (e) {
                    console.error("Error formatting date for filename:", e);
                  }
                }
                let extension = "mp4"; // Default to mp4
                if (processedVideoUrl) { // Redundant check, but safe
                  try {
                    const urlPath = new URL(processedVideoUrl).pathname;
                    const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                    if (lastSegment.includes('.')) {
                      const ext = lastSegment.split('.').pop()?.split('?')[0];
                      if (ext) extension = ext;
                    }
                  } catch (e) {
                    console.error("Could not parse processed video URL for extension:", e);
                  }
                }
                const nameWithoutExtension = `${prefix}-${titlePart}-${responderNamePart}-${dateTimePart}`;
                const sanitizedName = nameWithoutExtension.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                const finalFilename = `${sanitizedName}.${extension}`;
                downloadVideo(processedVideoUrl, finalFilename);
              } else {
                toast.error("Download URL is not available.");
              }
            }}
            className="mt-4 flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            disabled={!processedVideoUrl}
          >
            <DownloadIcon size={16} />
            Download Video
          </button>
        </div>
      ) : (
        reaction?.moderationStatus !== 'rejected' &&
        reaction?.moderationStatus !== 'manual_review' && (
          <p className="mt-4 text-center text-neutral-600 dark:text-neutral-400">
            No video attached to this reaction.
          </p>
        )
      )}

      {/* Replies */}
      {reaction?.replies && reaction.replies.length > 0 && (
        <div className="mx-auto max-w-3xl px-4 py-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Replies</h2>
          <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            {reaction.replies.map(reply => (
              <li key={reply.id} className="border-b pb-2 border-neutral-200 dark:border-neutral-600">
                “{reply.text}”{' '}
                <span className="text-xs text-neutral-500">
                  ({new Date(reply.createdAt).toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </MainLayout>
  );
};

export default ReactionPage;