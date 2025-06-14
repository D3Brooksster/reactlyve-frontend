// import React, { useState, useCallback } from 'react';
// import { useForm, Controller } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { messagesApi } from '../../services/api';
// import { VALIDATION_ERRORS } from '../constants/errorMessages';
// import { MessageFormData } from '../../types/message';
// import { classNames } from '../../utils/classNames';
// import Button from '../common/Button';
// import ImageUploader from './ImageUploader';
// import PasscodeCreator from './PasscodeCreator';
// import LinkGenerator from './LinkGenerator';
// import { showToast } from '../common/ErrorToast';

// // Form validation schema
// const messageSchema = z.object({
//   message: z
//     .string()
//     .min(1, VALIDATION_ERRORS.REQUIRED_FIELD)
//     .max(500, VALIDATION_ERRORS.MESSAGE_TOO_LONG),
//   hasPasscode: z.boolean().default(false),
//   passcode: z.string().optional(),
// });

// type MessageFormValues = z.infer<typeof messageSchema>;

// interface MessageFormProps {
//   className?: string;
// }

// const MessageForm: React.FC<MessageFormProps> = ({ className }) => {
//   const [image, setImage] = useState<File | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [shareableLink, setShareableLink] = useState<string>('');
  
//   // React Hook Form setup
//   const {
//     control,
//     register,
//     handleSubmit,
//     setValue,
//     watch,
//     formState: { errors, isValid },
//   } = useForm<MessageFormValues>({
//     resolver: zodResolver(messageSchema),
//     mode: 'onChange',
//     defaultValues: {
//       message: '',
//       hasPasscode: false,
//       passcode: '',
//     },
//   });
  
//   // Watch form values
//   const hasPasscode = watch('hasPasscode');
//   const passcode = watch('passcode');
  
//   // Handle image upload
//   const handleImageSelect = useCallback((file: File | null) => {
//     setImage(file);
//   }, []);
  
//   // Handle passcode toggle
//   const handleTogglePasscode = useCallback((enabled: boolean) => {
//     setValue('hasPasscode', enabled, { shouldValidate: true });
//     if (!enabled) {
//       setValue('passcode', '', { shouldValidate: true });
//     }
//   }, [setValue]);
  
//   // Handle passcode change
//   const handlePasscodeChange = useCallback((passcode: string) => {
//     setValue('passcode', passcode, { shouldValidate: true });
//   }, [setValue]);
  
// // Submit form
// const onSubmit = useCallback(async (data: MessageFormValues) => {
//     setIsSubmitting(true);
    
//     try {
//       // Prepare form data for API
//       const formData: MessageFormData = {
//         message: data.message,
//         image: image,
//         hasPasscode: data.hasPasscode,
//       };
      
//       if (data.hasPasscode && data.passcode) {
//         formData.passcode = data.passcode;
//       }
      
//       // Call API to create message
//       const response = await messagesApi.create(formData);
      
//       // Check if the response contains a URL that could be the shareable link
//       // Sometimes the backend might name it differently
//       const possibleLinkKeys = ['shareableLink', 'link', 'url', 'shareLink', 'shareUrl'];
//       let linkFound = false;
      
//       for (const key of possibleLinkKeys) {
//         if (response.data[key]) {
//           setShareableLink(response.data[key]);
//           linkFound = true;
//           break;
//         }
//       }
      
//       // Show success message
//       showToast({
//         message: linkFound 
//           ? 'Message created successfully!' 
//           : 'Message created but unable to generate link. Please check your dashboard.',
//         type: linkFound ? 'success' : 'warning',
//       });
//     } catch (error) {
//       console.error('Error creating message:', error);
//       showToast({
//         message: 'Failed to create message. Please try again.',
//         type: 'error',
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [image]);
  
//   // Calculate remaining character count
//   const messageValue = watch('message') || '';
//   const remainingChars = 500 - messageValue.length;
  
//   // If we have a shareable link, show the link generator instead of the form
//   if (shareableLink) {
//     return (
//       <LinkGenerator
//         shareableLink={shareableLink}
//         hasPasscode={hasPasscode}
//         passcode={passcode}
//         className={className}
//       />
//     );
//   }
  
