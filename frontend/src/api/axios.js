import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('sms_user') || 'null');
  const sponsor = JSON.parse(localStorage.getItem('sms_sponsor') || 'null');
  const token = user?.token || sponsor?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sms_user');
      localStorage.removeItem('sms_sponsor');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
