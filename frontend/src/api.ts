import axios from 'axios';
import type { User, Email } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies
});

export const getCurrentUser = async (): Promise<{ user: User }> => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const demoLogin = async (): Promise<{ message: string; user: User }> => {
  const { data } = await api.post('/auth/demo-login');
  return data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getEmails = async (query = ''): Promise<{ results: Email[] }> => {
  const { data } = await api.get(`/emails/search?q=${encodeURIComponent(query)}`);
  return data;
};

export const scheduleEmail = async (payload: {
  recipients?: string[];
  recipient?: string;
  subject: string;
  body: string;
  scheduledAt: string;
  delay?: string;
  hourlyLimit?: string;
}): Promise<any> => {
  const { data } = await api.post('/emails/schedule', payload);
  return data;
};

export default api;
