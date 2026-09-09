import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL, getCurrentUser, demoLogin } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(() => navigate('/scheduled', { replace: true }))
      .catch(() => {
        // Ignore unauthenticated users and keep them on the login page.
      });
  }, [navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleDemoLogin = async () => {
    try {
      setDemoLoading(true);
      await demoLogin();
      toast.success('Logged in as Demo Tester!');
      navigate('/scheduled', { replace: true });
    } catch (err: any) {
      console.error('Demo login error:', err);
      toast.error(err?.response?.data?.error || 'Demo login failed. Check backend connection.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[420px] w-full bg-white p-10 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-center text-[32px] font-semibold text-gray-900 mb-2">
          Login
        </h2>
        <p className="text-center text-xs text-gray-500 mb-8">
          Sign in to access your Email Job Scheduler dashboard
        </p>

        {/* Quick Demo Login Button for instant test */}
        <button
          onClick={handleDemoLogin}
          disabled={demoLoading}
          className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#0fa44a] hover:bg-[#0d8f40] transition-colors mb-4 shadow-sm"
        >
          {demoLoading ? 'Logging in...' : '⚡ Quick Demo Login (Instant Test)'}
        </button>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-medium text-gray-700 bg-[#eef6f0] hover:bg-[#e2f0e5] transition-colors mb-6"
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google" 
            className="w-5 h-5 mr-3"
          />
          Login with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400 text-xs">or test login with email</span>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleDemoLogin(); }} className="space-y-4">
          <div>
            <input
              type="email"
              defaultValue="demo@emailscheduler.com"
              placeholder="Email ID"
              className="w-full px-4 py-3 bg-[#f7f8f7] border-transparent focus:bg-white focus:border-gray-300 rounded-xl text-sm outline-none transition"
            />
          </div>
          <div>
            <input
              type="password"
              defaultValue="password123"
              placeholder="Password"
              className="w-full px-4 py-3 bg-[#f7f8f7] border-transparent focus:bg-white focus:border-gray-300 rounded-xl text-sm outline-none transition"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={demoLoading}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none transition-colors"
            >
              {demoLoading ? 'Signing In...' : 'Sign In with Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
