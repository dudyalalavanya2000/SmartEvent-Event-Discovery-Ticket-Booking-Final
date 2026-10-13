
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password);

      const response = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const token = response.data.access_token;

      if (!token) {
        throw new Error("The server did not return an access token.");
      }

      // Decode JWT payload for frontend display only.
      // Backend remains responsible for verifying the token and permissions.
      const base64Payload = token
        .split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const paddedPayload = base64Payload.padEnd(
        base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
        "="
      );

      const payload = JSON.parse(atob(paddedPayload));
      const role = String(payload.role || "").toUpperCase();

      if (!["USER", "ORGANIZER", "ADMIN"].includes(role)) {
        throw new Error("Your account role is missing or invalid.");
      }

      // Clear any previous account data when switching accounts.
      localStorage.removeItem("user");
      localStorage.setItem("access_token", token);

      // Store the role so the navbar can render the correct links.
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: payload.sub,
          email: email.trim(),
          role,
        })
      );

      toast.success("Login successful!");

      // Reload the app state at the home route.
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed:", err.response?.data || err);

      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to log in. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
            🎟️
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Login to SmartEvent
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-7 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            Register
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Discover events. Book tickets. Make memories.
        </p>
      </div>
    </div>
  );
}