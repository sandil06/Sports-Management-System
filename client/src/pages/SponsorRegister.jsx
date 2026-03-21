import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useState } from 'react';

export default function SponsorRegister() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { sponsorRegister } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const { confirmPassword, ...rest } = data;
      await sponsorRegister(rest);
      toast.success('Sponsor account created! Welcome to SliitArena 360.');
      navigate('/sponsor/dashboard');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-orange-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="bg-blue-900 text-white font-black text-xl px-3 py-2 rounded-lg">SA</div>
            <div className="bg-orange-500 text-white font-black text-xl px-3 py-2 rounded-lg">360</div>
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Sponsor Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Join SliitArena 360 as a sponsor</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
              <input {...register('name', { required: 'Name is required', minLength: { value: 3, message: 'Min 3 characters' } })}
                className={`input-field ${errors.name ? 'input-error' : ''}`} placeholder="Full name" />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input {...register('company', { required: 'Company name is required' })}
                className={`input-field ${errors.company ? 'input-error' : ''}`} placeholder="Company Ltd." />
              {errors.company && <p className="error-text">{errors.company.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Email *</label>
            <input type="email" {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' }
            })}
              className={`input-field ${errors.email ? 'input-error' : ''}`} placeholder="contact@company.com" />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input {...register('phone', { pattern: { value: /^[0-9+\-\s]{9,15}$/, message: 'Enter a valid phone number' } })}
              className={`input-field ${errors.phone ? 'input-error' : ''}`} placeholder="07X-XXXXXXX" />
            {errors.phone && <p className="error-text">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input {...register('website')} className="input-field" placeholder="https://www.company.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" {...register('password', {
                required: 'Password required',
                minLength: { value: 6, message: 'Minimum 6 characters' }
              })}
                className={`input-field ${errors.password ? 'input-error' : ''}`} placeholder="Min. 6 characters" />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input type="password" {...register('confirmPassword', {
                required: 'Please confirm password',
                validate: val => val === watch('password') || 'Passwords do not match'
              })}
                className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="Repeat password" />
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {loading ? 'Creating account...' : 'Create Sponsor Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-800 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
