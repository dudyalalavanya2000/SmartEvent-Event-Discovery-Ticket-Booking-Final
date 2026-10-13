
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem("access_token");
  const userData = localStorage.getItem("user");

  // Redirect users who are not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let user = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Failed to parse user data:", error);
    localStorage.removeItem("user");
  }

  // Check roles when the route requires specific permissions
  if (allowedRoles.length > 0) {
    const userRole = user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;