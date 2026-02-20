export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    role: 'user' | 'admin' | 'guest';
    lastLogin: string; // Changed from last_login
    blocked: boolean;
    createdAt?: string;
    updatedAt?: string;
    maxMessagesPerMonth: number | null;
    currentMessagesThisMonth: number | null;
    maxReactionsPerMonth: number | null;
    reactionsReceivedThisMonth: number; // Added
    lastUsageResetDate: string | null;
    maxReactionsPerMessage: number | null;
    moderateImages?: boolean;
    moderateVideos?: boolean;
    pendingManualReviews?: number;
    googleId?: string;
    microsoftId?: string;
    facebookId?: string;
    twitterId?: string;
}
