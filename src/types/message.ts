import type { Reaction } from './reaction';

export interface Message {
  id: string;
  userId?: string;
  senderId: string;
  reactionId?: string;
  content: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  hasPasscode?: boolean;
  requiresPasscode?: boolean;
  passcode?: string;
  shareableLink: string;
  link?: string;
  url?: string;
  viewCount?: number;
  viewed?: boolean;
  onetime?: boolean;
  linkId?: string;
  createdAt: string;
  updatedAt?: string;
  videoUrl?: string | null;
  mediaType?: 'image' | 'video';
  duration?: number;
  reaction_length?: number;
  max_reactions_allowed?: number | null; // Add this line
  reactions_used?: number;
  reactions_remaining?: number;
  moderation_status?: string | null;
  moderation_details?: string | null;
  isreply?: string;
  sender?: {
    name: string;
    picture?: string;
  };
  passcodeVerified?: boolean;
  replies?: Reply[];
  reactions?: Reaction[];
}

export interface Reply {
  id: string;
  text: string;
  createdAt: string;
}

export interface MessageFormData {
  message: string;
  image?: File | null;
  hasPasscode: boolean;
  passcode?: string;
}

export interface MessageWithReactions extends Message {
  reactions: Reaction[];
}

export interface MessageLink {
  id: string;
  onetime: boolean;
  viewed: boolean;
  createdAt: string;
  updatedAt: string;
}

