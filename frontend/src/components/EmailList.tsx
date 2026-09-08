import { format } from 'date-fns';
import type { Email } from '../types';
import { Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmailListProps {
  emails: Email[];
  loading: boolean;
  type: 'SCHEDULED' | 'SENT';
}

export default function EmailList({ emails, loading, type }: EmailListProps) {
  const navigate = useNavigate();

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading emails...</div>;
  }

  if (emails.length === 0) {
    return <div className="p-8 text-center text-gray-400">No emails found.</div>;
  }

  return (
    <div className="w-full">
      {emails.map((email) => {
        // Simple name extraction from email string for display
        const nameMatch = email.recipient.split('@')[0];
        const displayName = nameMatch.charAt(0).toUpperCase() + nameMatch.slice(1);
        
        const dateStr = email.status === 'SENT' || email.status === 'FAILED' 
          ? (email.sentAt || email.createdAt)
          : email.scheduledAt;
          
        const formattedDate = format(new Date(dateStr), 'EEE h:mm:ss a');

        return (
          <div 
            key={email.id} 
            onClick={() => navigate(`/email/${email.id}`)}
            className="flex items-center px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer group"
          >
            {/* Recipient */}
            <div className="w-[180px] flex-shrink-0 text-sm font-medium text-gray-900">
              To: {displayName}
            </div>

            {/* Badge */}
            <div className="w-[180px] flex-shrink-0">
              {type === 'SCHEDULED' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fef0dd] text-[#d67b27]">
                  <Clock className="w-3 h-3 mr-1" />
                  {formattedDate}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {email.status === 'FAILED' ? 'Failed' : 'Sent'}
                </span>
              )}
            </div>

            {/* Subject and Body */}
            <div className="flex-1 min-w-0 flex items-center pr-4">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {email.subject}
              </span>
              <span className="mx-2 text-gray-300">-</span>
              <span className="text-sm text-gray-500 truncate">
                {email.body}
              </span>
            </div>

            {/* Star Action */}
            <div className="flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Star className="w-4 h-4 text-gray-300 hover:text-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
