
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";

function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("access_token");
  const userData = localStorage.getItem("user");

  let user = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Failed to parse user data:", error);
  }

  const userRole = String(user?.role || "").toUpperCase();
  const isLoggedIn = Boolean(token);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    closeMobileMenu();
    navigate("/login", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <nav
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex shrink-0 items-center gap-2.5"
          aria-label="SmartEvent home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-sm">
            🎟️
          </span>

          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Smart<span className="text-indigo-600">Event</span>
          </span>
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <div
          className={`${
            mobileMenuOpen ? "flex" : "hidden"
          } w-full flex-col gap-2 border-t border-slate-100 pt-3 md:flex md:w-auto md:flex-row md:items-center md:gap-1 md:border-0 md:pt-0`}
        >
          <NavLink
            to="/"
            end
            onClick={closeMobileMenu}
            className={navLinkClass}
          >
            Events
          </NavLink>

          {isLoggedIn && userRole === "USER" && (
            <>
              <NavLink
                to="/bookings"
                onClick={closeMobileMenu}
                className={navLinkClass}
              >
                My Bookings
              </NavLink>

              <NavLink
                to="/tickets"
                onClick={closeMobileMenu}
                className={navLinkClass}
              >
                My Tickets
              </NavLink>
            </>
          )}

          <NavLink
            to="/verify-ticket"
            onClick={closeMobileMenu}
            className={navLinkClass}
          >
            Verify Ticket
          </NavLink>

          {isLoggedIn && (
            <div className="px-1 py-1 md:px-0">
              <NotificationDropdown />
            </div>
          )}

          {isLoggedIn && userRole === "ORGANIZER" && (
            <NavLink
              to="/organizer"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-indigo-700 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`
              }
            >
              Organizer Dashboard
            </NavLink>
          )}

          {isLoggedIn && userRole === "ADMIN" && (
            <NavLink
              to="/admin"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-purple-700 text-white"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`
              }
            >
              Admin Dashboard
            </NavLink>
          )}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={closeMobileMenu}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
