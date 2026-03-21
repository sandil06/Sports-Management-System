import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useState } from 'react';
import api from '../../api/axios';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: regFP, handleSubmit: handleFP, formState: { errors: fpErrors } } = useForm();
  const { register: regRP, handleSubmit: handleRP, formState: { errors: rpErrors } } = useForm();
  const { login, sponsorLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(false);
  const [tab, setTab]               = useState('student');
  const [view, setView]             = useState('login');
  const [resetToken, setResetToken] = useState('');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (tab === 'sponsor') {
        await sponsorLogin(data.email, data.password);
        toast.success('Welcome, Sponsor!');
        navigate('/sponsor/dashboard');
      } else {
        const user = await login(data.email, data.password);
        toast.success('Welcome back, ' + user.name + '!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your email and password.');
    } finally { setLoading(false); }
  };

  const onForgotPassword = async (data) => {
    try {
      setLoading(true);
      const endpoint = tab === 'sponsor' ? '/sponsors/forgot-password' : '/auth/forgot-password';
      const res = await api.post(endpoint, { email: data.forgotEmail });
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
        setView('reset');
        toast.success('Account found! Set your new password.');
      } else {
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email not found');
    } finally { setLoading(false); }
  };

  const onResetPassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      setLoading(true);
      await api.post('/auth/reset-password', { token: resetToken, newPassword: data.newPassword });
      toast.success('Password reset! Please login with your new password.');
      setView('login'); setResetToken('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="bg-blue-900 text-white font-black text-xl px-3 py-2 rounded-lg">SA</div>
            <div className="bg-orange-500 text-white font-black text-xl px-3 py-2 rounded-lg">360</div>
          </div>
          <h1 className="text-2xl font-bold text-blue-900">SliitArena 360</h1>
          <p className="text-gray-500 text-sm mt-1">SLIIT Sports Management System</p>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button type="button" onClick={() => { setTab('student'); setView('login'); }}
            className={"flex-1 py-2 rounded-md text-sm font-medium transition-colors " + (tab === 'student' ? 'bg-blue-900 text-white shadow' : 'text-gray-600 hover:text-gray-800')}>
            Student / Coach / Admin
          </button>
          <button type="button" onClick={() => { setTab('sponsor'); setView('login'); }}
            className={"flex-1 py-2 rounded-md text-sm font-medium transition-colors " + (tab === 'sponsor' ? 'bg-orange-500 text-white shadow' : 'text-gray-600 hover:text-gray-800')}>
            Sponsor
          </button>
        </div>

        {view === 'login' && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tab === 'sponsor' ? 'Company Email' : 'SLIIT Email'}</label>
              <input type="email" {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })}
                className={"input-field " + (errors.email ? 'input-error' : '')} placeholder={tab === 'sponsor' ? 'company@email.com' : 'you@sliit.lk'} />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" {...register('password', { required: 'Password is required' })}
                className={"input-field " + (errors.password ? 'input-error' : '')} placeholder="Enter your password" />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setView('forgot')} className="text-sm text-blue-700 hover:underline font-medium">Forgot Password?</button>
            </div>
            <button type="submit" disabled={loading}
              className={"w-full py-2.5 rounded-lg font-medium text-white transition-colors disabled:opacity-50 " + (tab === 'sponsor' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-900 hover:bg-blue-800')}>
              {loading ? 'Signing in...' : ('Sign In as ' + (tab === 'sponsor' ? 'Sponsor' : 'User'))}
            </button>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleFP(onForgotPassword)} noValidate className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">Enter your registered email to reset your password.</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered Email</label>
              <input type="email" {...regFP('forgotEmail', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email required' } })}
                className={"input-field " + (fpErrors.forgotEmail ? 'input-error' : '')} placeholder="your@email.com" />
              {fpErrors.forgotEmail && <p className="error-text">{fpErrors.forgotEmail.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50">
              {loading ? 'Checking...' : 'Find My Account'}
            </button>
            <button type="button" onClick={() => setView('login')} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700">← Back to Login</button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleRP(onResetPassword)} noValidate className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">✅ Account found! Enter your new password.</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" {...regRP('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })}
                className={"input-field " + (rpErrors.newPassword ? 'input-error' : '')} placeholder="New password (min 6 chars)" />
              {rpErrors.newPassword && <p className="error-text">{rpErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" {...regRP('confirmPassword', { required: 'Required' })}
                className={"input-field " + (rpErrors.confirmPassword ? 'input-error' : '')} placeholder="Repeat new password" />
              {rpErrors.confirmPassword && <p className="error-text">{rpErrors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => setView('login')} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700">← Back to Login</button>
          </form>
        )}

        {view === 'login' && (
          <div className="mt-4 text-center text-sm text-gray-500 space-y-1">
            <p>New student? <Link to="/register" className="text-blue-800 font-medium hover:underline">Register here</Link></p>
            <p>New sponsor? <Link to="/sponsor/register" className="text-orange-500 font-medium hover:underline">Register as Sponsor</Link></p>
          </div>
        )}

        <div className="mt-5 p-3 bg-blue-50 rounded-lg text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-blue-900 mb-1">Demo Credentials:</p>
          <p>Admin: admin@sliit.lk / admin123</p>
          <p>Coach: coach@sliit.lk / coach123</p>
          <p>Student: student@sliit.lk / student123</p>
          <p>Sponsor: sponsor@sportzone.lk / sponsor123</p>
        </div>
      </div>
    </div>
  );
}
