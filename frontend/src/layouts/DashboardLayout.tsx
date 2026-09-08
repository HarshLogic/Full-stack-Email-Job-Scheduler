import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getCurrentUser, getEmails } from '../api';
import type { User, Email } from '../types';

export default function DashboardLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser()
      .then(({ user }) => setUser(user))
      .catch(() => navigate('/login'));
      
    getEmails().then(({ results }) => setEmails(results)).catch(console.error);
  }, [navigate]);

  if (!user) return null;

  const scheduledCount = emails.filter(e => e.status === 'SCHEDULED' || e.status === 'PROCESSING').length;
  const sentCount = emails.filter(e => e.status === 'SENT' || e.status === 'FAILED').length;

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} scheduledCount={scheduledCount} sentCount={sentCount} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ emails }} />
        </main>
      </div>
    </div>
  );
}
