import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const userLinks = [
  { to: '/dashboard',      label: 'Dashboard',          roles: ['student','coach','admin'] },
  { to: '/tournaments',    label: 'Tournaments',         roles: ['student','coach','admin'] },
  { to: '/events',         label: 'Events',              roles: ['student','coach','admin'] },
  { to: '/equipment',      label: 'Equipment',           roles: ['student','coach','admin'] },
  { to: '/facilities',     label: 'Facilities',          roles: ['student','coach','admin'] },
  { to: '/admin/users',    label: 'Users',               roles: ['admin'] },
  { to: '/admin/sponsors', label: 'Sponsor Approvals',   roles: ['admin'] },
];

const sponsorLinks = [
  { to: '/sponsor/dashboard',       label: 'Dashboard' },
  { to: '/sponsor/tournaments',     label: 'Tournaments' },
  { to: '/sponsor/my-sponsorships', label: 'My Sponsorships' },
];

export default function Navbar() {
  const { user, sponsor, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const handleLogout = () => { logout(); navigate('/login'); };
  const roleBg = { admin:'bg-purple-100 text-purple-800', coach:'bg-blue-100 text-blue-800', student:'bg-green-100 text-green-800' };

  return (
    <nav className="bg-blue-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to={sponsor ? '/sponsor/dashboard' : '/dashboard'} className="flex items-center gap-2">
          <div className="bg-orange-500 text-white font-black text-sm px-2 py-1 rounded">SA360</div>
          <span className="text-white font-bold text-base hidden sm:block">SliitArena <span className="text-orange-400">360</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
          {sponsor
            ? sponsorLinks.map(link => (
                <Link key={link.to} to={link.to}
                  className={"px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap " +
                    (pathname.startsWith(link.to) ? 'bg-orange-500 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white')}>
                  {link.label}
                </Link>
              ))
            : userLinks.filter(l => l.roles.includes(user?.role)).map(link => (
                <Link key={link.to} to={link.to}
                  className={"px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap " +
                    (pathname.startsWith(link.to) ? 'bg-orange-500 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white')}>
                  {link.label}
                </Link>
              ))
          }
        </div>

        <div className="flex items-center gap-2">
          {sponsor ? (
            <span className="badge-orange text-xs">Sponsor</span>
          ) : (
            <span className={"text-xs px-2 py-1 rounded-full font-medium capitalize " + (roleBg[user?.role] || 'bg-gray-100 text-gray-700')}>
              {user?.role}
            </span>
          )}
          <span className="text-sm text-blue-200 hidden sm:block">{sponsor ? sponsor.name : user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-blue-300 hover:text-orange-400 transition-colors font-medium ml-1">Logout</button>
        </div>
      </div>
    </nav>
  );
}
