import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';

const typeEmoji = { court:'🏀', field:'⚽', pool:'🏊', gym:'💪', track:'🏃', other:'🏟️' };

const MIN_TIME = '06:00';
const MAX_TIME = '22:00';

function isWithinAllowedHours(time) {
  return time >= MIN_TIME && time <= MAX_TIME;
}

export default function FacilityList() {
  const { isAdmin } = useAuth();
  const [facilities, setFacilities]       = useState([]);
  const [myBookings, setMyBookings]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [availability, setAvailability]   = useState([]);
  const [checkDate, setCheckDate]         = useState('');
  const [activeTab, setActiveTab]         = useState('facilities');
  const [allBookings, setAllBookings]     = useState([]);
  const [bookingSearch, setBookingSearch] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const { register, handleSubmit, reset, watch, trigger, formState: { errors } } = useForm();
  const { register: regF, handleSubmit: handleFac, reset: resetF, formState: { errors: errF } } = useForm();

  const startTime = watch('startTime');

  useEffect(() => { if (startTime) trigger('endTime'); }, [startTime, trigger]);

  const load = async () => {
    try {
      const requests = [
        api.get('/facilities'),
        api.get('/facilities/bookings/my'),
      ];
      if (isAdmin) requests.push(api.get('/facilities/bookings/all'));
      const [facRes, myRes, allRes] = await Promise.all(requests);
      setFacilities(facRes.data.facilities);
      setMyBookings(myRes.data.bookings);
      if (isAdmin && allRes) setAllBookings(allRes.data.bookings || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const checkAvailability = async (facilityId, date) => {
    if (!date) return;
    const { data } = await api.get(`/facilities/${facilityId}/availability?date=${date}`);
    setAvailability(data.bookings);
  };

  const openBook = (facility) => {
    reset({});
    setSelected(facility);
    setAvailability([]);
    setCheckDate('');
    setShowBookModal(true);
  };

  const onBook = async (data) => {
    try {
      await api.post(`/facilities/${selected._id}/book`, data);
      toast.success('Facility booked successfully!');
      setShowBookModal(false);
      load();
      setActiveTab('my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    }
  };

  const onCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/facilities/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled');
      load();
    } catch { toast.error('Cancel failed'); }
  };

  const onAddFacility = async (data) => {
    try {
      await api.post('/facilities', data);
      toast.success('Facility added!');
      setShowAddModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  // Filter all bookings by any keyword
  const filteredBookings = allBookings.filter(b => {
    const q = bookingSearch.toLowerCase().trim();
    if (!q) return true;
    return [
      b.user?.name,
      b.user?.email,
      b.user?.studentId,
      b.user?.department,
      b.facility?.name,
      b.date,
      b.startTime,
      b.endTime,
      b.purpose,
      b.teamName,
      b.status,
      b.numberOfPlayers?.toString(),
    ].some(field => field?.toLowerCase().includes(q));
  });

  if (loading) return <Spinner />;

  const statusBadge = { confirmed:'badge-green', cancelled:'badge-red', pending:'badge-yellow' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Facilities</h1>
          <p className="page-sub">Check availability and book sports facilities</p>
        </div>
        {isAdmin && (
          <button onClick={() => { resetF({}); setShowAddModal(true); }} className="btn-primary">
            + Add Facility
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {['facilities', 'my-bookings', ...(isAdmin ? ['all-bookings'] : [])].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {t === 'my-bookings'  ? `My Bookings (${myBookings.length})` :
             t === 'all-bookings' ? `👥 All Bookings (${allBookings.length})` :
             'All Facilities'}
          </button>
        ))}
      </div>

      {/* Facilities Grid */}
      {activeTab === 'facilities' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map(f => (
            <div key={f._id} className="card hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{typeEmoji[f.type] || '🏟️'}</span>
                  <span className={f.isAvailable ? 'badge-green' : 'badge-red'}>
                    {f.isAvailable ? 'Available' : 'Closed'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{f.name}</h3>
                <p className="text-xs text-gray-500 capitalize mb-2">{f.sport} &bull; {f.type}</p>
                {f.capacity && <p className="text-xs text-gray-500">👥 Capacity: {f.capacity}</p>}
                {f.location && <p className="text-xs text-gray-500">📍 {f.location}</p>}
                {f.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {f.amenities.map(a => <span key={a} className="badge-gray text-xs">{a}</span>)}
                  </div>
                )}
                <p className="text-xs text-blue-600 font-medium mt-2">🕐 Bookings: 6:00 AM – 10:00 PM only</p>
              </div>
              <div className="border-t border-gray-100 px-5 py-3">
                <button onClick={() => openBook(f)} disabled={!f.isAvailable}
                  className="btn-primary w-full text-sm py-2 disabled:opacity-50">
                  Book This Facility
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Bookings Table */}
      {activeTab === 'my-bookings' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Facility</th>
                <th className="table-header">Date</th>
                <th className="table-header">Time</th>
                <th className="table-header">Purpose</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {myBookings.map(b => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{b.facility?.name}</td>
                  <td className="table-cell">{b.date}</td>
                  <td className="table-cell">{b.startTime} – {b.endTime}</td>
                  <td className="table-cell text-gray-500">{b.purpose}</td>
                  <td className="table-cell">
                    <span className={statusBadge[b.status] || 'badge-gray'}>{b.status}</span>
                  </td>
                  <td className="table-cell">
                    {b.status === 'confirmed' && (
                      <button onClick={() => onCancel(b._id)} className="btn-danger text-xs py-1 px-3">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myBookings.length === 0 && <p className="text-center text-gray-400 py-10">No bookings yet</p>}
        </div>
      )}

      {/* All Bookings Table — Admin Only */}
      {activeTab === 'all-bookings' && isAdmin && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-800">All Facility Bookings</h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={bookingSearch}
                onChange={e => setBookingSearch(e.target.value)}
                placeholder="Search by name, facility, date, status..."
                className="input-field w-72 text-sm"
              />
              {bookingSearch && (
                <button
                  onClick={() => setBookingSearch('')}
                  className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
                >
                  ✕ Clear
                </button>
              )}
              <span className="text-sm text-gray-500 whitespace-nowrap">
                {filteredBookings.length} / {allBookings.length}
              </span>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">Student ID</th>
                <th className="table-header">Department</th>
                <th className="table-header">Facility</th>
                <th className="table-header">Date</th>
                <th className="table-header">Time</th>
                <th className="table-header">Purpose</th>
                <th className="table-header">Team</th>
                <th className="table-header">Players</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <p className="font-medium text-gray-800 text-sm">{b.user?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{b.user?.email || ''}</p>
                  </td>
                  <td className="table-cell text-gray-600 text-sm">{b.user?.studentId || '—'}</td>
                  <td className="table-cell text-gray-500 text-sm">{b.user?.department || '—'}</td>
                  <td className="table-cell font-medium text-gray-800">{b.facility?.name || '—'}</td>
                  <td className="table-cell text-gray-600 text-sm">{b.date}</td>
                  <td className="table-cell text-gray-600 text-sm whitespace-nowrap">{b.startTime} – {b.endTime}</td>
                  <td className="table-cell text-gray-500 text-sm">{b.purpose || '—'}</td>
                  <td className="table-cell text-gray-500 text-sm">{b.teamName || '—'}</td>
                  <td className="table-cell text-center text-gray-500 text-sm">{b.numberOfPlayers || '—'}</td>
                  <td className="table-cell">
                    <span className={statusBadge[b.status] || 'badge-gray'}>{b.status}</span>
                  </td>
                  <td className="table-cell">
                    {b.status === 'confirmed' && (
                      <button onClick={() => onCancel(b._id)} className="btn-danger text-xs py-1 px-3">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBookings.length === 0 && (
            <p className="text-center text-gray-400 py-10">
              {bookingSearch ? `No bookings match "${bookingSearch}"` : 'No bookings found'}
            </p>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title={`Book: ${selected?.name}`} size="lg">
        <form onSubmit={handleSubmit(onBook)} noValidate className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium">
            🕐 Bookings are only allowed between <strong>6:00 AM</strong> and <strong>10:00 PM</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              min={today}
              {...register('date', {
                required: 'Date is required',
                validate: v => v >= today || 'Booking date cannot be in the past'
              })}
              className={`input-field ${errors.date ? 'input-error' : ''}`}
              onChange={e => {
                checkAvailability(selected._id, e.target.value);
                setCheckDate(e.target.value);
              }}
            />
            {errors.date && <p className="error-text">{errors.date.message}</p>}
          </div>
          {availability.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs font-semibold mb-2">Already booked on this date:</p>
              {availability.map(b => (
                <p key={b._id} className="text-yellow-700 text-xs">{b.startTime} – {b.endTime} ({b.user?.name})</p>
              ))}
            </div>
          )}
          {checkDate && availability.length === 0 && (
            <p className="text-green-600 text-sm font-medium">✅ Facility is fully available on this date!</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="time" min={MIN_TIME} max={MAX_TIME}
                {...register('startTime', {
                  required: 'Start time is required',
                  validate: v => isWithinAllowedHours(v) || 'Start time must be between 6:00 AM and 10:00 PM'
                })}
                onChange={() => { trigger('startTime'); trigger('endTime'); }}
                className={`input-field ${errors.startTime ? 'input-error' : ''}`}
              />
              {errors.startTime
                ? <p className="error-text">{errors.startTime.message}</p>
                : <p className="text-xs text-gray-400 mt-1">Earliest: 6:00 AM</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input
                type="time" min={startTime || MIN_TIME} max={MAX_TIME}
                {...register('endTime', {
                  required: 'End time is required',
                  validate: v => {
                    if (!isWithinAllowedHours(v)) return 'End time must be between 6:00 AM and 10:00 PM';
                    if (startTime && v <= startTime) return 'End time must be after start time';
                    return true;
                  }
                })}
                onChange={() => trigger('endTime')}
                className={`input-field ${errors.endTime ? 'input-error' : ''}`}
              />
              {errors.endTime
                ? <p className="error-text">{errors.endTime.message}</p>
                : <p className="text-xs text-gray-400 mt-1">Latest: 10:00 PM</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
            <input
              {...register('purpose', { required: 'Purpose is required' })}
              className={`input-field ${errors.purpose ? 'input-error' : ''}`}
              placeholder="e.g. Team practice, Match, Training"
            />
            {errors.purpose && <p className="error-text">{errors.purpose.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
              <input {...register('teamName')} className="input-field" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. of Players</label>
              <input
                type="number" min="1"
                {...register('numberOfPlayers', { min: { value: 1, message: 'Min 1 player' } })}
                className={`input-field ${errors.numberOfPlayers ? 'input-error' : ''}`}
                placeholder="Optional"
              />
              {errors.numberOfPlayers && <p className="error-text">{errors.numberOfPlayers.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Confirm Booking</button>
            <button type="button" onClick={() => setShowBookModal(false)} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Add Facility Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Facility">
        <form onSubmit={handleFac(onAddFacility)} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name *</label>
            <input
              {...regF('name', {
                required: 'Facility name is required',
                pattern: { value: /^[a-zA-Z\s]+$/, message: 'Facility name can only contain letters' }
              })}
              className={`input-field ${errF.name ? 'input-error' : ''}`}
              placeholder="e.g. Basketball Court A"
              onInput={e => { e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); }}
            />
            {errF.name && <p className="error-text">{errF.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                {...regF('type', { required: 'Please select a type' })}
                className={`input-field ${errF.type ? 'input-error' : ''}`}
              >
                <option value="">Select type</option>
                {['court','field','pool','gym','track','other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errF.type && <p className="error-text">{errF.type.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
              <input
                {...regF('sport', { required: 'Sport is required' })}
                className={`input-field ${errF.sport ? 'input-error' : ''}`}
                placeholder="e.g. Basketball"
              />
              {errF.sport && <p className="error-text">{errF.sport.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number" min="0"
                {...regF('capacity', { min: { value: 0, message: 'Cannot be negative' } })}
                className="input-field"
                placeholder="Max players"
              />
              {errF.capacity && <p className="error-text">{errF.capacity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                {...regF('location', {
                  pattern: { value: /^[a-zA-Z0-9\s]+$/, message: 'Location cannot contain symbols' }
                })}
                className={`input-field ${errF.location ? 'input-error' : ''}`}
                placeholder="e.g. Block A"
                onInput={e => { e.target.value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, ''); }}
              />
              {errF.location && <p className="error-text">{errF.location.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...regF('description')} rows={2} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Add Facility</button>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}