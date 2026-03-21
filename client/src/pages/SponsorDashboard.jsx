import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Spinner from '../components/Spinner';

export default function SponsorDashboard() {
  const { sponsor } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sponsors/tournaments').then(({ data }) => {
      setTournaments(data.tournaments);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const sponsored = sponsor?.sponsoredTournaments?.length || 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Welcome, <span className="text-orange-500">{sponsor?.name}</span> 🤝</h1>
        <p className="text-gray-500 text-sm mt-1">{sponsor?.company} — Sponsor Dashboard</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 border-l-4 border-blue-800">
          <p className="text-xs text-gray-500">Available Tournaments</p>
          <p className="text-3xl font-bold text-blue-900">{tournaments.length}</p>
        </div>
        <div className="card p-5 border-l-4 border-orange-500">
          <p className="text-xs text-gray-500">Events Sponsored</p>
          <p className="text-3xl font-bold text-orange-600">{sponsored}</p>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-xs text-gray-500">Total Contribution</p>
          <p className="text-2xl font-bold text-green-700">LKR {(sponsor?.totalContribution || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="section-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-900">Upcoming Tournaments</h2>
          <Link to="/sponsor/tournaments" className="text-sm text-orange-500 font-medium hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {tournaments.slice(0, 4).map(t => (
            <div key={t._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800 text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">{t.sport} • {t.venue} • {new Date(t.startDate).toLocaleDateString()}</p>
              </div>
              <Link to="/sponsor/tournaments" className="btn-orange text-xs py-1.5 px-3">Sponsor</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/sponsor/tournaments" className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
            <span className="text-3xl mb-2">🏆</span>
            <span className="text-sm font-medium text-orange-700">Sponsor a Tournament</span>
          </Link>
          <Link to="/sponsor/my-sponsorships" className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            <span className="text-3xl mb-2">📋</span>
            <span className="text-sm font-medium text-blue-700">My Sponsorships</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
