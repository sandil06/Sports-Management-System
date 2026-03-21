import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const statusBadge = { upcoming:'badge-blue', ongoing:'badge-green', completed:'badge-gray', cancelled:'badge-red' };
const sportEmoji  = { Basketball:'🏀', Football:'⚽', Swimming:'🏊', Badminton:'🏸', Cricket:'🏏', Tennis:'🎾', Volleyball:'🏐', Fitness:'💪' };

export default function EventList() {
  const { isAdmin, isCoach } = useAuth();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(data.events);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-sub">Tournaments, matches and training sessions</p>
        </div>
        {(isAdmin || isCoach) && (
          <Link to="/events/create" className="btn-primary flex items-center gap-2">
            <span>+</span> Create Event
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['all','upcoming','ongoing','completed','cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📅</div>
          <p>No events found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(ev => (
            <div key={ev._id} className="card hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{sportEmoji[ev.sport] || '🏅'}</span>
                  <span className={statusBadge[ev.status] || 'badge-gray'}>{ev.status}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 leading-tight">{ev.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{ev.sport} &bull; {ev.venue}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>📅 {new Date(ev.startDate).toLocaleDateString()} – {new Date(ev.endDate).toLocaleDateString()}</p>
                  {ev.registrationFee > 0 && <p>💰 Fee: LKR {ev.registrationFee}</p>}
                  {ev.maxTeams > 0 && <p>👥 Max Teams: {ev.maxTeams}</p>}
                </div>
              </div>
              <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
                <button onClick={() => setSelected(ev)} className="btn-secondary text-xs py-1.5 flex-1">View Details</button>
                {(isAdmin || isCoach) && (
                  <>
                    <Link to={`/events/edit/${ev._id}`} className="btn-secondary text-xs py-1.5 px-3">Edit</Link>
                    <button onClick={() => handleDelete(ev._id)} className="btn-danger text-xs py-1.5 px-3">Del</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Event Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{sportEmoji[selected.sport] || '🏅'}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selected.title}</h2>
                <span className={statusBadge[selected.status] || 'badge-gray'}>{selected.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Sport</p><p className="font-medium">{selected.sport}</p></div>
              <div><p className="text-gray-500">Venue</p><p className="font-medium">{selected.venue}</p></div>
              <div><p className="text-gray-500">Start Date</p><p className="font-medium">{new Date(selected.startDate).toLocaleDateString()}</p></div>
              <div><p className="text-gray-500">End Date</p><p className="font-medium">{new Date(selected.endDate).toLocaleDateString()}</p></div>
              <div><p className="text-gray-500">Registration Fee</p><p className="font-medium">LKR {selected.registrationFee || 0}</p></div>
              <div><p className="text-gray-500">Max Teams</p><p className="font-medium">{selected.maxTeams || 'N/A'}</p></div>
            </div>
            {selected.description && <div><p className="text-gray-500 text-sm">Description</p><p className="text-gray-700 text-sm mt-1">{selected.description}</p></div>}
            {selected.results && <div className="p-3 bg-green-50 rounded-lg"><p className="text-green-700 text-sm font-medium">Results: {selected.results}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
