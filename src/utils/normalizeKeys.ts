// src/utils/normalizeKeys.ts

export const normalizeMessage = (message: any) => {
  if (!message) return message;

  const mediaType = message.mediaType || message.mediatype;
  const rawImageUrl = message.imageUrl || message.imageurl;
  const rawVideoUrl = message.videoUrl || message.videourl;

  let finalImageUrl;
  let finalVideoUrl;

  if (mediaType === 'video') {
    finalVideoUrl = rawImageUrl;
    finalImageUrl = null;
    if (message.videoUrl || message.videourl) {
      // Prioritising rawImageUrl for video as per issue
    }
  } else {
    finalImageUrl = rawImageUrl;
    finalVideoUrl = rawVideoUrl;
  }

  return {
    ...message,
    id: message.id,
    content: message.content,
    mediaType: mediaType,
    imageUrl: finalImageUrl,
    videoUrl: finalVideoUrl,
    thumbnailUrl: message.thumbnailUrl || message.thumbnailurl,
    createdAt: message.createdAt || message.createdat,
    updatedAt: message.updatedAt || message.updatedat,
    passcode: message.passcode,
    senderId: message.senderId || message.senderid,
    shareableLink: message.shareableLink || message.shareablelink,
    onetime: message.onetime ?? message.one_time,
    viewed: message.viewed ?? message.link_viewed ?? false,
    linkId: message.linkId || message.link_id,
    fileSizeInBytes: message.fileSizeInBytes || message.mediaSize || message.file_size || undefined,
    reaction_length: message.reaction_length ?? message.reactionLength,
    reactions: (message.reactions || []).map(normalizeReaction),
    passcodeVerified: message.passcodeVerified || false,
    moderationStatus:
      message.moderation_status || message.moderationStatus || null,
    moderationDetails:
      message.moderation_details || message.moderationDetails || null,
  };
};

export const normalizeReaction = (reaction: any) => {
  if (!reaction) return reaction;
  // console.log removed as per request

  return {
    ...reaction,
    id: reaction.id,
    name: reaction.name,
    createdAt: reaction.createdAt || reaction.createdat,
    updatedAt: reaction.updatedAt || reaction.updatedat,
    videoUrl: reaction.videoUrl || reaction.videourl,
    thumbnailUrl: reaction.thumbnailUrl || reaction.thumbnailurl,
    duration: reaction.duration || reaction.videoDuration || reaction.video_duration || reaction.durationInSecs || undefined,
    replies: reaction.replies || [],
    moderationStatus:
      reaction.moderation_status || reaction.moderationStatus || null,
    moderationDetails:
      reaction.moderation_details || reaction.moderationDetails || null,
  };
};

export const normalizeUser = (user: any) => {
  if (!user) return user;


  const normalized = {
    ...user,
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role,
    lastLogin: user.lastLogin || user.last_login,
    blocked: user.blocked,
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at,
    maxMessagesPerMonth:
      user.maxMessagesPerMonth ?? user.max_messages_per_month ?? null,
    currentMessagesThisMonth:
      user.currentMessagesThisMonth ?? user.current_messages_this_month ?? null,
    maxReactionsPerMonth:
      user.maxReactionsPerMonth ?? user.max_reactions_per_month ?? null,
    reactionsReceivedThisMonth:
      user.reactionsReceivedThisMonth ?? user.reactions_received_this_month ?? 0,
    lastUsageResetDate:
      user.lastUsageResetDate ?? user.last_usage_reset_date ?? null,
    maxReactionsPerMessage:
      user.maxReactionsPerMessage ?? user.max_reactions_per_message ?? null,
    moderateImages: user.moderateImages ?? user.moderate_images ?? false,
    moderateVideos: user.moderateVideos ?? user.moderate_videos ?? false,
    pendingManualReviews:
      user.pendingManualReviews ?? user.pending_manual_reviews ?? 0,
  } as const;

  return normalized;
};
