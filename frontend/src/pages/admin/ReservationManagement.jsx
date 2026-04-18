import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-800 border border-yellow-300',
  approved: 'bg-green-100 text-green-800 border border-green-300',
  rejected: 'bg-red-100 text-red-800 border border-red-300',
  returned: 'bg-blue-100 text-blue-800 border border-blue-300',
  overdue:  'bg-orange-100 text-orange-800 border border-orange-300',
};

const STATUS_ICONS = {
  pending:  '⏳',
  approved: '✅',
  rejected: '❌',
  returned: '📦',
  overdue:  '⚠️',
};

export default function ReservationManagement() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/equipment/reservations/all');
      setReservations(data.reservations);
    } catch {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    try {
      await api.put(`/equipment/reservations/${id}/approve`);
      toast.success('✅ Reservation approved!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this reservation? The quantity will be restored.')) return;
    setActionLoading(id + '_reject');
    try {
      await api.put(`/equipment/reservations/${id}/reject`);
      toast.success('❌ Reservation rejected and stock restored.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (id) => {
    if (!window.confirm('Mark this equipment as returned?')) return;
    setActionLoading(id + '_return');
    try {
      await api.put(`/equipment/reservations/${id}/return`);
      toast.success('📦 Equipment marked as returned!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as returned');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = reservations.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter;
    const matchSearch = !search ||
      r.equipment?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = reservations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipment Reservation Management</h1>
        <p className="text-gray-500 mt-1">Approve, reject or mark equipment reservations as returned</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',    value: reservations.length, color: 'bg-gray-100 text-gray-800',     key: 'all'      },
          { label: 'Pending',  value: counts.pending  || 0, color: 'bg-yellow-100 text-yellow-800', key: 'pending'  },
          { label: 'Approved', value: counts.approved || 0, color: 'bg-green-100 text-green-800',   key: 'approved' },
          { label: 'Returned', value: counts.returned || 0, color: 'bg-blue-100 text-blue-800',     key: 'returned' },
          { label: 'Rejected', value: counts.rejected || 0, color: 'bg-red-100 text-red-800',       key: 'rejected' },
        ].map(c => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`rounded-xl p-3 text-center font-semibold shadow-sm transition hover:opacity-80 ${c.color} ${filter === c.key ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
          >
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs mt-1">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by equipment or student name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="returned">Returned</option>
          <option value="rejected">Rejected</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg font-medium">No reservations found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                {['Student', 'Equipment', 'Qty', 'Borrow Date', 'Return Date', 'Purpose', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r._id} className="hover:bg-gray-50 transition">
                  {/* Student */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-sm">{r.user?.name || '—'}</div>
                    <div className="text-xs text-gray-400">{r.user?.email || ''}</div>
                    {r.user?.studentId && <div className="text-xs text-blue-500">{r.user.studentId}</div>}
                  </td>
                  {/* Equipment */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-sm">{r.equipment?.name || '—'}</div>
                    <div className="text-xs text-gray-400">{r.equipment?.category || ''}</div>
                  </td>
                  {/* Qty */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                      {r.quantity}
                    </span>
                  </td>
                  {/* Borrow Date */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fmtDate(r.borrowDate)}</td>
                  {/* Return Date */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fmtDate(r.returnDate)}</td>
                  {/* Purpose */}
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[140px] truncate" title={r.purpose}>
                    {r.purpose || '—'}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[r.status] || ''}`}>
                      {STATUS_ICONS[r.status]} {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(r._id)}
                            disabled={actionLoading === r._id + '_approve'}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            {actionLoading === r._id + '_approve' ? '...' : '✅ Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(r._id)}
                            disabled={actionLoading === r._id + '_reject'}
                            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            {actionLoading === r._id + '_reject' ? '...' : '❌ Reject'}
                          </button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button
                          onClick={() => handleReturn(r._id)}
                          disabled={actionLoading === r._id + '_return'}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          {actionLoading === r._id + '_return' ? '...' : '📦 Mark Returned'}
                        </button>
                      )}
                      {['returned', 'rejected'].includes(r.status) && (
                        <span className="text-xs text-gray-400 italic">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}