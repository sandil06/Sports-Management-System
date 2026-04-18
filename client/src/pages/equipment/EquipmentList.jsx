import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import { useForm } from 'react-hook-form';

// ─── Constants (kept in sync with server via /meta endpoint, these are fallbacks) ─
const FALLBACK_CATEGORIES = [
  'Sports Equipment', 'Training Equipment', 'Medical Equipment',
  'Ball Sports', 'Racket Sports', 'Cricket', 'Athletics', 'Swimming', 'Fitness', 'Other'
];
const FALLBACK_LOCATIONS = [
  'Store Room A', 'Store Room B', 'Ground Storage',
  'Main Hall', 'Indoor Court', 'Outdoor Field', 'Swimming Pool Area', 'Gym Storage'
];
const EQUIPMENT_NAMES = [
  'Badminton Racket', 'Basketball', 'Netball', 'Chess Set',
  'Carrom Board', 'Bat', 'Ball', 'Football', 'Rugger Ball',
  'Volleyball', 'Tennis Racket', 'Table Tennis Bat', 'Hockey Stick',
  'Cricket Bat', 'Cricket Ball', 'Shuttle Cock', 'Swimming Goggles',
  'Jumping Rope', 'Dumbbell', 'Medicine Ball'
];
const conditionBadge = { excellent: 'badge-green', good: 'badge-blue', fair: 'badge-yellow', poor: 'badge-red' };

// ─── Inline error message component ────────────────────────────────────────────
const Err = ({ msg }) => msg
  ? <p style={{ color: '#dc2626', fontSize: '.78rem', marginTop: '.25rem' }}>{msg}</p>
  : null;

