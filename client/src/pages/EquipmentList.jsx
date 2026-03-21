import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';

const conditionBadge = { excellent:'badge-green', good:'badge-blue', fair:'badge-yellow', poor:'badge-red' };

export default function EquipmentList() {
  const { isAdmin } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [reserveItem, setReserveItem] = useState(null);
  const [search, setSearch]       = useState('');

  const { register: reg, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: regR, handleSubmit: handleReserve, reset: resetR, formState: { errors: errR } } = useForm();

  const load = async () => {
    try {
      const { data } = await api.get('/equipment');
      setEquipment(data.equipment);
    } catch { toast.error('Failed to load equipment'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { reset({}); setEditItem(null); setShowAddModal(true); };
  const openEdit = (item) => { reset(item); setEditItem(item); setShowAddModal(true); };
  const openReserve = (item) => { resetR({}); setReserveItem(item); setShowReserveModal(true); };

  const onSave = async (data) => {
    try {
      if (editItem) await api.put(`/equipment/${editItem._id}`, data);
      else await api.post('/equipment', data);
      toast.success(editItem ? 'Updated!' : 'Equipment added!');
      setShowAddModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Save failed');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.delete(`/equipment/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const onReserve = async (data) => {
    try {
      await api.post(`/equipment/${reserveItem._id}/reserve`, data);
      toast.success('Equipment reserved successfully!');
      setShowReserveModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reservation failed');
    }
  };

  const filtered = equipment.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Equipment</h1>
          <p className="page-sub">Manage and borrow sports equipment</p>
        </div>
        {isAdmin && <button onClick={openAdd} className="btn-primary">+ Add Equipment</button>}
      </div>

      <div className="flex gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input-field max-w-xs" placeholder="Search equipment..." />
      </div>

      {/* Low stock alerts */}
      {equipment.filter(e => e.isLowStock).length > 0 && (
        <div className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <p className="text-yellow-800 text-sm font-medium">
            Low stock alert: {equipment.filter(e => e.isLowStock).map(e => e.name).join(', ')}
          </p>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Item</th>
              <th className="table-header">Category</th>
              <th className="table-header">Available</th>
              <th className="table-header">Total</th>
              <th className="table-header">Condition</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  {item.isLowStock && <span className="badge-yellow text-xs">Low Stock</span>}
                </td>
                <td className="table-cell text-gray-500">{item.category}</td>
                <td className="table-cell">
                  <span className={`font-semibold ${item.availableQuantity === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.availableQuantity}
                  </span>
                </td>
                <td className="table-cell text-gray-500">{item.totalQuantity}</td>
                <td className="table-cell">
                  <span className={conditionBadge[item.condition] || 'badge-gray'}>{item.condition}</span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {!isAdmin && item.availableQuantity > 0 && (
                      <button onClick={() => openReserve(item)} className="btn-primary text-xs py-1 px-3">Reserve</button>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(item)} className="btn-secondary text-xs py-1 px-3">Edit</button>
                        <button onClick={() => onDelete(item._id)} className="btn-danger text-xs py-1 px-3">Del</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-10">No equipment found</p>}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editItem ? 'Edit Equipment' : 'Add Equipment'}>
        <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input {...reg('name', { required: 'Name is required' })} className={`input-field ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Basketball" />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select {...reg('category', { required: 'Category is required' })} className={`input-field ${errors.category ? 'input-error' : ''}`}>
              <option value="">Select category</option>
              {['Ball Sports','Racket Sports','Cricket','Athletics','Swimming','Fitness','Other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="error-text">{errors.category.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Qty *</label>
              <input type="number" min="0" {...reg('totalQuantity', { required: 'Required', min: { value: 0, message: 'Min 0' } })} className={`input-field ${errors.totalQuantity ? 'input-error' : ''}`} />
              {errors.totalQuantity && <p className="error-text">{errors.totalQuantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Qty *</label>
              <input type="number" min="0" {...reg('availableQuantity', { required: 'Required', min: { value: 0, message: 'Min 0' } })} className={`input-field ${errors.availableQuantity ? 'input-error' : ''}`} />
              {errors.availableQuantity && <p className="error-text">{errors.availableQuantity.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select {...reg('condition')} className="input-field">
                {['excellent','good','fair','poor'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <input type="number" min="0" {...reg('lowStockThreshold')} className="input-field" placeholder="3" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input {...reg('location')} className="input-field" placeholder="e.g. Store Room B" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...reg('description')} rows={2} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Add'}</button>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Reserve Modal */}
      <Modal isOpen={showReserveModal} onClose={() => setShowReserveModal(false)} title={`Reserve: ${reserveItem?.name}`}>
        <form onSubmit={handleReserve(onReserve)} noValidate className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            Available: <strong>{reserveItem?.availableQuantity}</strong> units
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input type="number" min="1" max={reserveItem?.availableQuantity}
              {...regR('quantity', { required: 'Quantity required', min: { value: 1, message: 'Min 1' } })}
              className={`input-field ${errR.quantity ? 'input-error' : ''}`} />
            {errR.quantity && <p className="error-text">{errR.quantity.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Borrow Date *</label>
              <input type="date" {...regR('borrowDate', { required: 'Required' })}
                className={`input-field ${errR.borrowDate ? 'input-error' : ''}`}
                min={new Date().toISOString().slice(0, 10)} />
              {errR.borrowDate && <p className="error-text">{errR.borrowDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date *</label>
              <input type="date" {...regR('returnDate', { required: 'Required' })}
                className={`input-field ${errR.returnDate ? 'input-error' : ''}`}
                min={new Date().toISOString().slice(0, 10)} />
              {errR.returnDate && <p className="error-text">{errR.returnDate.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <input {...regR('purpose')} className="input-field" placeholder="e.g. Team practice" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Confirm Reservation</button>
            <button type="button" onClick={() => setShowReserveModal(false)} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
