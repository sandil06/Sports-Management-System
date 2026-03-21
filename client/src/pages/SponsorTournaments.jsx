import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const sportEmoji = { Cricket:'🏏',Badminton:'🏸',Chess:'♟️',Rugby:'🏉',Tennis:'🎾',Carrom:'🎯',Football:'⚽','Table Tennis':'🏓',Volleyball:'🏐',Swimming:'🏊','Track & Field':'🏃',Netball:'🤾',Basketball:'🏀',Hockey:'🏑' };

export default function SponsorTournaments() {
  const { sponsor } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [myProfile, setMyProfile]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [showModal, setShowModal]     = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async () => {
    try {
      const [tRes, meRes] = await Promise.all([
        api.get('/sponsors/tournaments'),
        api.get('/sponsors/me')
      ]);
      setTournaments(tRes.data.tournaments);
      setMyProfile(meRes.data.sponsor);
    } catch { toast.error('Failed to load tournaments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getSponsorshipStatus = (tid) => {
    const entry = myProfile?.sponsoredTournaments?.find(
      s => s.tournament?._id === tid || s.tournament === tid
    );
    return entry ? entry.status : null;
  };

  const openSponsor = (t) => { setSelected(t); reset({}); setShowModal(true); };

  const onSponsor = async (data) => {
    try {
      await api.post('/sponsors/sponsor-event', { tournamentId: selected._id, ...data });
      toast.success('Sponsorship application submitted! Waiting for admin approval.');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sponsorship failed');
    }
  };

  if (loading) return <Spinner />;

  const statusConfig = {
    pending:  { label: 'Pending Approval', badge: 'badge-yellow', icon: '⏳' },
    approved: { label: 'Approved',         badge: 'badge-green',  icon: '✅' },
    rejected: { label: 'Rejected',         badge: 'badge-red',    icon: '❌' }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Tournaments to Sponsor</h1>
        <p className="page-sub">Support SLIIT sports events and gain visibility</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tournaments.map(t => {
          const status = getSponsorshipStatus(t._id);
          const cfg = status ? statusConfig[status] : null;
          return (
            <div key={t._id} className={"card hover:shadow-md transition-shadow " + (status === 'approved' ? 'border-green-300' : status === 'pending' ? 'border-yellow-300' : '')}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{sportEmoji[t.sport] || '🏅'}</span>
                  {cfg && (
                    <span className={cfg.badge + " flex items-center gap-1"}>
                      {cfg.icon} {cfg.label}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-blue-900 mb-1 leading-tight">{t.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{t.sport} • {t.venue}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>📅 {new Date(t.startDate).toLocaleDateString()}</p>
                  <p>👥 {t.currentParticipants}/{t.maxParticipants} participants</p>
                  <p>⏰ Deadline: {new Date(t.registrationDeadline).toLocaleDateString()}</p>
                  {t.prize && <p>🏆 Prize: {t.prize}</p>}
                </div>

                {status === 'pending' && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                    ⏳ Your sponsorship application is under review by the admin.
                  </div>
                )}
                {status === 'approved' && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                    ✅ Your sponsorship has been approved!
                  </div>
                )}
                {status === 'rejected' && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                    ❌ Your sponsorship was not approved this time.
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 px-5 py-3">
                {!status ? (
                  <button onClick={() => openSponsor(t)} className="btn-orange w-full text-sm py-2">
                    Apply to Sponsor
                  </button>
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    {cfg.icon} Application {cfg.label}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {tournaments.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🏆</div>
            <p>No tournaments available</p>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={"Sponsor: " + selected?.name}>
        <form onSubmit={handleSubmit(onSponsor)} noValidate className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p className="font-medium">{selected?.name}</p>
            <p className="text-xs mt-1">{selected?.sport} • {selected?.venue}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800">
            ⚠️ Your application will be reviewed by the admin before being approved.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorship Name *</label>
            <input {...register('sponsorshipName', { required: 'Required' })}
              className={"input-field " + (errors.sponsorshipName ? 'input-error' : '')}
              placeholder="e.g. Gold Sponsor, Title Sponsor" />
            {errors.sponsorshipName && <p className="error-text">{errors.sponsorshipName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorship Amount (LKR) *</label>
            <input type="number" min="1000" {...register('amount', { required: 'Amount required', min: { value: 1000, message: 'Minimum LKR 1,000' } })}
              className={"input-field " + (errors.amount ? 'input-error' : '')} placeholder="e.g. 50000" />
            {errors.amount && <p className="error-text">{errors.amount.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-orange flex-1">Submit Application</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
