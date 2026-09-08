import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Star, Trash2, Inbox } from 'lucide-react';
import type { Email } from '../types';

export default function EmailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { emails } = useOutletContext<{ emails: Email[] }>();

  const email = emails.find(e => e.id === id);

  if (!email) {
    return (
      <div className="flex flex-col h-full bg-white p-8 items-center justify-center">
        <p className="text-gray-500 mb-4">Email not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-500 hover:underline">Go back</button>
      </div>
    );
  }

  const senderName = "Amanda Clark";
  const senderEmail = "sender@example.com";
  
  const dateStr = email.status === 'SENT' || email.status === 'FAILED' 
    ? (email.sentAt || email.createdAt)
    : email.scheduledAt;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-medium text-gray-900 truncate">
            {email.subject} | {email.id.substring(0, 8).toUpperCase()}
          </h2>
        </div>
        
        <div className="flex items-center space-x-5">
          <button className="text-gray-400 hover:text-yellow-500 transition"><Star className="w-5 h-5" /></button>
          <button className="text-gray-400 hover:text-gray-600 transition"><Inbox className="w-5 h-5" /></button>
          <button className="text-gray-400 hover:text-red-500 transition"><Trash2 className="w-5 h-5" /></button>
          <div className="w-px h-6 bg-gray-200"></div>
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
            <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Email Content Area */}
      <div className="flex-1 overflow-y-auto px-12 py-8 max-w-5xl mx-auto w-full">
        {/* Sender Info Row */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-[#00c853] text-white flex items-center justify-center font-bold text-lg">
              {senderName.charAt(0)}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                {senderName} <span className="text-gray-500 font-normal text-sm ml-1">&lt;{senderEmail}&gt;</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">to {email.recipient} ▾</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(dateStr), 'MMM d, h:mm a')}
          </div>
        </div>

        {/* Body Text */}
        <div className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap mb-8">
          {email.body}
          
          {/* Mocked Highlighted Block to match Figma */}
          {email.body.includes('RECEIVED') && (
            <div className="my-6 bg-[#fffdf0] border-l-2 border-yellow-400 p-4">
              <p className="font-semibold mb-2">⚡ Extremely Exclusive—Only 4 Spots Worldwide Per Year | $25,000 investment ⚡</p>
              <p className="text-sm">To explore securing your private transformation, simply reply right now with <span className="font-bold">"FLY OUT FIX"</span> .</p>
            </div>
          )}
        </div>

        {/* Mocked Attachments to match Figma */}
        <div className="flex space-x-4 mt-8 pt-8 border-t border-gray-100">
          <div className="w-56 rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition">
            <img src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=400&auto=format&fit=crop" className="w-full h-32 object-cover" alt="Tennis" />
            <div className="p-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-900 truncate">Tennis_Coach_Profile.png</p>
              <p className="text-xs text-gray-500">1.2 MB</p>
            </div>
          </div>
          <div className="w-56 rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition">
            <img src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=400&auto=format&fit=crop" className="w-full h-32 object-cover" alt="Tennis 2" />
            <div className="p-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-900 truncate">Tennis_Coach_Profile2.png</p>
              <p className="text-xs text-gray-500">1.2 MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
