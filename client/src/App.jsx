import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Home              from './pages/Home';
import Login             from './pages/Login';
import Register          from './pages/Register';
import SponsorRegister   from './pages/SponsorRegister';
import Dashboard         from './pages/Dashboard';
import TournamentList    from './pages/TournamentList';
import TournamentForm    from './pages/TournamentForm';
import EventList         from './pages/EventList';
import EventForm         from './pages/EventForm';
import Sponsors          from './pages/Sponsors';
import SponsorDashboard  from './pages/SponsorDashboard';
import SponsorTournaments from './pages/SponsorTournaments';
import MySponsorships    from './pages/MySponsorships';
import SponsorApprovals  from './pages/SponsorApprovals';
import Unauthorized      from './pages/Unauthorized';

const Private = ({ children, roles }) => (
  <ProtectedRoute roles={roles}><Layout>{children}</Layout></ProtectedRoute>
);
const SponsorPrivate = ({ children }) => (
  <ProtectedRoute sponsorOnly><Layout>{children}</Layout></ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"                        element={<Home />} />
          <Route path="/login"                   element={<Login />} />
          <Route path="/register"                element={<Register />} />
          <Route path="/sponsor/register"        element={<SponsorRegister />} />
          <Route path="/unauthorized"            element={<Unauthorized />} />

          <Route path="/dashboard"               element={<Private><Dashboard /></Private>} />
          <Route path="/events"                  element={<Private><EventList /></Private>} />
          <Route path="/events/create"           element={<Private roles={['admin','coach']}><EventForm /></Private>} />
          <Route path="/events/edit/:id"         element={<Private roles={['admin','coach']}><EventForm /></Private>} />
          <Route path="/tournaments"             element={<Private><TournamentList /></Private>} />
          <Route path="/tournaments/create"      element={<Private roles={['admin','coach']}><TournamentForm /></Private>} />
          <Route path="/tournaments/edit/:id"    element={<Private roles={['admin','coach']}><TournamentForm /></Private>} />
          <Route path="/sponsors"                element={<Private><Sponsors /></Private>} />
          <Route path="/admin/sponsors"          element={<Private roles={['admin']}><SponsorApprovals /></Private>} />

          <Route path="/sponsor/dashboard"       element={<SponsorPrivate><SponsorDashboard /></SponsorPrivate>} />
          <Route path="/sponsor/tournaments"     element={<SponsorPrivate><SponsorTournaments /></SponsorPrivate>} />
          <Route path="/sponsor/my-sponsorships" element={<SponsorPrivate><MySponsorships /></SponsorPrivate>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
