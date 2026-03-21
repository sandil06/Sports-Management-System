import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const StatCard = ({ label, value, icon, color, to }) => (
  <Link to={to} className={`card p-5 hover:shadow-md transition-shadow border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <span className="text-4xl opacity-80">{icon}</span>
    </div>
  </Link>
);

const sportEmoji = { Cricket:'🏏', Badminton:'🏸', Chess:'♟️', Rugby:'🏉', Tennis:'🎾', Carrom:'🎯', Football:'⚽', 'Table Tennis':'🏓', Volleyball:'🏐', Swimming:'🏊', 'Track & Field':'🏃', Netball:'🤾', Basketball:'🏀', Hockey:'🏑' };

export default function Dashboard() {
  const { user, isAdmin, isCoach } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, eqRes, facRes, tourRes] = await Promise.all([
          api.get('/tournaments'),
          api.get('/equipment'),
          api.get('/facilities'),
          api.get('/tournaments'),
        ]);
        setStats({
          tournaments: tRes.data.count,
          equipment: eqRes.data.count,
          facilities: facRes.data.facilities.length,
          lowStock: eqRes.data.equipment.filter(e => e.isLowStock).length,
        });
        setRecentTournaments(tourRes.data.tournaments.slice(0, 4));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  const roleColor = { admin: 'text-purple-700', coach: 'text-blue-700', student: 'text-orange-600' };
  const statusBadge = { upcoming:'badge-blue', ongoing:'badge-green', completed:'badge-gray', cancelled:'badge-red' };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center text-white font-black text-xl">
          {user?.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-blue-900">
            Welcome, <span className={roleColor[user?.role]}>{user?.name}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.studentId} · <span className="capitalize font-medium">{user?.role}</span>
            {user?.department && ` · ${user.department}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Tournaments"     value={stats?.tournaments} icon="🏆" color="border-blue-800"   to="/tournaments" />
        <StatCard label="Equipment Items" value={stats?.equipment}   icon="🎽" color="border-orange-500" to="/equipment" />
        <StatCard label="Facilities"      value={stats?.facilities}  icon="🏟️" color="border-purple-500" to="/facilities" />
        <StatCard label="Low Stock"       value={stats?.lowStock}    icon="⚠️" color="border-yellow-500" to="/equipment" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Upcoming Tournaments</h2>
          {recentTournaments.length === 0 ? (
            <p className="text-gray-400 text-sm">No tournaments found.</p>
          ) : (
            <div className="space-y-3">
              {recentTournaments.map(t => (
                <div key={t._id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sportEmoji[t.sport] || '🏅'}</span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.venue} · {new Date(t.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={statusBadge[t.status] || 'badge-gray'}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/tournaments" className="text-orange-500 text-sm font-medium hover:underline mt-3 block">View all →</Link>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/tournaments" className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
              <span className="text-3xl mb-2">🏆</span>
              <span className="text-sm font-medium text-orange-700">Tournaments</span>
            </Link>
            <Link to="/facilities" className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              <span className="text-3xl mb-2">🏟️</span>
              <span className="text-sm font-medium text-blue-700">Book Facility</span>
            </Link>
            <Link to="/equipment" className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <span className="text-3xl mb-2">🎽</span>
              <span className="text-sm font-medium text-green-700">Borrow Equipment</span>
            </Link>
            {(isAdmin || isCoach) && (
              <Link to="/tournaments/create" className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                <span className="text-3xl mb-2">➕</span>
                <span className="text-sm font-medium text-purple-700">Create Tournament</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
