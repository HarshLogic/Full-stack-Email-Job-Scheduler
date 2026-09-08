import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../api';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser()
      .then(() => navigate('/scheduled', { replace: true }))
      .catch(() => {
        // Ignore unauthenticated users and keep them on the login page.
      });
  }, [navigate]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[420px] w-full bg-white p-10 rounded-2xl border border-gray-200">
        <h2 className="text-center text-[32px] font-semibold text-gray-900 mb-8">
          Login
        </h2>
        
        <button
          onClick={handleLogin}
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
            <span className="px-4 bg-white text-gray-400 text-xs">or sign up through email</span>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email ID"
              className="w-full px-4 py-3 bg-[#f7f8f7] border-transparent focus:bg-white focus:border-gray-300 rounded-xl text-sm outline-none transition"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-[#f7f8f7] border-transparent focus:bg-white focus:border-gray-300 rounded-xl text-sm outline-none transition"
            />
          </div>
          <div className="pt-2">
            <button
              type="button"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-[#0fa44a] hover:bg-[#0d8f40] focus:outline-none transition-colors"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
