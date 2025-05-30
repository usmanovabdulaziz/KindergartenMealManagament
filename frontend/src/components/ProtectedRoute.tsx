import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for specific role if required
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole.map(r => r.toLowerCase())  // ensure all required roles are lower-case
      : [requiredRole.toLowerCase()];
    if (!userRole || !requiredRoles.includes(userRole.toLowerCase())) {
      // Redirect unauthorized users to login page instead of not-authorized
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;