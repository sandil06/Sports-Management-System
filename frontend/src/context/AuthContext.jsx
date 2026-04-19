import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sms_user') || 'null'));
  const [sponsor, setSponsor] = useState(() => JSON.parse(localStorage.getItem('sms_sponsor') || 'null'));

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const userData = { ...data.user, token: data.token, accountType: 'user' };
    localStorage.setItem('sms_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const sponsorLogin = useCallback(async (email, password) => {
    const { data } = await api.post('/sponsors/login', { email, password });
    const sponsorData = { ...data.sponsor, token: data.token, accountType: 'sponsor' };
    localStorage.setItem('sms_sponsor', JSON.stringify(sponsorData));
    setSponsor(sponsorData);
    return sponsorData;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    const userData = { ...data.user, token: data.token, accountType: 'user' };
    localStorage.setItem('sms_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const sponsorRegister = useCallback(async (formData) => {
    const { data } = await api.post('/sponsors/register', formData);
    const sponsorData = { ...data.sponsor, token: data.token, accountType: 'sponsor' };
    localStorage.setItem('sms_sponsor', JSON.stringify(sponsorData));
    setSponsor(sponsorData);
    return sponsorData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sms_user');
    localStorage.removeItem('sms_sponsor');
    setUser(null);
    setSponsor(null);
  }, []);

  const isAdmin   = user?.role === 'admin';
  const isCoach   = user?.role === 'coach';
  const isStudent = user?.role === 'student';
  const isSponsor = !!sponsor;

  return (
    <AuthContext.Provider value={{ user, sponsor, login, sponsorLogin, register, sponsorRegister, logout, isAdmin, isCoach, isStudent, isSponsor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
