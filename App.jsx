
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Main pages
import Home from "./pages/Home";
import EventDetails from "./pages/EventDetails";
import BookingConfirmation from "./pages/BookingConfirmation";
import VerifyTicket from "./pages/VerifyTicket";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";

// User pages
import BookingHistory from "./pages/BookingHistory";
import Tickets from "./pages/Tickets";

// Organizer pages
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import ManageEvents from "./pages/organizer/ManageEvents";
import CreateEvent from "./pages/organizer/CreateEvent";
import EditEvent from "./pages/organizer/EditEvent";
import EventBookings from "./pages/organizer/EventBookings";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageEventsBookings from "./pages/admin/ManageEventsBookings";

function App() {
  return (
    <Routes>
      {/* Authentication */}
      <Route
        path="/login"
        element={
          <>
            <Navbar />
            <Login />
          </>
        }
      />

      <Route
        path="/register"
        element={
          <>
            <Navbar />
            <Register />
          </>
        }
      />

      {/* Main pages */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Home />
          </>
        }
      />

      <Route
        path="/events/:eventId"
        element={
          <>
            <Navbar />
            <EventDetails />
          </>
        }
      />

      <Route
        path="/booking-confirmation/:bookingId"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <BookingConfirmation />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/verify-ticket"
        element={
          <>
            <Navbar />
            <VerifyTicket />
          </>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <Notifications />
            </>
          </ProtectedRoute>
        }
      />

      {/* User pages */}
      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={["USER"]}>
            <>
              <Navbar />
              <BookingHistory />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets"
        element={
          <ProtectedRoute allowedRoles={["USER"]}>
            <>
              <Navbar />
              <Tickets />
            </>
          </ProtectedRoute>
        }
      />

      {/* Organizer pages */}
      <Route
        path="/organizer"
        element={
          <ProtectedRoute allowedRoles={["ORGANIZER"]}>
            <>
              <Navbar />
              <OrganizerDashboard />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizer/events"
        element={
          <ProtectedRoute allowedRoles={["ORGANIZER"]}>
            <>
              <Navbar />
              <ManageEvents />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizer/events/create"
        element={
          <ProtectedRoute allowedRoles={["ORGANIZER"]}>
            <>
              <Navbar />
              <CreateEvent />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizer/events/:eventId/edit"
        element={
          <ProtectedRoute allowedRoles={["ORGANIZER"]}>
            <>
              <Navbar />
              <EditEvent />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizer/events/:eventId/bookings"
        element={
          <ProtectedRoute allowedRoles={["ORGANIZER"]}>
            <>
              <Navbar />
              <EventBookings />
            </>
          </ProtectedRoute>
        }
      />

      {/* Admin pages */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <>
              <Navbar />
              <AdminDashboard />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <>
              <Navbar />
              <AdminAnalytics />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <>
              <Navbar />
              <ManageUsers />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/management"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <>
              <Navbar />
              <ManageEventsBookings />
            </>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;