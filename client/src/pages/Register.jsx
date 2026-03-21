import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useState } from 'react';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const { confirmPassword, ...rest } = data;
      await registerUser(rest);
      toast.success('Registration successful! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏆</div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Register with your university credentials</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                {...register('name', { required: 'Full name is required', minLength: { value: 3, message: 'Name must be at least 3 characters' } })}
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                placeholder="Your full name"
              />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input
                {...register('studentId', {
                  required: 'Student ID is required',
                  pattern: { value: /^IT\d{8}$/, message: 'Format: IT23849006' }
                })}
                className={`input-field ${errors.studentId ? 'input-error' : ''}`}
                placeholder="IT23849006"
              />
              {errors.studentId && <p className="error-text">{errors.studentId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select {...register('role')} className="input-field">
                <option value="student">Student</option>
                <option value="coach">Coach</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campus Email</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' }
              })}
              className={`input-field ${errors.email ? 'input-error' : ''}`}
              placeholder="you@university.edu"
            />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              {...register('department')}
              className="input-field"
              placeholder="e.g. Faculty of IT"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              {...register('phone', {
                pattern: { value: /^[0-9+\-\s]{9,15}$/, message: 'Enter a valid phone number' }
              })}
              className={`input-field ${errors.phone ? 'input-error' : ''}`}
              placeholder="07X-XXXXXXX"
            />
            {errors.phone && <p className="error-text">{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="Min. 6 characters"
              />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: val => val === watch('password') || 'Passwords do not match'
                })}
                className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repeat password"
              />
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
