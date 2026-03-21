import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import Spinner from '../components/Spinner';

export default function SponsorApprovals() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/sponsors/list');
      setSponsors(data.sponsors);
    } catch { toast.error('Failed to load sponsors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (sponsorId, tournamentId, status) => {
    try {
      await api.put('/sponsors/approve/' + sponsorId + '/' + tournamentId, { status });
      toast.success('Sponsorship ' + status + '!');
      load();
    } catch { toast.error('Action failed'); }
  };

  if (loading) return <Spinner />;

  const pendingCount = sponsors.reduce((acc, s) =>
    acc + (s.sponsoredTournaments?.filter(t => t.status === 'pending').length || 0), 0
  );

  const statusBadge = { pending:'badge-yellow', approved:'badge-green', rejected:'badge-red' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Sponsor Approvals</h1>
        <p className="page-sub">Review and approve sponsorship applications</p>
      </div>

      {pendingCount > 0 && (
        <div className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <span>⏳</span>
          <p className="text-yellow-800 text-sm font-medium">{pendingCount} sponsorship application{pendingCount > 1 ? 's' : ''} waiting for approval</p>
        </div>
      )}

      <div className="space-y-4">
        {sponsors.filter(s => s.sponsoredTournaments?.length > 0).map(s => (
          <div key={s._id} className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-700 font-bold">
                {s.company?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-blue-900">{s.company}</p>
                <p className="text-xs text-gray-500">{s.name} • {s.email}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500">Total contribution</p>
                <p className="font-bold text-green-700">LKR {(s.totalContribution || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              {s.sponsoredTournaments.map((entry, i) => (
                <div key={i} className={"flex items-center justify-between p-3 rounded-lg border " +
                  (entry.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                   entry.status === 'approved' ? 'bg-green-50 border-green-200' :
                   'bg-red-50 border-red-200')}>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {entry.tournament?.name || 'Tournament'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.sponsorshipName} • LKR {Number(entry.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Applied: {new Date(entry.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={statusBadge[entry.status] || 'badge-gray'}>{entry.status}</span>
                    {entry.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAction(s._id, entry.tournament?._id, 'approved')}
                          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium">
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(s._id, entry.tournament?._id, 'rejected')}
                          className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700 font-medium">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {sponsors.filter(s => s.sponsoredTournaments?.length > 0).length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🤝</div>
            <p>No sponsorship applications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
