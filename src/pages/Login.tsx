import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Check if there's a redirect path in the URL (e.g., /login?redirect=/create)
      const params = new URLSearchParams(location.search);
      const redirectPath = params.get('redirect') || '/dashboard';
      navigate(redirectPath);
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleLogin = (provider: 'google' | 'microsoft' | 'facebook' | 'twitter') => {
    setIsProcessingLogin(true);
    login(provider);
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <div className="flex flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Sign in to Reactlyve
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-300">
            Send surprise messages and capture reactions
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10 dark:bg-neutral-800">
            <div className="space-y-4">
              {(['google', 'microsoft', 'facebook', 'twitter'] as const).map(provider => (
                <button
                  key={provider}
                  onClick={() => handleLogin(provider)}
                  disabled={isProcessingLogin}
                  className="flex w-full justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
                >
                  {isProcessingLogin ? 'Processing...' : `Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
                </div>
              </div>
              <div className="mt-6" />
              <div className="mt-6">
                <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                  By signing in, you agree to our{' '}
                  <a href="/terms" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
