import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const cardStyle = {
  background: "var(--card-bg, #ffffff)",
  border: "1px solid var(--border-color, #e5e7eb)",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 4px 18px rgba(15, 23, 42, 0.045)",
  minWidth: 0,
};

const mutedText = {
  color: "var(--muted-text, #64748b)",
  fontSize: "14px",
  lineHeight: 1.6,
  marginTop: "6px",
};

const primaryButton = {
  background: "#4f46e5",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "11px 17px",
  fontWeight: 650,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

const secondaryButton = {
  background: "var(--card-bg, #ffffff)",
  color: "var(--text-color, #334155)",
  border: "1px solid var(--border-color, #e2e8f0)",
  borderRadius: "10px",
  padding: "10px 15px",
  fontWeight: 600,
  cursor: "pointer",
};

const metricDefinitions = [
  {
    key: "total_users",
    label: "Total Users",
    icon: "♙",
    color: "#4338ca",
    background: "#eef2ff",
    description: "Registered platform users",
  },
  {
    key: "total_events",
    label: "Total Events",
    icon: "▦",
    color: "#0369a1",
    background: "#e0f2fe",
    description: "Events across the platform",
  },
  {
    key: "total_tickets_sold",
    label: "Tickets Sold",
    icon: "✓",
    color: "#047857",
    background: "#d1fae5",
    description: "Tickets sold across events",
  },
  {
    key: "total_bookings",
    label: "Total Bookings",
    icon: "▤",
    color: "#7c3aed",
    background: "#ede9fe",
    description: "Bookings across the platform",
  },
  {
    key: "total_revenue",
    label: "Total Revenue",
    icon: "₹",
    color: "#be185d",
    background: "#fce7f3",
    description: "Revenue reported by the API",
    currency: true,
  },
];

const sectionTitle = {
  fontSize: "19px",
  fontWeight: 750,
  color: "var(--text-color, #0f172a)",
  margin: 0,
};

const tableCellStyle = {
  padding: "15px 16px",
  textAlign: "left",
  borderBottom: "1px solid var(--border-color, #f1f5f9)",
  color: "var(--text-color, #334155)",
  whiteSpace: "nowrap",
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard");
      setStats(response.data);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);

      const message =
        err.response?.data?.detail ||
        "Failed to load admin dashboard. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const metrics = stats
    ? metricDefinitions.map((metric) => ({
        ...metric,
        value: metric.currency
          ? formatCurrency(stats[metric.key])
          : formatNumber(stats[metric.key]),
      }))
    : [];

  if (loading && !stats) {
    return (
      <main className="page-container">
        <section
          style={{
            ...cardStyle,
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div
            role="status"
            aria-label="Loading admin dashboard"
            style={{
              width: "38px",
              height: "38px",
              border: "4px solid #e0e7ff",
              borderTopColor: "#4f46e5",
              borderRadius: "50%",
              margin: "0 auto 18px",
              animation: "admin-spin 0.8s linear infinite",
            }}
          />
          <h1 style={{ fontSize: "24px", margin: "0 0 8px" }}>
            Preparing your dashboard
          </h1>
          <p style={mutedText}>
            Loading platform statistics and sales information...
          </p>
          <style>{`
            @keyframes admin-spin {
              to { transform: rotate(360deg); }
            }
            @media (prefers-reduced-motion: reduce) {
              [aria-label="Loading admin dashboard"] {
                animation: none !important;
              }
            }
          `}</style>
        </section>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="page-container">
        <section
          style={{
            ...cardStyle,
            padding: "44px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>
            ⚠️
          </div>
          <h1 style={{ fontSize: "24px", margin: "0 0 8px" }}>
            Unable to load admin dashboard
          </h1>
          <p role="alert" style={mutedText}>
            {error || "Dashboard data is currently unavailable."}
          </p>
          <button
            type="button"
            style={{ ...primaryButton, marginTop: "20px" }}
            onClick={fetchDashboard}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  const dailySales = Array.isArray(stats.daily_sales)
    ? stats.daily_sales
    : [];

  const popularEvents = Array.isArray(stats.popular_events)
    ? stats.popular_events
    : [];

  return (
    <main className="page-container" style={{ paddingBottom: "48px" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
          padding: "28px",
          borderRadius: "20px",
          background:
            "linear-gradient(125deg, #eef2ff 0%, #f5f3ff 52%, #ffffff 100%)",
          border: "1px solid #e0e7ff",
        }}
      >
        <div style={{ flex: "1 1 280px" }}>
          <span
            style={{
              display: "inline-block",
              color: "#4338ca",
              background: "#e0e7ff",
              borderRadius: "999px",
              padding: "5px 11px",
              fontSize: "12px",
              fontWeight: 750,
              letterSpacing: "0.05em",
              marginBottom: "12px",
            }}
          >
            ADMIN WORKSPACE
          </span>

          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 34px)",
              lineHeight: 1.2,
              letterSpacing: "-0.04em",
              fontWeight: 800,
              margin: 0,
              color: "#172554",
            }}
          >
            Platform overview.
          </h1>

          <p style={{ ...mutedText, color: "#475569", marginTop: "10px" }}>
            Monitor SmartEvent users, events, bookings, and revenue from one
            place.
          </p>
        </div>

        <button
          type="button"
          style={secondaryButton}
          onClick={fetchDashboard}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh Dashboard"}
        </button>
      </header>

      {/* Metric cards */}
      <section aria-label="Platform metrics" style={{ marginBottom: "32px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={sectionTitle}>Platform statistics</h2>
          <p style={mutedText}>
            An overview of your platform's current activity.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
            gap: "16px",
          }}
        >
          {metrics.map((metric) => (
            <article key={metric.key} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 650,
                    color: "var(--muted-text, #64748b)",
                  }}
                >
                  {metric.label}
                </span>

                <span
                  aria-hidden="true"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    color: metric.color,
                    background: metric.background,
                    fontSize: "21px",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {metric.icon}
                </span>
              </div>

              <p
                style={{
                  fontSize: "clamp(23px, 3vw, 30px)",
                  lineHeight: 1.3,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--text-color, #0f172a)",
                  margin: "16px 0 5px",
                  overflowWrap: "anywhere",
                }}
              >
                {metric.value}
              </p>

              <p style={{ ...mutedText, fontSize: "12px", margin: 0 }}>
                {metric.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Daily sales */}
      <section style={{ ...cardStyle, padding: "0", overflow: "hidden", marginBottom: "24px" }}>
        <div
          style={{
            padding: "22px",
            borderBottom: "1px solid var(--border-color, #e5e7eb)",
          }}
        >
          <h2 style={sectionTitle}>Daily sales</h2>
          <p style={mutedText}>
            Review ticket sales, bookings, and revenue by date.
          </p>
        </div>

        {dailySales.length > 0 ? (
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              style={{
                width: "100%",
                minWidth: "580px",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ background: "var(--table-header-bg, #f8fafc)" }}>
                  {["Date", "Tickets Sold", "Bookings", "Revenue"].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        style={{
                          ...tableCellStyle,
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 750,
                          color: "var(--muted-text, #64748b)",
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {dailySales.map((item, index) => (
                  <tr
                    key={`${item.date}-${index}`}
                    style={{
                      background:
                        index % 2 === 0
                          ? "var(--card-bg, #ffffff)"
                          : "var(--table-stripe-bg, #fafbff)",
                    }}
                  >
                    <td style={tableCellStyle}>{item.date || "—"}</td>
                    <td style={tableCellStyle}>
                      {formatNumber(item.tickets_sold)}
                    </td>
                    <td style={tableCellStyle}>
                      {formatNumber(item.bookings)}
                    </td>
                    <td
                      style={{
                        ...tableCellStyle,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "38px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "34px", marginBottom: "10px" }}>
              ▤
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: "16px" }}>
              No daily sales yet
            </h3>
            <p style={mutedText}>
              Daily sales information will appear here when available.
            </p>
          </div>
        )}
      </section>

      {/* Popular events */}
      <section style={{ ...cardStyle, padding: "0", overflow: "hidden", marginBottom: "32px" }}>
        <div
          style={{
            padding: "22px",
            borderBottom: "1px solid var(--border-color, #e5e7eb)",
          }}
        >
          <h2 style={sectionTitle}>Popular events</h2>
          <p style={mutedText}>
            See which events have the most ticket sales and bookings.
          </p>
        </div>

        {popularEvents.length > 0 ? (
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              style={{
                width: "100%",
                minWidth: "520px",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ background: "var(--table-header-bg, #f8fafc)" }}>
                  {["Event", "Tickets Sold", "Bookings"].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      style={{
                        ...tableCellStyle,
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 750,
                        color: "var(--muted-text, #64748b)",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {popularEvents.map((event, index) => (
                  <tr
                    key={event.event_id ?? `${event.event_title}-${index}`}
                    style={{
                      background:
                        index % 2 === 0
                          ? "var(--card-bg, #ffffff)"
                          : "var(--table-stripe-bg, #fafbff)",
                    }}
                  >
                    <td
                      style={{
                        ...tableCellStyle,
                        fontWeight: 700,
                        maxWidth: "360px",
                        whiteSpace: "normal",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            display: "grid",
                            placeItems: "center",
                            width: "34px",
                            height: "34px",
                            borderRadius: "10px",
                            background: "#eef2ff",
                            color: "#4338ca",
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </span>
                        {event.event_title || "Untitled event"}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{ color: "#047857", fontWeight: 750 }}>
                        {formatNumber(event.tickets_sold)}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {formatNumber(event.bookings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "38px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "34px", marginBottom: "10px" }}>
              🎟️
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: "16px" }}>
              No popular events to display
            </h3>
            <p style={mutedText}>
              Event popularity statistics will appear here when available.
            </p>
          </div>
        )}
      </section>

      {/* Footer information */}
      {error && (
        <p role="alert" style={{ ...mutedText, color: "#b91c1c" }}>
          The latest refresh failed: {error}
        </p>
      )}

      <p
        style={{
          ...mutedText,
          textAlign: "center",
          fontSize: "12px",
        }}
      >
        SmartEvent Admin Workspace · Platform statistics are provided by the
        dashboard API.
      </p>
    </main>
  );
}

export default AdminDashboard;
