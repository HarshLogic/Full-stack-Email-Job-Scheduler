import { Link, useLocation } from 'react-router-dom';
import { Clock, Send, ChevronDown } from 'lucide-react';
import type { User } from '../types';

interface SidebarProps {
  user: User;
  scheduledCount: number;
  sentCount: number;
}

export default function Sidebar({ user, scheduledCount, sentCount }: SidebarProps) {
  const location = useLocation();
  
  const isScheduled = location.pathname === '/scheduled';
  const isSent = location.pathname === '/sent';

  return (
    <div className="w-[280px] h-full border-r border-gray-200 flex flex-col bg-white">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-3xl font-black tracking-tighter">ONB</h1>
      </div>

      {/* User Profile */}
      <div className="px-4 mb-6">
        <div className="bg-[#f7f7f7] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition">
          <div className="flex items-center space-x-3 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="truncate">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>

      {/* Compose Button */}
      <div className="px-4 mb-8">
        <Link 
          to="/compose"
          className="w-full flex items-center justify-center py-2.5 px-4 border border-[#0fa44a] text-[#0fa44a] font-medium rounded-full hover:bg-[#0fa44a] hover:text-white transition-colors"
        >
          Compose
        </Link>
      </div>

      {/* Navigation */}
      <div className="px-4 flex-1">
        <h3 className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">CORE</h3>
        <nav className="space-y-1">
          <Link
            to="/scheduled"
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              isScheduled ? 'bg-[#e6f6ec] text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-3" />
              <span className="text-sm font-medium">Scheduled</span>
            </div>
            <span className="text-xs font-medium text-gray-500">{scheduledCount}</span>
          </Link>
          
          <Link
            to="/sent"
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              isSent ? 'bg-[#e6f6ec] text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <Send className="w-4 h-4 mr-3" />
              <span className="text-sm font-medium">Sent</span>
            </div>
            <span className="text-xs font-medium text-gray-500">{sentCount}</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
