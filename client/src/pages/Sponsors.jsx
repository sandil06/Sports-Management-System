import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

export default function Sponsors() {
  const { isAdmin } = useAuth();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async () => {
    try { const { data } = await api.get('/sponsors'); setSponsors(data.sponsors); }
    catch { toast.error('Failed to load sponsors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { reset({}); setEditItem(null); setShowModal(true); };
  const openEdit = (s) => { reset(s); setEditItem(s); setShowModal(true); };

  const onSave = async (data) => {
    try {
      if (editItem) await api.put(`/sponsors/${editItem._id}`, data);
      else await api.post('/sponsors', data);
      toast.success(editItem ? 'Sponsor updated!' : 'Sponsor added!');
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Remove this sponsor?')) return;
    try { await api.delete(`/sponsors/${id}`); toast.success('Removed'); load(); }
    catch { toast.error('Delete failed'); }
  };

  if (loading) return <Spinner />;

  const typeBadge = { cash:'badge-green', equipment:'badge-blue', services:'badge-yellow', other:'badge-gray' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Sponsors</h1>
          <p className="page-sub">Manage event sponsors and contributions</p>
        </div>
        {isAdmin && <button onClick={openAdd} className="btn-primary">+ Add Sponsor</button>}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sponsors.map(s => (
          <div key={s._id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-lg">
                {s.name.charAt(0)}
              </div>
              <span className={s.isActive ? 'badge-green' : 'badge-red'}>{s.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{s.name}</h3>
            {s.contactPerson && <p className="text-xs text-gray-500">👤 {s.contactPerson}</p>}
            {s.email && <p className="text-xs text-gray-500">✉️ {s.email}</p>}
            {s.phone && <p className="text-xs text-gray-500">📞 {s.phone}</p>}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Contribution</p>
                <p className="font-semibold text-gray-800 text-sm">
                  LKR {s.contributionAmount?.toLocaleString()}
                  <span className={`ml-2 ${typeBadge[s.contributionType] || 'badge-gray'}`}>{s.contributionType}</span>
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => openEdit(s)} className="btn-secondary text-xs py-1 px-3">Edit</button>
                  <button onClick={() => onDelete(s._id)} className="btn-danger text-xs py-1 px-3">Del</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {sponsors.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🤝</div><p>No sponsors added yet</p>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Sponsor' : 'Add Sponsor'}>
        <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input {...register('name', { required: 'Name required' })} className={`input-field ${errors.name ? 'input-error' : ''}`} placeholder="e.g. SportZone LK" />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input {...register('contactPerson')} className="input-field" placeholder="Mr. Perera" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...register('phone')} className="input-field" placeholder="07X-XXXXXXX" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
              className={`input-field ${errors.email ? 'input-error' : ''}`} placeholder="contact@company.com" />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Amount (LKR)</label>
              <input type="number" min="0" {...register('contributionAmount')} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select {...register('contributionType')} className="input-field">
                {['cash','equipment','services','other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register('isActive')} defaultChecked className="w-4 h-4" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active sponsor</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Add Sponsor'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
