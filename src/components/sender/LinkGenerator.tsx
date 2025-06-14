import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { classNames } from '../../utils/classNames';
import Button from '../common/Button';
import { showToast } from '../common/ErrorToast';
import LinksModal from '../dashboard/LinksModal';
import { messageLinksApi } from '../../services/api';

interface LinkGeneratorProps {
  shareableLink: string;
  hasPasscode: boolean;
  passcode?: string;
  messageId?: string;
  initialStats?: { liveOneTime: number; expiredOneTime: number };
  className?: string;
}

const LinkGenerator: React.FC<LinkGeneratorProps> = ({
  shareableLink,
  hasPasscode,
  passcode,
  messageId,
  initialStats,
  className,
}) => {
  const [showQrCode, setShowQrCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const passcodeInputRef = useRef<HTMLInputElement>(null);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [linkStats, setLinkStats] = useState(
    initialStats || { liveOneTime: 0, expiredOneTime: 0 }
  );

  useEffect(() => {
    const fetchStats = async () => {
      if (!messageId) return;
      try {
        const res = await messageLinksApi.list(messageId);
        if (res.data.stats) {
          setLinkStats({
            liveOneTime: res.data.stats.liveOneTime || 0,
            expiredOneTime: res.data.stats.expiredOneTime || 0,
          });
        }
      } catch {
        // ignore
      }
    };
    fetchStats();
  }, [messageId]);

  const handleLinksModalClose = () => {
    setIsLinksModalOpen(false);
    if (messageId) {
      messageLinksApi
        .list(messageId)
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

  // Removed getQrCodeUrl function

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (shareableLink) {
      try {
        await navigator.clipboard.writeText(shareableLink);
        setCopied(true);
        showToast({ message: 'Link copied to clipboard!', type: 'success' });
        
        // Reset the "Copied" state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        showToast({ message: 'Failed to copy link', type: 'error' });
      }
    }
  };

  // Copy passcode to clipboard
  const handleCopyPasscode = async () => {
    if (passcode) {
      try {
        await navigator.clipboard.writeText(passcode);
        showToast({ message: 'Passcode copied to clipboard!', type: 'success' });
      } catch (error) {
        showToast({ message: 'Failed to copy passcode', type: 'error' });
      }
    }
  };

  const handleEmailShare = () => {
    if (shareableLink) {
      const subject = 'Check out my surprise message!';
      let body = `I've sent you a surprise message. Click the link below to view it:

${shareableLink}`;
      
      if (hasPasscode && passcode) {
        body += `

Passcode: ${passcode}`; // Ensures only this is added for the passcode
      }

      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl);
    }
  };

  const handleShare = () => {
    if (!shareableLink) return;
    
    if (navigator.share) {
      let shareText;
      if (hasPasscode && passcode) {
        shareText = `Check out my surprise message!
Passcode: ${passcode}

`; // Added double trailing
      } else {
        shareText = 'Check out my surprise message!\n\n'; // Added double trailing
      }
      
      navigator.share({
        title: 'Reactlyve Message',
        text: shareText,
        url: shareableLink,
      }).catch(error => {
        console.error('Error sharing:', error);
        // Fallback to copy link if sharing fails
        handleCopyLink();
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopyLink();
    }
  };

  return (
    <div className={classNames('rounded-lg bg-white p-6 shadow-md dark:bg-neutral-800', className || '')}>
      <div className="text-center mb-6">
        <div className="h-16 w-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-neutral-900 dark:text-white">Message Created Successfully!</h2>
        <p className="mt-1 text-neutral-600 dark:text-neutral-300">
          Share this link with someone to capture their reaction
        </p>
      </div>

      {/* Shareable link input */}
      <div className="mt-4">
        <label htmlFor="shareable-link" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Shareable Link
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="shareable-link"
            readOnly
            value={shareableLink}
            className="flex-1 rounded-l-md border-r-0 border-neutral-300 bg-neutral-50 px-3 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
          <Button
            type="button"
            variant="primary"
            className="rounded-l-none"
            onClick={handleCopyLink}
          >
            {copied ? (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied
              </span>
            ) : (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                </svg>
                Copy Link
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Passcode section (if applicable) */}
      {hasPasscode && passcode && (
        <div className="mt-4">
          <label htmlFor="passcode" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Passcode
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="passcode"
              readOnly
              value={passcode}
              className="flex-1 rounded-l-md border-r-0 border-neutral-300 bg-neutral-50 px-3 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
            <Button
              type="button"
              variant="primary"
              className="rounded-l-none"
              onClick={handleCopyPasscode}
            >
              Copy Passcode
            </Button>
          </div>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Share this passcode separately with the recipient. They'll need it to view your message.
          </p>
        </div>
      )}

      {messageId && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-neutral-100 p-3 dark:bg-neutral-700">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            One-time: {linkStats.liveOneTime} live / {linkStats.expiredOneTime} viewed
          </p>
          <Button size="sm" variant="outline" onClick={() => setIsLinksModalOpen(true)}>
            Manage
          </Button>
        </div>
      )}

      {/* Share options */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button 
          variant="secondary"
          fullWidth
          onClick={handleShare}
          leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          }
        >
          Share
        </Button>
        
        <Button 
          variant="outline"
          fullWidth
          onClick={handleEmailShare}
          leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          }
        >
          Email
        </Button>
        
        <Button 
          variant="outline"
          fullWidth
          onClick={() => setShowQrCode(!showQrCode)}
          leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
              <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
            </svg>
          }
        >
          QR Code
        </Button>
      </div>

      {/* QR Code display */}
      {showQrCode && (
        <div className="mt-5 flex flex-col items-center">
          <div className="p-4 bg-white rounded-lg shadow-sm inline-block"> {/* Added inline-block for tighter fit if needed */}
            <QRCodeSVG
              value={shareableLink} // Use the component prop
              size={250} // Adjust size as needed, e.g., to fit within max-w-xs
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
            />
          </div>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Scan this QR code to access your message directly
          </p>
        </div>
      )}


      {/* Create another message button */}
      <div className="mt-6 text-center">
        <Button
          as="a"
          href="/create"
          variant="primary"
        >
          Create Another Message
        </Button>
      </div>
      {messageId && (
        <LinksModal
          isOpen={isLinksModalOpen}
          onClose={handleLinksModalClose}
          messageId={messageId}
        />
      )}
    </div>
  );
};

export default LinkGenerator;