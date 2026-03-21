import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const sportEmoji = { Cricket:'🏏', Badminton:'🏸', Chess:'♟️', Rugby:'🏉', Tennis:'🎾', Carrom:'🎯', Football:'⚽', 'Table Tennis':'🏓', Volleyball:'🏐', Swimming:'🏊', 'Track & Field':'🏃', Netball:'🤾', Basketball:'🏀', Hockey:'🏑' };

export default function MySponsorships() {
  const { sponsor } = useAuth();
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sponsors/me').then(({ data }) => {
      setDetails(data.sponsor?.sponsoredTournaments || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">My Sponsorships</h1>
        <p className="page-sub">All tournaments you have sponsored</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 border-l-4 border-orange-500">
          <p className="text-xs text-gray-500">Total Events Sponsored</p>
          <p className="text-3xl font-bold text-orange-600">{details.length}</p>
        </div>
        <div className="card p-5 border-l-4 border-blue-800">
          <p className="text-xs text-gray-500">Total Contribution</p>
          <p className="text-2xl font-bold text-blue-900">LKR {(sponsor?.totalContribution || 0).toLocaleString()}</p>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-xs text-gray-500">Company</p>
          <p className="text-lg font-bold text-green-700">{sponsor?.company}</p>
        </div>
      </div>

      {details.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🤝</div>
          <p className="text-lg font-medium">No sponsorships yet</p>
          <p className="text-sm mt-1">Go to Tournaments to sponsor an event</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Tournament</th>
                <th className="table-header">Sponsorship Name</th>
                <th className="table-header">Amount (LKR)</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody>
              {details.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-blue-900">
                    {s.tournament?.name || 'Tournament'}
                  </td>
                  <td className="table-cell">
                    <span className="badge-orange">{s.sponsorshipName}</span>
                  </td>
                  <td className="table-cell font-semibold text-green-700">
                    {Number(s.amount).toLocaleString()}
                  </td>
                  <td className="table-cell text-gray-500 text-xs">
                    {new Date(s.createdAt || Date.now()).toLocaleDateString()}
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
