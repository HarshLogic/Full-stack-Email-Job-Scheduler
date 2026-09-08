import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getCurrentUser, getEmails } from '../api';
import type { User, Email } from '../types';

export default function DashboardLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const [{ user }, { results }] = await Promise.all([
          getCurrentUser(),
          getEmails(),
        ]);

        if (ignore) return;

        setUser(user);
        setEmails(results);
      } catch {
        if (!ignore) {
          navigate('/login', { replace: true });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

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
