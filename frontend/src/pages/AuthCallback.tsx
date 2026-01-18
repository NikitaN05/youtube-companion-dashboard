import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, fetchUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('message') || searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(decodeURIComponent(error));
        return;
      }

      if (token) {
        try {
          setToken(token);
          await fetchUser();
          setStatus('success');
          setTimeout(() => navigate('/'), 1500);
        } catch (err) {
          setStatus('error');
          setErrorMessage('Failed to authenticate. Please try again.');
        }
      } else {
        setStatus('error');
        setErrorMessage('No authentication token received');
      }
    };

    handleCallback();
  }, [searchParams, setToken, fetchUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card glass-strong w-full max-w-md text-center animate-fade-in">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-midnight-500 border-t-accent-teal rounded-full animate-spin" />
            <h2 className="text-xl font-display font-semibold mb-2">Authenticating...</h2>
            <p className="text-gray-400">Please wait while we complete your login</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-accent-teal/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-accent-teal" />
            </div>
            <h2 className="text-xl font-display font-semibold mb-2 text-accent-teal">
              Login Successful!
            </h2>
            <p className="text-gray-400">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-accent-coral/20 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-accent-coral" />
            </div>
            <h2 className="text-xl font-display font-semibold mb-2 text-accent-coral">
              Authentication Failed
            </h2>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

