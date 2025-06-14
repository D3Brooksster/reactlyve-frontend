import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { messageLinksApi } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { CopyIcon, Share2Icon } from 'lucide-react';

interface LinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  passcode?: string | null;
}

interface LinkItem {
  id: string;
  onetime: boolean;
  viewed: boolean;
  createdAt: string;
  updatedAt: string;
}

const LinksModal: React.FC<LinksModalProps> = ({ isOpen, onClose, messageId }) => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [liveOneTime, setLiveOneTime] = useState(0);
  const [expiredOneTime, setExpiredOneTime] = useState(0);
  const [newOnetime, setNewOnetime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await messageLinksApi.list(messageId);
      setLinks(res.data.links || []);
      if (res.data.stats) {
        setLiveOneTime(res.data.stats.liveOneTime || 0);
        setExpiredOneTime(res.data.stats.expiredOneTime || 0);
      }
    } catch (err) {
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await messageLinksApi.create(messageId, newOnetime);
      toast.success('Link created');
      await fetchLinks();
    } catch (err) {
      toast.error('Failed to create link');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      await messageLinksApi.delete(linkId);
      toast.success('Link deleted');
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err) {
      toast.error('Failed to delete link');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const baseUrl = window.location.origin;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Message Links" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Live one-time links: {liveOneTime} • Viewed: {expiredOneTime}
        </p>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="new-onetime"
            checked={newOnetime}
            onChange={(e) => setNewOnetime(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="new-onetime" className="text-sm text-neutral-700 dark:text-neutral-300">
            One-time link
          </label>
          <Button onClick={handleCreate} isLoading={creating} size="sm">
            Create Link
          </Button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {links.map((link) => {
              const url = `${baseUrl}/view/${link.id}`;
              return (
                <li key={link.id} className="rounded-md border p-2 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-sm break-all">{url}</span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(url)}
                        title="Copy Link"
                      >
                        <CopyIcon size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => (navigator.share ? navigator.share({ url }) : copyToClipboard(url))}
                        title="Share Link"
                      >
                        <Share2Icon size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const el = document.createElement('div');
                          document.body.appendChild(el);
                          const remove = () => document.body.removeChild(el);
                          const qr = (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={remove}>
                              <div className="bg-white p-4 rounded" onClick={(e) => e.stopPropagation()}>
                                <QRCodeSVG value={url} size={200} />
                              </div>
                            </div>
                          );
                          // @ts-ignore
                          ReactDOM.render(qr, el);
                        }}
                        title="Show QR"
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
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(link.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    {link.onetime ? (link.viewed ? 'Viewed' : 'Live') : 'Reusable'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default LinksModal;
