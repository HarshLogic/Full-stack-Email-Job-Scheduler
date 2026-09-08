import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import ScheduledList from './pages/ScheduledList';
import SentList from './pages/SentList';
import Compose from './pages/Compose';
import EmailView from './pages/EmailView';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/scheduled" replace />} />
          <Route path="scheduled" element={<ScheduledList />} />
          <Route path="sent" element={<SentList />} />
          <Route path="compose" element={<Compose />} />
          <Route path="email/:id" element={<EmailView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