//   return (
//     <form
//       onSubmit={handleSubmit(onSubmit)}
//       className={classNames('space-y-6', className || '')}
//     >
//       {/* Message input */}
//       <div>
//         <label
//           htmlFor="message"
//           className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
//         >
//           Your Surprise Message
//         </label>
//         <div className="mt-1">
//           <Controller
//             name="message"
//             control={control}
//             render={({ field }) => (
//               <textarea
//                 {...field}
//                 id="message"
//                 rows={5}
//                 placeholder="Write your surprise message here..."
//                 className={classNames(
//                   'block w-full rounded-md border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white sm:text-sm',
//                   errors.message ? 'border-red-300 dark:border-red-700' : ''
//                 )}
//               />
//             )}
//           />
//           {errors.message ? (
//             <p className="mt-1 text-sm text-red-600 dark:text-red-400">
//               {errors.message.message}
//             </p>
//           ) : (
//             <p
//               className={classNames(
//                 'mt-1 text-right text-sm',
//                 remainingChars <= 50
//                   ? 'text-red-600 dark:text-red-400'
//                   : 'text-neutral-500 dark:text-neutral-400'
//               )}
//             >
//               {remainingChars} characters remaining
//             </p>
//           )}
//         </div>
//       </div>
      
//       {/* Image uploader */}
//       <div>
//         <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
//           Add an Image (Optional)
//         </label>
//         <div className="mt-1">
//           <ImageUploader
//             onImageSelect={handleImageSelect}
//             onError={(error) => showToast({ message: error, type: 'error' })}
//           />
//         </div>
//       </div>
      
//       {/* Passcode creator */}
//       <div>
//         <PasscodeCreator
//           onTogglePasscode={handleTogglePasscode}
//           onPasscodeChange={handlePasscodeChange}
//           enabled={hasPasscode}
//         />
//       </div>
      
//       {/* Submit button */}
//       <div className="flex justify-end">
//         <Button
//           type="submit"
//           variant="primary"
//           isLoading={isSubmitting}
//           disabled={isSubmitting || !isValid}
//         >
//           {isSubmitting ? 'Creating Message...' : 'Create Message'}
//         </Button>
//       </div>
//     </form>
//   );
// };

// export default MessageForm;

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext'; // Added useAuth import
import { messagesApi, messageLinksApi } from '../../services/api';
import { AxiosError } from 'axios'; // Added import
import { VALIDATION_ERRORS, MESSAGE_ERRORS } from '../constants/errorMessages'; // Modified import
import { classNames } from '../../utils/classNames';
import Button from '../common/Button';
import MediaUploader from './MediaUploader';
import PasscodeCreator from './PasscodeCreator';
import LinkGenerator from './LinkGenerator';
import { showToast } from '../common/ErrorToast';

