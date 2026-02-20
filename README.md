# Reactlyve Frontend

## Overview

Reactlyve is a modern web application that allows users to create and share surprise messages (video, image, or text) and, **with recipient consent**, record their authentic reactions via webcam. Built with React, TypeScript, and Tailwind CSS, it offers a seamless user experience with a focus on capturing genuine moments and respecting user privacy.

## Features

- **Create surprise messages** with optional images and passcode protection
- **Generate unique shareable links** to send to recipients
- **Record reactions** via webcam when recipients view messages
- **Dashboard** for managing messages and viewing reactions
- **Social login** with Google, Microsoft, Facebook and Twitter
- **Share links via QR codes** for easy access on any device
- **Download reaction videos** to save or repost later
- **Admin portal** for user management and content moderation
- **Automatic media moderation** using AWS Rekognition
- **Profile page** to review usage limits or delete your account and data
- **Responsive design** for desktop and mobile devices
- **Dark/light mode** support with persistent theme preference
- Comprehensive and up-to-date legal documentation (Terms of Service, Privacy Policy, Cookie Policy) ensuring transparency and user rights.

## Tech Stack

- **Framework**: React.js with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Form Handling**: React Hook Form with Zod validation
- **API Communication**: Axios
- **UI Components**: Custom components built on Headless UI
- **Notifications**: React Hot Toast
- **Media Handling**: Native Web APIs (MediaStream, MediaRecorder)

## Project Structure

```
reactlyve-frontend/
├── public/            # Public assets
├── src/               # Source code
│   ├── components/    # Reusable components
│   │   ├── auth/      # Authentication components
│   │   ├── common/    # Common UI components
│   │   ├── dashboard/ # Dashboard components
│   │   ├── recipient/ # Recipient facing components
│   │   └── sender/    # Sender facing components
│   ├── context/       # Context providers
│   ├── hooks/         # Custom hooks
│   ├── layouts/       # Page layouts
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── styles/        # Global styles
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── constants/     # Constants
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry point
├── index.html         # HTML template
├── tailwind.config.js # Tailwind CSS configuration
└── package.json       # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/spacecode-library/reactlyve-frontend.git
   cd reactlyve-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   VITE_API_URL=http://localhost:8000/api
   VITE_CLOUDINARY_LOGO_ID=Reactlyve_Logo_bi78md
   VITE_CLOUDINARY_LOGO_SCALE=0.3
   # OAuth provider credentials
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

   MS_CLIENT_ID=your_microsoft_client_id
   MS_CLIENT_SECRET=your_microsoft_client_secret
   MS_CALLBACK_URL=http://localhost:3000/api/auth/microsoft/callback

   FB_CLIENT_ID=your_facebook_app_id
   FB_CLIENT_SECRET=your_facebook_app_secret
   FB_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback

   TWITTER_CONSUMER_KEY=your_twitter_consumer_key
   TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret
   TWITTER_CALLBACK_URL=http://localhost:3000/api/auth/twitter/callback
   ```

After registering each provider and adding the credentials to your `.env`, the frontend can trigger authentication using:

```
GET /api/auth/google
GET /api/auth/microsoft
GET /api/auth/facebook
GET /api/auth/twitter
```

The backend handles each callback and redirects to `/auth/success`. Fetch the authenticated user via `/api/auth/me` to get all provider IDs.

   If `VITE_API_URL` is omitted, the app defaults to `https://api.reactlyve.com/api`.
   `VITE_CLOUDINARY_LOGO_ID` controls the Cloudinary overlay used in generated media.
  `VITE_CLOUDINARY_LOGO_SCALE` sets the watermark width relative to the asset (default: 0.3).

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Visit `http://localhost:5173` in your browser

### Build for Production

Install dependencies (including dev dependencies) and run the production build. Even for production builds the TypeScript compiler relies on dev packages such as `@types/jest` and `@types/node`, so avoid using `--omit=dev` when installing:

```bash
npm install --legacy-peer-deps  # ensure dev dependencies are installed
npm run build
```

To serve the built app locally:

```bash
npm start
```

### Running Tests

Execute the test suite using:

```bash
npm test
```

The `test` script in `package.json` runs Jest with `NODE_ENV=test` so the tests
use the correct environment settings.

## Key Components

### Authentication

Reactlyve supports OAuth authentication with Google, Microsoft, Facebook and Twitter. Each provider can be initiated via `/api/auth/{provider}` and the backend redirects back to `/auth/success` after successful authentication.

