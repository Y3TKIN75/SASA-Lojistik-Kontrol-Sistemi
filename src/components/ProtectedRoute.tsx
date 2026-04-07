import { Navigate } from 'react-router-dom';
import { getSession } from '../lib/session';
import type { Role } from '../types';

interface Props {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const session = getSession();
  if (!session || !allowedRoles.includes(session.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
