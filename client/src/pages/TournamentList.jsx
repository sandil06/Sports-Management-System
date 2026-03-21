import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { useForm, useFieldArray } from 'react-hook-form';

const SPORTS = ['Cricket','Basketball','Volleyball','Football','Rugby','Hockey','Netball','Table Tennis','Badminton','Tennis','Chess','Carrom','Swimming','Track & Field'];
const sportEmoji = { Cricket:'🏏', Badminton:'🏸', Chess:'♟️', Rugby:'🏉', Tennis:'🎾', Carrom:'🎯', Football:'⚽', 'Table Tennis':'🏓', Volleyball:'🏐', Swimming:'🏊', 'Track & Field':'🏃', Netball:'🤾', Basketball:'🏀', Hockey:'🏑' };
const TEAM_SIZES = { Cricket:11, Basketball:5, Volleyball:6, Football:11, Rugby:15, Hockey:11, Netball:7, 'Table Tennis':2, Badminton:2, Tennis:2, Chess:1, Carrom:2, Swimming:1, 'Track & Field':1 };
const INDIVIDUAL_SPORTS = ['Chess', 'Swimming', 'Track & Field'];

export default function TournamentList() {
  const { isAdmin, isCoach, user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm({
    defaultValues: { members: [] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'members' });

  const load = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        api.get('/tournaments'),
        api.get('/tournaments/my/registrations')
      ]);
      setTournaments(tRes.data.tournaments);
      setMyRegs(rRes.data.registrations);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openRegister = (t) => {
    setSelected(t);
    reset({ members: [] });
    // Pre-fill team members array based on required size
    if (t.type === 'team') {
      const memberCount = t.requiredTeamSize - 1; // minus leader
      const initMembers = Array(memberCount).fill({ studentId: '', name: '', contact: '' });
      reset({ members: initMembers });
    }
    setShowRegModal(true);
  };

  const isDeadlinePassed = (t) => new Date() > new Date(t.registrationDeadline);
  const isFull = (t) => t.currentParticipants >= t.maxParticipants;
  const isRegistered = (tid) => myRegs.some(r => r.tournament?._id === tid || r.tournament === tid);

  const onRegister = async (data) => {
    try {
      setSubmitting(true);
      if (selected.type === 'individual') {
        await api.post(`/tournaments/${selected._id}/register`, {
          studentName: data.studentName,
          studentId: data.studentId,
          contactNumber: data.contactNumber
        });
      } else {
        // Validate team size
        const totalPlayers = data.members.length + 1;
        if (totalPlayers !== selected.requiredTeamSize) {
          toast.error(`${selected.sport} requires exactly ${selected.requiredTeamSize} players (including leader). You have ${totalPlayers}.`);
          return;
        }
        await api.post(`/tournaments/${selected._id}/register`, {
          teamName: data.teamName,
          leader: { studentId: data.leaderStudentId, name: data.leaderName, contact: data.leaderContact },
          members: data.members
        });
      }
      toast.success('Successfully registered!');
      setShowRegModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tournament?')) return;
    try { await api.delete(`/tournaments/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = tournaments.filter(t => filter === 'all' || t.status === filter);
  const statusBadge = { upcoming:'badge-blue', ongoing:'badge-green', completed:'badge-gray', cancelled:'badge-red' };
  const regStatusBadge = { pending:'badge-yellow', approved:'badge-green', rejected:'badge-red' };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Tournaments</h1>
          <p className="page-sub">View and register for SLIIT sports tournaments</p>
        </div>
        {(isAdmin || isCoach) && (
          <Link to="/tournaments/create" className="btn-primary">+ Create Tournament</Link>
        )}
      </div>

      <div className="flex gap-2 mb-5">
        {['all','upcoming','ongoing','completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>{s}</button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {['all','my-registrations'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}>
            {t === 'all' ? 'All Tournaments' : `My Registrations (${myRegs.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'all' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => {
            const deadlinePassed = isDeadlinePassed(t);
            const full = isFull(t);
            const registered = isRegistered(t._id);
            return (
              <div key={t._id} className="card hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{sportEmoji[t.sport] || '🏅'}</span>
                    <div className="flex flex-col items-end gap-1">
                      <span className={statusBadge[t.status] || 'badge-gray'}>{t.status}</span>
                      <span className={t.type === 'individual' ? 'badge-blue' : 'badge-orange'}>{t.type}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-1 leading-tight">{t.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{t.sport} • {t.venue}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>📅 {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}</p>
                    <p>⏰ Register by: <span className={deadlinePassed ? 'text-red-600 font-medium' : ''}>{new Date(t.registrationDeadline).toLocaleDateString()}</span></p>
                    <p>👥 {t.currentParticipants}/{t.maxParticipants} {t.type === 'team' ? 'teams' : 'participants'}</p>
                    {t.type === 'team' && <p>🏃 Team size: {t.requiredTeamSize} players</p>}
                    {t.prize && <p>🏆 Prize: {t.prize}</p>}
                  </div>
                </div>
                <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
                  {registered ? (
                    <p className="text-green-600 text-sm font-medium w-full text-center">✅ Registered</p>
                  ) : deadlinePassed ? (
                    <p className="text-red-500 text-sm w-full text-center">❌ Deadline passed</p>
                  ) : full ? (
                    <p className="text-red-500 text-sm w-full text-center">❌ Tournament full</p>
                  ) : (
                    <button onClick={() => openRegister(t)} className="btn-orange flex-1 text-sm py-1.5">
                      Register Now
                    </button>
                  )}
                  {(isAdmin || isCoach) && (
                    <>
                      <Link to={`/tournaments/edit/${t._id}`} className="btn-secondary text-xs py-1.5 px-3">Edit</Link>
                      <button onClick={() => handleDelete(t._id)} className="btn-danger text-xs py-1.5 px-3">Del</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🏆</div><p>No tournaments found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-registrations' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Tournament</th>
                <th className="table-header">Sport</th>
                <th className="table-header">Type</th>
                <th className="table-header">Date</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {myRegs.map(r => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-blue-900">{r.tournament?.name}</td>
                  <td className="table-cell">{r.tournament?.sport}</td>
                  <td className="table-cell capitalize">{r.type}</td>
                  <td className="table-cell text-xs text-gray-500">{r.tournament?.startDate ? new Date(r.tournament.startDate).toLocaleDateString() : '—'}</td>
                  <td className="table-cell"><span className={regStatusBadge[r.status] || 'badge-gray'}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {myRegs.length === 0 && <p className="text-center text-gray-400 py-10">No registrations yet</p>}
        </div>
      )}

      {/* Registration Modal */}
      <Modal isOpen={showRegModal} onClose={() => setShowRegModal(false)}
        title={`Register: ${selected?.name}`} size="lg">
        {selected && (
          <form onSubmit={handleSubmit(onRegister)} noValidate className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-semibold text-blue-900">{selected.name}</p>
              <p className="text-blue-700 text-xs mt-1">
                {sportEmoji[selected.sport]} {selected.sport} •
                {selected.type === 'team' ? ` Team sport (${selected.requiredTeamSize} players required)` : ' Individual sport'}
              </p>
            </div>

            {selected.type === 'individual' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                  <input {...register('studentName', { required: 'Student name required' })}
                    className={`input-field ${errors.studentName ? 'input-error' : ''}`}
                    placeholder="Your full name" />
                  {errors.studentName && <p className="error-text">{errors.studentName.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                    <input {...register('studentId', {
                      required: 'Student ID required',
                      pattern: { value: /^IT\d{8}$/, message: 'Format: IT23849006' }
                    })}
                      className={`input-field ${errors.studentId ? 'input-error' : ''}`}
                      placeholder="IT23849006" />
                    {errors.studentId && <p className="error-text">{errors.studentId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                    <input {...register('contactNumber', {
                      required: 'Contact required',
                      pattern: { value: /^[0-9+\-\s]{9,15}$/, message: 'Invalid phone' }
                    })}
                      className={`input-field ${errors.contactNumber ? 'input-error' : ''}`}
                      placeholder="07X-XXXXXXX" />
                    {errors.contactNumber && <p className="error-text">{errors.contactNumber.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                  <input value={selected.sport} disabled className="input-field bg-gray-50" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                  <input {...register('teamName', { required: 'Team name required' })}
                    className={`input-field ${errors.teamName ? 'input-error' : ''}`}
                    placeholder="e.g. Thunder Warriors" />
                  {errors.teamName && <p className="error-text">{errors.teamName.message}</p>}
                </div>

                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-semibold text-orange-800 mb-3">Team Leader</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input {...register('leaderStudentId', { required: 'Required', pattern: { value: /^IT\d{8}$/, message: 'Format: IT23849006' } })}
                        className={`input-field text-xs ${errors.leaderStudentId ? 'input-error' : ''}`} placeholder="Student ID" />
                      {errors.leaderStudentId && <p className="error-text">{errors.leaderStudentId.message}</p>}
                    </div>
                    <div>
                      <input {...register('leaderName', { required: 'Required' })}
                        className={`input-field text-xs ${errors.leaderName ? 'input-error' : ''}`} placeholder="Full Name" />
                      {errors.leaderName && <p className="error-text">{errors.leaderName.message}</p>}
                    </div>
                    <div>
                      <input {...register('leaderContact', { required: 'Required' })}
                        className={`input-field text-xs ${errors.leaderContact ? 'input-error' : ''}`} placeholder="Contact No." />
                      {errors.leaderContact && <p className="error-text">{errors.leaderContact.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-blue-800">
                      Team Members ({fields.length} / {selected.requiredTeamSize - 1} needed)
                    </p>
                    <button type="button" onClick={() => append({ studentId: '', name: '', contact: '' })}
                      className="text-xs bg-blue-800 text-white px-2 py-1 rounded hover:bg-blue-900">
                      + Add Member
                    </button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-3 gap-2 items-center">
                        <input {...register(`members.${index}.studentId`, { required: 'Required', pattern: { value: /^IT\d{8}$/, message: 'IT+8 digits' } })}
                          className={`input-field text-xs ${errors.members?.[index]?.studentId ? 'input-error' : ''}`}
                          placeholder={`Student ID`} />
                        <input {...register(`members.${index}.name`, { required: 'Required' })}
                          className={`input-field text-xs ${errors.members?.[index]?.name ? 'input-error' : ''}`}
                          placeholder="Full Name" />
                        <div className="flex gap-1">
                          <input {...register(`members.${index}.contact`, { required: 'Required' })}
                            className={`input-field text-xs flex-1 ${errors.members?.[index]?.contact ? 'input-error' : ''}`}
                            placeholder="Contact" />
                          <button type="button" onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700 text-lg leading-none px-1">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    ⚠️ {selected.sport} requires exactly {selected.requiredTeamSize} players (1 leader + {selected.requiredTeamSize - 1} members)
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-orange flex-1 py-2.5">
                {submitting ? 'Registering...' : 'Submit Registration'}
              </button>
              <button type="button" onClick={() => setShowRegModal(false)} className="btn-secondary px-5">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
