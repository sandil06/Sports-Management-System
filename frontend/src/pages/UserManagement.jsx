import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const roleBadge = { admin:'badge-red', coach:'badge-blue', student:'badge-green' };

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = async () => {
    try { const { data } = await api.get('/users'); setUsers(data.users); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (id) => {
    try {
      const { data } = await api.put(`/users/${id}/toggle`);
      toast.success(data.message);
      load();
    } catch { toast.error('Failed to toggle status'); }
  };

  const changeRole = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, { role });
      toast.success('Role updated');
      load();
    } catch { toast.error('Failed to update role'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('User deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.studentId?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">User Management</h1>
        <p className="page-sub">Manage accounts, roles and access control</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users',    val: users.length,                             color: 'border-blue-500' },
          { label: 'Students',       val: users.filter(u => u.role==='student').length, color: 'border-green-500' },
          { label: 'Coaches',        val: users.filter(u => u.role==='coach').length,   color: 'border-blue-400' },
          { label: 'Active Accounts',val: users.filter(u => u.isActive).length,         color: 'border-purple-500' },
        ].map(s => (
          <div key={s.label} className={`card p-4 border-l-4 ${s.color}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input-field max-w-xs" placeholder="Search by name, email, ID..." />
        <div className="flex gap-2">
          {['all','student','coach','admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                roleFilter === r ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">User</th>
              <th className="table-header">Student ID</th>
              <th className="table-header">Role</th>
              <th className="table-header">Status</th>
              <th className="table-header">Last Login</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell text-gray-500 text-sm">{u.studentId || '—'}</td>
                <td className="table-cell">
                  {u._id === currentUser.id ? (
                    <span className={roleBadge[u.role]}>{u.role}</span>
                  ) : (
                    <select value={u.role} onChange={e => changeRole(u._id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="student">student</option>
                      <option value="coach">coach</option>
                      <option value="admin">admin</option>
                    </select>
                  )}
                </td>
                <td className="table-cell">
                  <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-cell text-xs text-gray-500">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {u._id !== currentUser.id && (
                      <>
                        <button onClick={() => toggleStatus(u._id)}
                          className={`text-xs py-1 px-3 rounded-lg font-medium transition-colors ${
                            u.isActive
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                              : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                          }`}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteUser(u._id)} className="btn-danger text-xs py-1 px-3">Del</button>
                      </>
                    )}
                    {u._id === currentUser.id && <span className="text-xs text-gray-400 italic">You</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p>No users found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