// Form validation schema
const messageSchema = z.object({
  message: z
    .string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD)
    .max(500, VALIDATION_ERRORS.MESSAGE_TOO_LONG),
  hasPasscode: z.boolean().default(false),
  passcode: z.string().optional(),
  reaction_length: z
    .number()
    .min(10, VALIDATION_ERRORS.REACTION_LENGTH_MIN)
    .max(30, VALIDATION_ERRORS.REACTION_LENGTH_MAX)
    .default(15),
  createOneTimeLink: z.boolean().default(false),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface MessageFormProps {
  className?: string;
}

const MessageForm: React.FC<MessageFormProps> = ({ className }) => {
  const { user } = useAuth(); // Get user from AuthContext

  const isMessageLimitReached = !!(user &&
    user.maxMessagesPerMonth !== null &&
    (user.currentMessagesThisMonth ?? 0) >= user.maxMessagesPerMonth
  );

  const [media, setMedia] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [createdMessageId, setCreatedMessageId] = useState<string>('');
  const [linkStats, setLinkStats] = useState({ liveOneTime: 0, expiredOneTime: 0 });
  
  // React Hook Form setup
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    mode: 'onChange',
    defaultValues: {
      message: '',
      hasPasscode: false,
      passcode: '',
      reaction_length: 15,
      createOneTimeLink: false,
    },
  });
  
  // Watch form values
  const hasPasscode = watch('hasPasscode');
  const passcode = watch('passcode');
  const reactionLengthValue = watch('reaction_length');
  const createOneTimeLink = watch('createOneTimeLink');
  
  // Handle media upload
  const handleMediaSelect = useCallback((file: File | null) => {
    setMedia(file);
    
    if (file) {
      // Determine if it's an image or video based on the file type
      if (file.type.startsWith('image/')) {
        setMediaType('image');
      } else if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setMediaType(null);
      }
    } else {
      setMediaType(null);
    }
  }, []);
  
  // Handle passcode toggle
  const handleTogglePasscode = useCallback((enabled: boolean) => {
    setValue('hasPasscode', enabled, { shouldValidate: true });
    if (!enabled) {
      setValue('passcode', '', { shouldValidate: true });
    }
  }, [setValue]);
  
  // Handle passcode change
  const handlePasscodeChange = useCallback((passcode: string) => {
    setValue('passcode', passcode, { shouldValidate: true });
  }, [setValue]);
  
  // Submit form
  const onSubmit = useCallback(async (data: MessageFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create a FormData object for multipart/form-data submission
      const formData = new FormData();
      
      // Add text data
      formData.append('content', data.message);
      formData.append('hasPasscode', data.hasPasscode.toString());
      
      // Add media file if exists - use key 'media' to match what the backend expects
      if (media) {
        formData.append('media', media);
        // Also send mediaType to help the backend
        formData.append('mediaType', mediaType || '');
        formData.append('mediaSize', media.size.toString());
      }
      
      // Add passcode if enabled
      if (data.hasPasscode && data.passcode) {
        formData.append('passcode', data.passcode);
      }

      // Add reaction length
      formData.append('reaction_length', data.reaction_length.toString());
      formData.append('onetime', 'false');
      
      // Call API to create message with FormData
      const response = await messagesApi.createWithFormData(formData);

      if (response.data.shareableLink) {
        setShareableLink(response.data.shareableLink);
      }
      if (response.data.id) {
        setCreatedMessageId(response.data.id);
      }

      if (createOneTimeLink && response.data.id) {
        try {
          await messageLinksApi.create(response.data.id, true);
        } catch {
          // ignore error, toast handled globally
        }
      }

      if (response.data.id) {
        try {
          const statsRes = await messageLinksApi.list(response.data.id);
          if (statsRes.data.stats) {
            setLinkStats({
              liveOneTime: statsRes.data.stats.liveOneTime || 0,
              expiredOneTime: statsRes.data.stats.expiredOneTime || 0,
            });
          }
        } catch {
          // ignore stats errors
        }
      }
      
      // Show success message
      showToast({
        message: response.data.shareableLink 
          ? 'Message created successfully!' 
          : 'Message created but unable to generate link. Please check your dashboard.',
        type: response.data.shareableLink ? 'success' : 'warning',
      });
    } catch (error) {
      console.error('Error creating message:', error);

      if (error instanceof AxiosError && error.response) {
        const errorMessage = error.response.data?.error || error.response.data?.message || "";
        const isLimitError = (error.response.status === 429 || error.response.status === 403) &&
                             (errorMessage.includes("limit reached") || errorMessage.includes("Message limit reached"));

        if (user?.role === 'guest' && isLimitError) {
          showToast({ message: MESSAGE_ERRORS.GUEST_MESSAGE_LIMIT_REACHED, type: 'error' });
        } else {
          // For non-guest limit errors or other Axios errors with a response,
          // assume global interceptor will handle or has handled it.
          // If global interceptor is not showing a toast for some cases,
          // and one is desired here, it could be added below.
          // For now, this 'else' block means we are intentionally not showing a *local* toast here
          // for non-guest limit errors or other specific Axios errors, relying on global handling.
          // If error.response.data.error or .message was present but not a "limit" error,
          // it would also fall here, likely handled by global interceptor.
        }
      } else {
        // Non-Axios error, or Axios error without a response.
        showToast({
          message: MESSAGE_ERRORS.CREATE_FAILED, // Using the constant
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [media, mediaType, user]); // Added user to dependency array
  
  // Calculate remaining character count
  const messageValue = watch('message') || '';
  const remainingChars = 500 - messageValue.length;
  
  // If we have a shareable link, show the link generator instead of the form
  if (shareableLink) {
    return (
      <LinkGenerator
        shareableLink={shareableLink}
        hasPasscode={hasPasscode}
        passcode={passcode}
        messageId={createdMessageId}
        initialStats={linkStats}
        className={className}
      />
    );
  }
  
  return (
    <>
      {isMessageLimitReached && user && ( // Added user check for safety, though isMessageLimitReached already implies user exists
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
          {user.role === 'guest' ? MESSAGE_ERRORS.GUEST_MESSAGE_LIMIT_REACHED : MESSAGE_ERRORS.USER_MESSAGE_LIMIT_REACHED}
        </div>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={classNames('space-y-6', className || '')}
      encType="multipart/form-data"
    >
      {/* Message input */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Your Surprise Message
        </label>
        <div className="mt-1">
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id="message"
                rows={5}
                placeholder="Write your surprise message here..."
                className={classNames(
                  'block w-full rounded-md border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white sm:text-sm',
                  errors.message ? 'border-red-300 dark:border-red-700' : ''
                )}
                disabled={isMessageLimitReached} // Disable textarea
              />
            )}
          />
          {errors.message ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.message.message}
            </p>
          ) : (
            <p
              className={classNames(
                'mt-1 text-right text-sm',
                remainingChars <= 50
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              )}
            >
              {remainingChars} characters remaining
            </p>
          )}
        </div>
      </div>
      
      {/* Media uploader */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Add Media (Optional)
        </label>
        <div className="mt-1">
          <MediaUploader
            onMediaSelect={handleMediaSelect}
            onError={(error) => showToast({ message: error, type: 'error' })}
            disabled={isMessageLimitReached} // Disable MediaUploader
          />
          {media && (
            <p className="mt-2 text-sm text-green-600">
              {media.name} selected ({Math.round(media.size / 1024)} KB)
              {mediaType && <span className="ml-1">({mediaType})</span>}
            </p>
          )}
        </div>
      </div>
      
      {/* Passcode creator */}
      <div>
        <PasscodeCreator
          onTogglePasscode={handleTogglePasscode}
          onPasscodeChange={handlePasscodeChange}
          enabled={hasPasscode}
          disabled={isMessageLimitReached} // Disable PasscodeCreator
        />
      </div>

      {/* Create first one-time link option */}
      <div className="flex items-center">
        <Controller
          name="createOneTimeLink"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id="createOneTimeLink"
              checked={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-500"
              disabled={isMessageLimitReached}
            />
          )}
        />
        <label
          htmlFor="createOneTimeLink"
          className="ml-2 text-sm font-medium text-neutral-900 dark:text-neutral-100"
        >
          Create a one-time link
        </label>
      </div>

      {/* Reaction Length Slider */}
      <div>
        <label
          htmlFor="reaction_length"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Reaction Recording Length: {reactionLengthValue} seconds
        </label>
        <Controller
          name="reaction_length"
          control={control}
          defaultValue={15} // Controller's own default, useForm defaultValues also sets this
          render={({ field }) => (
            <input
              {...field}
              id="reaction_length"
              type="range"
              min="10"
              max="30"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
              onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
              disabled={isMessageLimitReached} // Disable range slider
            />
          )}
        />
        {errors.reaction_length && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.reaction_length.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting || !isValid || isMessageLimitReached} // Modify disabled state
          title={isMessageLimitReached ? "You have reached your monthly message limit." : undefined} // Add tooltip
        >
          {isSubmitting ? 'Creating Message...' : 'Create Message'}
        </Button>
      </div>
    </form>
    </>
  );
};

export default MessageForm;
