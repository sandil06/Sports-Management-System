import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

export default function EventForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/events/${id}`).then(({ data }) => {
        const ev = data.event;
        reset({
          ...ev,
          startDate: ev.startDate?.slice(0, 10),
          endDate:   ev.endDate?.slice(0, 10),
        });
      });
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEdit) await api.put(`/events/${id}`, data);
      else await api.post('/events', data);
      toast.success(isEdit ? 'Event updated!' : 'Event created!');
      navigate('/events');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Save failed';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">{isEdit ? 'Edit Event' : 'Create Event'}</h1>
        <p className="page-sub">Fill in all required fields marked with *</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="section-card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
          <input {...register('title', { required: 'Title is required' })}
            className={`input-field ${errors.title ? 'input-error' : ''}`}
            placeholder="e.g. Inter-Faculty Basketball Tournament 2025" />
          {errors.title && <p className="error-text">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
            <select {...register('sport', { required: 'Sport is required' })} className={`input-field ${errors.sport ? 'input-error' : ''}`}>
              <option value="">Select sport</option>
              {['Basketball','Football','Swimming','Badminton','Cricket','Tennis','Volleyball','Fitness','Other'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.sport && <p className="error-text">{errors.sport.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select {...register('eventType')} className="input-field">
              <option value="tournament">Tournament</option>
              <option value="match">Match</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
          <input {...register('venue', { required: 'Venue is required' })}
            className={`input-field ${errors.venue ? 'input-error' : ''}`}
            placeholder="e.g. Basketball Court A" />
          {errors.venue && <p className="error-text">{errors.venue.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input type="date" {...register('startDate', { required: 'Start date is required' })}
              className={`input-field ${errors.startDate ? 'input-error' : ''}`} />
            {errors.startDate && <p className="error-text">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input type="date" {...register('endDate', { required: 'End date is required' })}
              className={`input-field ${errors.endDate ? 'input-error' : ''}`} />
            {errors.endDate && <p className="error-text">{errors.endDate.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Teams</label>
            <input type="number" {...register('maxTeams', { min: { value: 0, message: 'Cannot be negative' } })}
              className="input-field" placeholder="0 = unlimited" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (LKR)</label>
            <input type="number" {...register('registrationFee', { min: { value: 0, message: 'Cannot be negative' } })}
              className="input-field" placeholder="0" min="0" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select {...register('status')} className="input-field">
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea {...register('description')} rows={3}
            className="input-field" placeholder="Event description..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Results (if completed)</label>
          <textarea {...register('results')} rows={2}
            className="input-field" placeholder="Match results..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
            {loading ? 'Saving...' : (isEdit ? 'Update Event' : 'Create Event')}
          </button>
          <button type="button" onClick={() => navigate('/events')} className="btn-secondary px-6">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