export default function EquipmentList() {
  const { isAdmin } = useAuth();

  // Data
  const [equipment, setEquipment]   = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [locations, setLocations]   = useState(FALLBACK_LOCATIONS);
  const [loading, setLoading]       = useState(true);

  // Modal state
  const [showAddModal, setShowAddModal]         = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [reserveItem, setReserveItem] = useState(null);
  const [reservedEquipmentIds, setReservedEquipmentIds] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [showMyReservations, setShowMyReservations] = useState(false);

  // "Other" custom name
  const [customName, setCustomName] = useState('');

  // Search + filters (client-side for instant UX)
  const [search, setSearch]           = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterLocation, setFilterLocation]   = useState('');
  const [filterStock, setFilterStock]         = useState('all');

  // Add/Edit form
  const {
    register: reg, handleSubmit, reset, trigger, watch: watchAdd,
    setValue, formState: { errors }
  } = useForm({ defaultValues: { lowStockThreshold: 3 } });

  // Reserve form
  const {
    register: regR, handleSubmit: handleReserve, reset: resetR,
    watch, formState: { errors: errR }
  } = useForm();

  const borrowDate   = watch('borrowDate');
  const selectedName = watchAdd('name');
  const watchedTotal = watchAdd('totalQuantity');

  // ─── Load equipment + meta ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [{ data: eqData }, { data: metaData }] = await Promise.all([
        api.get('/equipment'),
        api.get('/equipment/meta')
      ]);
      setEquipment(eqData.equipment);
      if (metaData.categories) setCategories(metaData.categories);
      if (metaData.locations)  setLocations(metaData.locations);

      if (!isAdmin) {
        const { data: resData } = await api.get('/equipment/reservations/my');
        setMyReservations(resData.reservations);
        const reservedIds = resData.reservations
          .filter(r => ['pending', 'approved'].includes(r.status))
          .map(r => r.equipment?._id || r.equipment);
        setReservedEquipmentIds(reservedIds);
      } else {
        setReservedEquipmentIds([]);
        setMyReservations([]);
      }
    } catch {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  // ─── Open add modal ─────────────────────────────────────────────────────────
  const openAdd = () => {
    reset({ lowStockThreshold: 3, condition: 'good' });
    setCustomName('');
    setEditItem(null);
    setShowAddModal(true);
  };

  // ─── Open edit modal ────────────────────────────────────────────────────────
  const openEdit = (item) => {
    const isKnown = EQUIPMENT_NAMES.includes(item.name);
    if (!isKnown) {
      reset({ ...item, name: 'Other' });
      setCustomName(item.name);
    } else {
      reset({ ...item });
      setCustomName('');
    }
    setEditItem(item);
    setShowAddModal(true);
  };

  const closeAddModal = () => { setShowAddModal(false); setCustomName(''); };

  // ─── Save (add or edit) ──────────────────────────────────────────────────────
  const onSave = async (formData) => {
    const finalName = formData.name === 'Other' ? customName.trim() : formData.name;
    if (!finalName) { toast.error('Please enter an equipment name'); return; }

    // Client-side duplicate check
    const duplicate = equipment.find(
      e => e.name.toLowerCase() === finalName.toLowerCase() && e._id !== editItem?._id
    );
    if (duplicate) {
      toast.error(`"${finalName}" already exists in the equipment list.`);
      return;
    }

    const payload = { ...formData, name: finalName };
    try {
      if (editItem) await api.put(`/equipment/${editItem._id}`, payload);
      else          await api.post('/equipment', payload);
      toast.success(editItem ? 'Equipment updated!' : 'Equipment added!');
      closeAddModal();
      load();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
               || err.response?.data?.message
               || 'Save failed';
      toast.error(msg);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const onDelete = async (id) => {
    if (!window.confirm('Delete this equipment item?')) return;
    try { await api.delete(`/equipment/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  // ─── Open reserve modal ──────────────────────────────────────────────────────
  const openReserve = (item) => {
    if (reservedEquipmentIds.includes(item._id)) {
      toast.error('You already have an active request for this equipment');
      return;
    }
    resetR({});
    setReserveItem(item);
    setShowReserveModal(true);
  };

  // ─── Submit reservation ──────────────────────────────────────────────────────
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

  // ─── Derived stats ────────────────────────────────────────────────────────────
  const lowStockItems = equipment.filter(e => e.isLowStock && e.availableQuantity > 0);
  const outOfStock    = equipment.filter(e => e.availableQuantity === 0);

  // ─── Client-side filtering ────────────────────────────────────────────────────
  const filtered = equipment.filter(e => {
    const matchSearch   = !search || e.name.toLowerCase().includes(search.toLowerCase())
                          || e.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || e.category === filterCategory;
    const matchCondition= !filterCondition || e.condition === filterCondition;
    const matchLocation = !filterLocation || e.location === filterLocation;
    const matchStock    = filterStock === 'low' ? (e.isLowStock && e.availableQuantity > 0)
                        : filterStock === 'out' ? e.availableQuantity === 0
                        : true;
    return matchSearch && matchCategory && matchCondition && matchLocation && matchStock;
  });

  // Already-added names (for disabling dropdown options)
  const addedNames = equipment
    .filter(e => e._id !== editItem?._id)
    .map(e => e.name.toLowerCase());

  if (loading) return <Spinner />;

  return (
    <div>
      <style>{`
        .low-stock-banner{background:linear-gradient(135deg,#fef3c7,#fde68a);border:1.5px solid #f59e0b;border-radius:14px;padding:1rem 1.25rem;margin-bottom:1.25rem}
        .low-stock-banner .banner-title{font-weight:700;color:#92400e;font-size:.95rem;display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem}
        .low-stock-banner .banner-chips{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.4rem}
        .low-chip{background:#fbbf24;color:#78350f;font-size:.72rem;font-weight:700;padding:.2rem .65rem;border-radius:999px}
        .out-chip{background:#fca5a5;color:#7f1d1d;font-size:.72rem;font-weight:700;padding:.2rem .65rem;border-radius:999px}
        .out-banner{background:linear-gradient(135deg,#fee2e2,#fecaca);border:1.5px solid #f87171;border-radius:14px;padding:.9rem 1.25rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:.6rem}
        .out-banner span{font-size:.88rem;color:#991b1b;font-weight:600}
        .row-low{background:#fffbeb!important}
        .row-out{background:#fff1f2!important}
        .qty-low{color:#d97706;font-weight:700}
        .qty-out{color:#dc2626;font-weight:700}
        .qty-ok{color:#16a34a;font-weight:700}
        .badge-low-stock{display:inline-block;background:#fef3c7;color:#92400e;border:1px solid #fbbf24;font-size:.65rem;font-weight:700;padding:.1rem .45rem;border-radius:999px;margin-left:.35rem;vertical-align:middle}
        .badge-out-stock{display:inline-block;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;font-size:.65rem;font-weight:700;padding:.1rem .45rem;border-radius:999px;margin-left:.35rem;vertical-align:middle}
        .filter-tabs{display:flex;gap:.4rem;flex-wrap:wrap}
        .filter-tab{padding:.35rem .9rem;border-radius:999px;border:1.5px solid #e5e7eb;font-size:.8rem;font-weight:600;cursor:pointer;background:#fff;color:#6b7280;transition:all .2s}
        .filter-tab.active-all{background:#1e3a8a;color:#fff;border-color:#1e3a8a}
        .filter-tab.active-low{background:#f59e0b;color:#fff;border-color:#f59e0b}
        .filter-tab.active-out{background:#ef4444;color:#fff;border-color:#ef4444}
        .threshold-badge{font-size:.7rem;color:#94a3b8;margin-left:.25rem}
        .filter-bar{display:flex;flex-wrap:wrap;gap:.6rem;margin-bottom:1rem;align-items:center}
        .filter-select{padding:.35rem .7rem;border-radius:8px;border:1px solid #d1d5db;font-size:.82rem;background:#fff;color:#374151;cursor:pointer}
        .filter-select:focus{outline:none;border-color:#6366f1}
        .location-badge{display:inline-block;font-size:.7rem;color:#6b7280;background:#f3f4f6;border-radius:4px;padding:.1rem .4rem;margin-top:.15rem}
        .form-section-title{font-size:.8rem;font-weight:600;color:#6366f1;letter-spacing:.04em;text-transform:uppercase;margin-bottom:.5rem;padding-bottom:.25rem;border-bottom:1px solid #e0e7ff}
        .qty-hint{font-size:.72rem;color:#94a3b8;margin-top:.2rem}
        .duplicate-warning{background:#fff7ed;border:1px solid #fb923c;border-radius:8px;padding:.5rem .75rem;font-size:.82rem;color:#9a3412;margin-bottom:.5rem}
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Equipment</h1>
          <p className="page-sub">Manage and borrow sports equipment</p>
        </div>
        <div className="flex gap-2">
          {!isAdmin && myReservations.length > 0 && (
            <button
              onClick={() => setShowMyReservations(v => !v)}
              className="btn-secondary text-sm relative"
            >
              📋 My Reservations
              {myReservations.filter(r => r.status === 'pending').length > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  background: '#f59e0b', color: '#fff', borderRadius: '999px',
                  fontSize: '.65rem', fontWeight: 700, padding: '1px 6px'
                }}>
                  {myReservations.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          )}
          {isAdmin && <button onClick={openAdd} className="btn-primary">+ Add Equipment</button>}
        </div>
      </div>

      {/* ── My Reservations Panel (students only) ───────────────────────────── */}
      {!isAdmin && showMyReservations && (
        <div style={{
          background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: '14px',
          padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(99,102,241,.07)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1e3a8a' }}>📋 My Reservations</h2>
            <button onClick={() => setShowMyReservations(false)} style={{ color: '#94a3b8', fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
          {myReservations.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>You have no reservations yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Equipment', 'Qty', 'Borrow Date', 'Return Date', 'Purpose', 'Status'].map(h => (
                      <th key={h} style={{ padding: '.5rem .75rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '.75rem', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myReservations.map(r => {
                    const statusStyles = {
                      pending:  { bg: '#fef9c3', color: '#854d0e', border: '#fde047', icon: '⏳' },
                      approved: { bg: '#dcfce7', color: '#166534', border: '#86efac', icon: '✅' },
                      rejected: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: '❌' },
                      returned: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', icon: '📦' },
                      overdue:  { bg: '#ffedd5', color: '#9a3412', border: '#fdba74', icon: '⚠️' },
                    };
                    const s = statusStyles[r.status] || statusStyles.pending;
                    const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                    return (
                      <tr key={r._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '.6rem .75rem', fontWeight: 600, color: '#1e293b' }}>
                          {r.equipment?.name || '—'}
                          <div style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 400 }}>{r.equipment?.category}</div>
                        </td>
                        <td style={{ padding: '.6rem .75rem', textAlign: 'center' }}>
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: '999px', padding: '2px 10px', fontWeight: 700, fontSize: '.8rem' }}>{r.quantity}</span>
                        </td>
                        <td style={{ padding: '.6rem .75rem', color: '#475569', whiteSpace: 'nowrap' }}>{fmtDate(r.borrowDate)}</td>
                        <td style={{ padding: '.6rem .75rem', color: '#475569', whiteSpace: 'nowrap' }}>{fmtDate(r.returnDate)}</td>
                        <td style={{ padding: '.6rem .75rem', color: '#64748b', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.purpose || '—'}</td>
                        <td style={{ padding: '.6rem .75rem' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: s.bg, color: s.color,
                            border: `1px solid ${s.border}`,
                            borderRadius: '999px', padding: '3px 10px',
                            fontSize: '.75rem', fontWeight: 700
                          }}>
                            {s.icon} {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                          {r.status === 'approved' && (
                            <div style={{ fontSize: '.7rem', color: '#16a34a', marginTop: '3px' }}>Ready to collect 🎉</div>
                          )}
                          {r.status === 'rejected' && (
                            <div style={{ fontSize: '.7rem', color: '#dc2626', marginTop: '3px' }}>Contact admin</div>
                          )}
                          {r.status === 'pending' && (
                            <div style={{ fontSize: '.7rem', color: '#d97706', marginTop: '3px' }}>Awaiting approval</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Out-of-stock banner */}
      {outOfStock.length > 0 && (
        <div className="out-banner">
          <span>🔴</span>
          <span>
            <strong>{outOfStock.length} item{outOfStock.length > 1 ? 's' : ''} out of stock:</strong>{' '}
            {outOfStock.map(e => e.name).join(', ')}
          </span>
        </div>
      )}

      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div className="low-stock-banner">
          <div className="banner-title">
            ⚠️ Low Stock Alert — {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low
          </div>
          <div className="banner-chips">
            {lowStockItems.map(e => (
              <span key={e._id} className="low-chip">{e.name} ({e.availableQuantity} left)</span>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="filter-bar">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field" style={{ maxWidth: '220px' }}
          placeholder="🔍 Search by name or category..." />

        <select className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="filter-select" value={filterCondition} onChange={e => setFilterCondition(e.target.value)}>
          <option value="">All Conditions</option>
          {['excellent', 'good', 'fair', 'poor'].map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        <select className="filter-select" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
          <option value="">All Locations</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <div className="filter-tabs">
          <button className={`filter-tab ${filterStock === 'all' ? 'active-all' : ''}`} onClick={() => setFilterStock('all')}>All</button>
          <button className={`filter-tab ${filterStock === 'low' ? 'active-low' : ''}`} onClick={() => setFilterStock('low')}>
            ⚠️ Low {lowStockItems.length > 0 && `(${lowStockItems.length})`}
          </button>
          <button className={`filter-tab ${filterStock === 'out' ? 'active-out' : ''}`} onClick={() => setFilterStock('out')}>
            🔴 Out {outOfStock.length > 0 && `(${outOfStock.length})`}
          </button>
        </div>

        {(search || filterCategory || filterCondition || filterLocation || filterStock !== 'all') && (
          <button
            onClick={() => { setSearch(''); setFilterCategory(''); setFilterCondition(''); setFilterLocation(''); setFilterStock('all'); }}
            style={{ fontSize: '.8rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Item</th>
              <th className="table-header">Category</th>
              <th className="table-header">Location</th>
              <th className="table-header">Available</th>
              <th className="table-header">Total</th>
              <th className="table-header">Alert Level</th>
              <th className="table-header">Condition</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const isOut      = item.availableQuantity === 0;
              const isLow      = item.isLowStock && !isOut;
              const isReserved = reservedEquipmentIds.includes(item._id);
              return (
                <tr key={item._id} className={`${isOut ? 'row-out' : isLow ? 'row-low' : ''} hover:brightness-95 transition`}>
                  <td className="table-cell">
                    <p className="font-medium text-gray-800">
                      {item.name}
                      {isOut && <span className="badge-out-stock">Out of Stock</span>}
                      {isLow && <span className="badge-low-stock">Low Stock</span>}
                      {isReserved && <span className="badge-gray ml-2">Already requested</span>}
                    </p>
                  </td>
                  <td className="table-cell text-gray-500">{item.category}</td>
                  <td className="table-cell">
                    {item.location
                      ? <span className="location-badge">{item.location}</span>
                      : <span style={{ color: '#d1d5db', fontSize: '.8rem' }}>—</span>}
                  </td>
                  <td className="table-cell">
                    <span className={isOut ? 'qty-out' : isLow ? 'qty-low' : 'qty-ok'}>
                      {isOut ? '✖ 0' : item.availableQuantity}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500">{item.totalQuantity}</td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-500">
                      {item.lowStockThreshold ?? 3}
                      <span className="threshold-badge">min</span>
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={conditionBadge[item.condition] || 'badge-gray'}>{item.condition}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      {!isAdmin && item.availableQuantity > 0 && (
                        <button
                          onClick={() => openReserve(item)}
                          disabled={isReserved}
                          className={`btn-primary text-xs py-1 px-3 ${isReserved ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {isReserved ? 'Requested' : 'Reserve'}
                        </button>
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
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-10">No equipment found</p>}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={showAddModal} onClose={closeAddModal} title={editItem ? 'Edit Equipment' : 'Add Equipment'}>
        <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">

          {/* ── Name ── */}
          <div>
            <div className="form-section-title">Basic Info</div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
            <select
              {...reg('name', {
                required: 'Please select an equipment name',
                validate: val => {
                  const finalVal = val === 'Other' ? customName.trim() : val;
                  if (!finalVal) return 'Please select or type a name';
                  const dup = equipment.find(
                    e => e.name.toLowerCase() === finalVal.toLowerCase() && e._id !== editItem?._id
                  );
                  return !dup || `"${finalVal}" already exists — use Edit instead`;
                }
              })}
              className={`input-field ${errors.name ? 'input-error' : ''}`}
            >
              <option value="">-- Select Equipment --</option>
              {EQUIPMENT_NAMES.map(n => {
                const alreadyAdded = addedNames.includes(n.toLowerCase());
                return (
                  <option key={n} value={n} disabled={alreadyAdded}>
                    {n}{alreadyAdded ? ' (already added)' : ''}
                  </option>
                );
              })}
              <option value="Other">+ Other (type your own)</option>
            </select>

            {selectedName === 'Other' && (
              <input
                type="text"
                className={`input-field mt-2 ${errors.name ? 'input-error' : ''}`}
                placeholder="Type equipment name here..."
                value={customName}
                maxLength={60}
                autoFocus
                onChange={e => { setCustomName(e.target.value); trigger('name'); }}
              />
            )}
            <Err msg={errors.name?.message} />
          </div>

          {/* ── Category ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              {...reg('category', { required: 'Category is required' })}
              className={`input-field ${errors.category ? 'input-error' : ''}`}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Err msg={errors.category?.message} />
          </div>

          {/* ── Quantities ── */}
          <div>
            <div className="form-section-title">Quantity & Stock</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Qty *</label>
                <input
                  type="number" min="0"
                  {...reg('totalQuantity', {
                    required: 'Required',
                    min: { value: 0, message: 'Cannot be negative' },
                    onChange: () => { trigger('availableQuantity'); trigger('lowStockThreshold'); }
                  })}
                  className={`input-field ${errors.totalQuantity ? 'input-error' : ''}`} />
                <Err msg={errors.totalQuantity?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Qty *</label>
                <input
                  type="number" min="0"
                  {...reg('availableQuantity', {
                    required: 'Required',
                    min: { value: 0, message: 'Cannot be negative' },
                    validate: (val, formValues) => {
                      if (Number(val) < 0) return 'Available quantity cannot be negative';
                      if (Number(val) > Number(formValues.totalQuantity))
                        return 'Available quantity cannot exceed total quantity';
                      return true;
                    }
                  })}
                  className={`input-field ${errors.availableQuantity ? 'input-error' : ''}`} />
                <Err msg={errors.availableQuantity?.message} />
                <p className="qty-hint">Must be ≤ Total Qty</p>
              </div>
            </div>
          </div>

          {/* ── Condition + Stock Alert Level ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select {...reg('condition')} className="input-field">
                {['excellent', 'good', 'fair', 'poor'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Alert Level *
                <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '.73rem', marginLeft: '.3rem' }}>
                  (alert when below)
                </span>
              </label>
              <input
                type="number" min="0"
                {...reg('lowStockThreshold', {
                  required: 'Required',
                  min: { value: 0, message: 'Cannot be negative' },
                  validate: (val, formValues) => {
                    if (Number(formValues.totalQuantity) > 0 && Number(val) >= Number(formValues.totalQuantity))
                      return 'Alert level must be less than total quantity';
                    return true;
                  }
                })}
                className={`input-field ${errors.lowStockThreshold ? 'input-error' : ''}`}
                placeholder="e.g. 3" />
              <Err msg={errors.lowStockThreshold?.message} />
              <p className="qty-hint">Must be &lt; Total Qty</p>
            </div>
          </div>

          {/* ── Location (dropdown) ── */}
          <div>
            <div className="form-section-title">Location & Notes</div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
            <select {...reg('location')} className="input-field">
              <option value="">-- Select Location --</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...reg('description')} rows={2} className="input-field"
              placeholder="Optional notes about this equipment..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editItem ? 'Update Equipment' : 'Add Equipment'}</button>
            <button type="button" onClick={closeAddModal} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* ── Reserve Modal ────────────────────────────────────────────────────── */}
      <Modal isOpen={showReserveModal} onClose={() => setShowReserveModal(false)} title={`Reserve: ${reserveItem?.name}`}>
        <form onSubmit={handleReserve(onReserve)} noValidate className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            Available: <strong>{reserveItem?.availableQuantity}</strong> units
            {reserveItem?.location && <span className="ml-2 text-blue-500">— {reserveItem.location}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input type="number" min="1" max={reserveItem?.availableQuantity}
              {...regR('quantity', {
                required: 'Quantity is required',
                min: { value: 1, message: 'Must be at least 1' },
                max: { value: reserveItem?.availableQuantity, message: `Max available is ${reserveItem?.availableQuantity}` }
              })}
              className={`input-field ${errR.quantity ? 'input-error' : ''}`} />
            <Err msg={errR.quantity?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Borrow Date *</label>
              <input type="date"
                {...regR('borrowDate', { required: 'Required' })}
                className={`input-field ${errR.borrowDate ? 'input-error' : ''}`}
                min={new Date().toISOString().slice(0, 10)} />
              <Err msg={errR.borrowDate?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date *</label>
              <input type="date"
                {...regR('returnDate', {
                  required: 'Required',
                  validate: value => !borrowDate || value >= borrowDate || 'Return date cannot be before borrow date'
                })}
                className={`input-field ${errR.returnDate ? 'input-error' : ''}`}
                min={borrowDate || new Date().toISOString().slice(0, 10)} />
              <Err msg={errR.returnDate?.message} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <input {...regR('purpose')} className="input-field" placeholder="e.g. Team practice, match day..." />
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