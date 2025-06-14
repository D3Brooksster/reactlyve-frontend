import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MESSAGE_ERRORS } from '../components/constants/errorMessages';
import PasscodeEntry from '../components/recipient/PasscodeEntry';
import MessageViewer from '../components/recipient/MessageViewer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api, { repliesApi } from '../services/api';
import { Message as MessageData } from '../types/message';

const View: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [message, setMessage] = useState<MessageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPasscode, setNeedsPasscode] = useState(false);
  const [passcodeVerified, setPasscodeVerified] = useState(false);

  // ⏲️ Track reaction session ID statefully
  const reactionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());

  const handleInitReactionId = (id: string) => {
    reactionIdRef.current = id;
    sessionStartTimeRef.current = Date.now();
  };

  useEffect(() => {
    const fetchMessage = async () => {
      if (!id) {
        setError('Invalid message link');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/messages/view/${id}`);
        if (response.data.onetime && response.data.viewed) {
          setError(MESSAGE_ERRORS.LINK_EXPIRED);
          return;
        }
        const messageId = response.data.id;
        const messageData = (await api.get(`/messages/${messageId}`)).data;
        if (response.data.onetime !== undefined) {
          messageData.onetime = response.data.onetime;
        }
        if (response.data.viewed !== undefined) {
          messageData.viewed = response.data.viewed;
        }

        const requiresPasscode = response.data.hasPasscode === true;
        const isVerified = response.data.passcodeVerified === true || !requiresPasscode;

        setMessage(messageData);
        setNeedsPasscode(requiresPasscode && !isVerified);
        setPasscodeVerified(isVerified);
      } catch (err) {
        console.error('Error fetching message:', err);
        setError(MESSAGE_ERRORS.NOT_FOUND);
      } finally {
        setLoading(false);
        // window.scrollTo(0, 0); // Removed as per new strategy
      }
    };

    fetchMessage();
  }, [id]);

  // Scroll to top when message is loaded
  useEffect(() => {
    if (message) {
      window.scrollTo(0, 0);
    }
  }, [message]);

  const handleSubmitPasscode = async (passcode: string): Promise<boolean> => {
    if (!id || !message) return false;

    try {
      const verify = await api.post(`/messages/${id}/verify-passcode`, { passcode });

      const updatedView = await api.get(`/messages/view/${id}`);
      if (updatedView.data.onetime && updatedView.data.viewed) {
        setError(MESSAGE_ERRORS.LINK_EXPIRED);
        return false;
      }
      const updatedMsg = await api.get(`/messages/${updatedView.data.id}`);

      if (verify.data?.verified || verify.status === 200) {
        setPasscodeVerified(true);
        if (updatedMsg.data) setMessage(updatedMsg.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error verifying passcode:', err);
      return false;
    }
  };

  const handleRecordReaction = async (): Promise<void> => {
    toast.success('Your reaction has been recorded!');
  };

  const handleSendTextReply = async (_messageId: string, text: string): Promise<void> => {
    const currentReactionId = reactionIdRef.current;

    if (!currentReactionId) {
      toast.error('Reply channel not ready yet. Please wait a moment and try again.');
      return;
    }

    try {
      await repliesApi.sendText(currentReactionId, text);
      toast.success('Your reply has been sent!');
    } catch (error) {
      console.error('Error uploading reply:', error);
      toast.error('Failed to upload reply. Please try again.');
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">Loading message...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-900">
        <div className="max-w-md text-center">
          <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {error === MESSAGE_ERRORS.NOT_FOUND
              ? 'Message Not Found'
              : error === MESSAGE_ERRORS.LINK_EXPIRED
              ? 'Link Expired'
              : 'Error'}
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (needsPasscode && !passcodeVerified) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-900">
        <PasscodeEntry onSubmitPasscode={handleSubmitPasscode} />
      </div>
    );
  }

  if (message && (passcodeVerified || !needsPasscode)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-start bg-neutral-50 px-4 py-8 dark:bg-neutral-900 sm:py-12">
        <MessageViewer
          message={message}
          onRecordReaction={async () => {}} // Changed to an async no-op function
          onLocalRecordingComplete={() => {
            handleRecordReaction();
          }}
          onSubmitPasscode={handleSubmitPasscode}
          onSendTextReply={handleSendTextReply}
          onInitReactionId={handleInitReactionId}
          linkId={id}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="text-center">
        <p className="text-neutral-600 dark:text-neutral-300">
          Something went wrong. Please try again later.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-700"
        >
          Return Home
        </button>
      </div>
    </div>
  );
};

export default View;
