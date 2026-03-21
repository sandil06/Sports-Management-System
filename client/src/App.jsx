import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login        from './pages/Login';
import Register     from './pages/Register';
import Dashboard    from './pages/Dashboard';
import FacilityList from './pages/FacilityList';
import Unauthorized from './pages/Unauthorized';

const Private = ({ children, roles }) => (
  <ProtectedRoute roles={roles}><Layout>{children}</Layout></ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"             element={<Navigate to="/dashboard" replace />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/dashboard"    element={<Private><Dashboard /></Private>} />
          <Route path="/facilities"   element={<Private><FacilityList /></Private>} />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
