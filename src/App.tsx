import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import TraktorFormPage from './pages/TraktorFormPage';
import ForkliftFormPage from './pages/ForkliftFormPage';
import ForkliftHomePage from './pages/ForkliftHomePage';
import TraktorHomePage from './pages/TraktorHomePage';
import MazotFormPage from './pages/MazotFormPage';
import UzmanLoginPage from './pages/UzmanLoginPage';
import DashboardPage from './pages/DashboardPage';
import OperatorManagementPage from './pages/OperatorManagementPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/form/traktor"
          element={
            <ProtectedRoute allowedRoles={['traktor']}>
              <TraktorFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/form/forklift"
          element={
            <ProtectedRoute allowedRoles={['forklift']}>
              <ForkliftFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home/forklift"
          element={
            <ProtectedRoute allowedRoles={['forklift']}>
              <ForkliftHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home/traktor"
          element={
            <ProtectedRoute allowedRoles={['traktor']}>
              <TraktorHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/form/mazot"
          element={
            <ProtectedRoute allowedRoles={['traktor', 'forklift']}>
              <MazotFormPage />
            </ProtectedRoute>
          }
        />

        <Route path="/uzman/giris" element={<UzmanLoginPage />} />

        <Route
          path="/uzman/dashboard"
          element={
            <ProtectedRoute allowedRoles={['uzman']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/uzman/operatorler"
          element={
            <ProtectedRoute allowedRoles={['uzman']}>
              <OperatorManagementPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
