import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Email } from '../types';
import EmailList from '../components/EmailList';
import TopBar from '../components/TopBar';

export default function SentList() {
  const { emails } = useOutletContext<{ emails: Email[] }>();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmails = useMemo(() => {
    return emails
      .filter(e => e.status === 'SENT' || e.status === 'FAILED')
      .filter(e => 
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.recipient.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [emails, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onRefresh={() => window.location.reload()} 
      />
      <div className="flex-1 overflow-y-auto">
        <EmailList emails={filteredEmails} loading={false} type="SENT" />
      </div>
    </div>
  );
}