```typescript
// Example of initiating OAuth with basic host validation
const handleLogin = (provider: 'google' | 'microsoft' | 'facebook' | 'twitter') => {
  const url = `${import.meta.env.VITE_API_URL}/auth/${provider}`;
  const allowed = ['localhost', 'api.reactlyve.com'];
  if (allowed.includes(new URL(url).hostname)) {
    window.location.href = url;
  }
};
```

After authentication the backend sets an **HTTP-only** `token` cookie with the
`Secure` flag and `SameSite=Strict`. The cookie is automatically sent with
`fetch`/`axios` requests when `withCredentials` or `credentials: 'include'` is
enabled and is not accessible to client JavaScript. Use the `/auth/logout`
endpoint to clear this session cookie when signing out.

### Media Handling

The application uses native Web APIs to access the user's webcam and record video:

- `navigator.mediaDevices.getUserMedia()` - To access the webcam
- `MediaRecorder` - To record video

These are abstracted into custom hooks:

- `useWebcam` - Manages webcam access and permissions
- `useMediaRecorder` - Manages video recording

### Form Validation

All forms are validated using Zod schemas through React Hook Form:

```typescript
// Example validation schema
const messageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message cannot exceed 500 characters'),
  hasPasscode: z.boolean().default(false),
  passcode: z.string().optional(),
});
```

## Development Guidelines

### Coding Standards

- Use TypeScript for all new code
- Follow the existing project structure
- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Use custom hooks to abstract complex logic

### Commit Guidelines

- Use conventional commit messages: `feat:`, `fix:`, `chore:`, etc.
- Keep commits focused on a single change
- Reference issue numbers in commit messages when applicable

### Pull Request Process

1. Ensure your code passes all tests and linting
2. Update documentation to reflect any changes
3. Include screenshots for UI changes
4. Request review from at least one team member

## Common Issues and Troubleshooting

### Webcam Access

If you're having issues with webcam access during development:

- Ensure you're running the app over HTTPS or localhost
- Check browser permissions
- Try using an incognito/private window

### TypeScript Errors

Some common TypeScript errors and solutions:

1. **RefObject Type Errors**: For refs that start as null but will be populated later, use type assertion:

   ```typescript
   const videoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>;
   ```

2. **Event Handling**: When handling native events that TypeScript doesn't have complete types for:

   ```typescript
   const handleError = (event: Event) => {
     const errorEvent = event as any;
     console.error(errorEvent.error);
   };
   ```

3. **Missing Jest/Node Types**: If you encounter errors like `Cannot find type definition file for 'jest'` or `'node'`, ensure you've installed dependencies first. Use:
   ```bash
    npm install --legacy-peer-deps
   ```
   This installs all dev dependencies such as `@types/jest` and `@types/node` required for the TypeScript build. Avoid passing `--omit=dev` or `--production` when installing.

### API Integration

The application expects a backend API at `http://localhost:8000/api`. Ensure the backend server is running and accessible.

### Content Security Policy

The `frame-ancestors` directive cannot be enforced through the `<meta>` tag included in `index.html`. Configure your backend server to send a `Content-Security-Policy` HTTP header that includes `frame-ancestors 'none';` (or any allowed origins). This header replaces the `<meta>` directive and ensures browsers block framing as intended.

### Usercentrics Autoblocker preload warning

The Usercentrics autoblocker script injects a `rel="preload"` link for the Vite
module bundle. Browsers expect the associated `<script>` tag to use the same
credentials mode as this preload. The bundle is fetched anonymously, so the
`index.html` script tag includes the `crossorigin` attribute to match and avoid
"preload credentials mode does not match" warnings.

## Key Custom Hooks

### `useAuth`

Manages authentication state and provides login/logout functionality.

```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

### `useWebcam`

Manages webcam access, permissions, and streams.

```typescript
const { stream, videoRef, isLoading, error, startWebcam, stopWebcam, permissionState } =
  useWebcam();
```

### `useMediaRecorder`

Handles video recording from a MediaStream.

```typescript
const {
  status,
  recordedBlob,
  duration,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
} = useMediaRecorder({ stream });
```

### `useLocalStorage`

Persists state in localStorage with automatic syncing across tabs.

```typescript
const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Acknowledgments

- [Headless UI](https://headlessui.dev/) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React Hook Form](https://react-hook-form.com/) for form handling
- [Zod](https://github.com/colinhacks/zod) for validation
- [React Router](https://reactrouter.com/) for routing
- [Heroicons](https://heroicons.com/) for icons

---

© 2025 Reactlyve Team. All rights reserved.
