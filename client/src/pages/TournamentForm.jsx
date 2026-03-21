import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const SPORTS = ['Cricket','Basketball','Volleyball','Football','Rugby','Hockey','Netball','Table Tennis','Badminton','Tennis','Chess','Carrom','Swimming','Track & Field'];
const TEAM_SIZES = { Cricket:11, Basketball:5, Volleyball:6, Football:11, Rugby:15, Hockey:11, Netball:7, 'Table Tennis':2, Badminton:2, Tennis:2, Chess:1, Carrom:2, Swimming:1, 'Track & Field':1 };
const INDIVIDUAL_SPORTS = ['Chess','Swimming','Track & Field'];
const sportEmoji = { Cricket:'🏏', Badminton:'🏸', Chess:'♟️', Rugby:'🏉', Tennis:'🎾', Carrom:'🎯', Football:'⚽', 'Table Tennis':'🏓', Volleyball:'🏐', Swimming:'🏊', 'Track & Field':'🏃', Netball:'🤾', Basketball:'🏀', Hockey:'🏑' };

export default function TournamentForm() {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const selectedSport = watch('sport');

  useEffect(() => {
    if (selectedSport) {
      const size = TEAM_SIZES[selectedSport] || 1;
      const type = INDIVIDUAL_SPORTS.includes(selectedSport) ? 'individual' : 'team';
      setValue('requiredTeamSize', size);
      setValue('type', type);
    }
  }, [selectedSport, setValue]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/tournaments/${id}`).then(({ data }) => {
        const t = data.tournament;
        reset({
          ...t,
          startDate: t.startDate?.slice(0, 10),
          endDate: t.endDate?.slice(0, 10),
          registrationDeadline: t.registrationDeadline?.slice(0, 10),
        });
      });
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEdit) await api.put(`/tournaments/${id}`, data);
      else await api.post('/tournaments', data);
      toast.success(isEdit ? 'Tournament updated!' : 'Tournament created!');
      navigate('/tournaments');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Save failed';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">{isEdit ? 'Edit Tournament' : 'Create Tournament'}</h1>
        <p className="page-sub">Fill in all required fields marked with *</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="section-card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
          <input {...register('name', { required: 'Name is required' })}
            className={`input-field ${errors.name ? 'input-error' : ''}`}
            placeholder="e.g. Inter-Faculty Cricket Championship 2025" />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
            <select {...register('sport', { required: 'Sport required' })}
              className={`input-field ${errors.sport ? 'input-error' : ''}`}>
              <option value="">Select sport</option>
              {SPORTS.map(s => <option key={s} value={s}>{sportEmoji[s]} {s}</option>)}
            </select>
            {errors.sport && <p className="error-text">{errors.sport.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input {...register('type')} className="input-field bg-gray-50" readOnly
              placeholder="Auto-set from sport" />
            {selectedSport && (
              <p className="text-xs text-blue-700 mt-1">
                {INDIVIDUAL_SPORTS.includes(selectedSport) ? '👤 Individual sport' : `👥 Team sport — ${TEAM_SIZES[selectedSport]} players per team`}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
          <input {...register('venue', { required: 'Venue required' })}
            className={`input-field ${errors.venue ? 'input-error' : ''}`}
            placeholder="e.g. Main Cricket Ground" />
          {errors.venue && <p className="error-text">{errors.venue.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input type="date" {...register('startDate', { required: 'Required' })}
              className={`input-field ${errors.startDate ? 'input-error' : ''}`} />
            {errors.startDate && <p className="error-text">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input type="date" {...register('endDate', { required: 'Required' })}
              className={`input-field ${errors.endDate ? 'input-error' : ''}`} />
            {errors.endDate && <p className="error-text">{errors.endDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reg. Deadline *</label>
            <input type="date" {...register('registrationDeadline', { required: 'Required' })}
              className={`input-field ${errors.registrationDeadline ? 'input-error' : ''}`} />
            {errors.registrationDeadline && <p className="error-text">{errors.registrationDeadline.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants *</label>
            <input type="number" min="1" {...register('maxParticipants', { required: 'Required', min: { value: 1, message: 'Min 1' } })}
              className={`input-field ${errors.maxParticipants ? 'input-error' : ''}`}
              placeholder="e.g. 8 teams or 50 individuals" />
            {errors.maxParticipants && <p className="error-text">{errors.maxParticipants.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prize</label>
            <input {...register('prize')} className="input-field" placeholder="e.g. LKR 50,000" />
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
          <textarea {...register('description')} rows={3} className="input-field" placeholder="Tournament description..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Results (if completed)</label>
          <textarea {...register('results')} rows={2} className="input-field" placeholder="Match results..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
            {loading ? 'Saving...' : (isEdit ? 'Update Tournament' : 'Create Tournament')}
          </button>
          <button type="button" onClick={() => navigate('/tournaments')} className="btn-secondary px-6">Cancel</button>
        </div>
      </form>
    </div>
  );
}
