import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../../services/api";

const initialInsights = {
  total_events: 0,
  total_tickets: 0,
  tickets_sold: 0,
  remaining_tickets: 0,
  booking_count: 0,
  revenue: 0,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
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
  background: "var(--primary-color, #4f46e5)",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "11px 17px",
  fontWeight: 600,
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

const statCards = [
  {
    key: "total_events",
    label: "Total Events",
    icon: "▦",
    color: "#4f46e5",
    background: "#eef2ff",
    description: "Events you manage",
  },
  {
    key: "total_tickets",
    label: "Total Tickets",
    icon: "▤",
    color: "#0369a1",
    background: "#e0f2fe",
    description: "Available event capacity",
  },
  {
    key: "tickets_sold",
    label: "Tickets Sold",
    icon: "✓",
    color: "#047857",
    background: "#d1fae5",
    description: "Tickets sold across events",
  },
  {
    key: "remaining_tickets",
    label: "Remaining Tickets",
    icon: "◷",
    color: "#b45309",
    background: "#fef3c7",
    description: "Tickets still available",
  },
  {
    key: "booking_count",
    label: "Total Bookings",
    icon: "▧",
    color: "#7c3aed",
    background: "#ede9fe",
    description: "Bookings across your events",
  },
  {
    key: "revenue",
    label: "Total Revenue",
    icon: "₹",
    color: "#be185d",
    background: "#fce7f3",
    description: "Reported booking revenue",
  },
];

function OrganizerDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [insights, setInsights] = useState(initialInsights);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/events/my-events/insights");
      const data = response.data;

      if (!Array.isArray(data)) {
        throw new Error("Unexpected organizer insights response.");
      }

      setEvents(data);

      const totals = data.reduce(
        (result, event) => ({
          total_events: result.total_events + 1,
          total_tickets:
            result.total_tickets + Number(event.total_tickets || 0),
          tickets_sold:
            result.tickets_sold + Number(event.tickets_sold || 0),
          remaining_tickets:
            result.remaining_tickets +
            Number(event.remaining_tickets || 0),
          booking_count:
            result.booking_count + Number(event.booking_count || 0),
          revenue:
            result.revenue +
            Number(event.total_revenue ?? event.revenue ?? 0),
        }),
        { ...initialInsights }
      );

      setInsights(totals);
    } catch (err) {
      console.error("Failed to fetch organizer insights:", err);

      const message =
        err.response?.data?.detail ||
        err.message ||
        "Failed to load organizer dashboard.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const chartData = events.map((event) => ({
    event:
      event.event_title?.length > 22
        ? `${event.event_title.slice(0, 22)}…`
        : event.event_title || `Event ${event.event_id}`,
    ticketsSold: Number(event.tickets_sold || 0),
    remainingTickets: Number(event.remaining_tickets || 0),
    revenue: Number(event.total_revenue ?? event.revenue ?? 0),
  }));

  const sectionTitle = {
    fontSize: "19px",
    fontWeight: 750,
    color: "var(--text-color, #0f172a)",
    margin: 0,
  };

  const chartTooltipStyle = {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)",
  };

  if (loading) {
    return (
      <main className="page-container">
        <div style={{ ...cardStyle, padding: "36px", textAlign: "center" }}>
          <div
            role="status"
            aria-label="Loading dashboard"
            style={{
              width: "38px",
              height: "38px",
              border: "4px solid #e0e7ff",
              borderTopColor: "#4f46e5",
              borderRadius: "50%",
              margin: "0 auto 18px",
              animation: "organizer-spin 0.8s linear infinite",
            }}
          />
          <h1 style={{ fontSize: "24px", margin: "0 0 8px" }}>
            Preparing your dashboard
          </h1>
          <p style={mutedText}>Loading your event insights...</p>
          <style>{`
            @keyframes organizer-spin {
              to { transform: rotate(360deg); }
            }
            @media (prefers-reduced-motion: reduce) {
              [aria-label="Loading dashboard"] {
                animation: none !important;
              }
            }
          `}</style>
        </div>
      </main>
    );
  }

  if (error && events.length === 0) {
    return (
      <main className="page-container">
        <section style={{ ...cardStyle, textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>⚠️</div>
          <h1 style={{ fontSize: "24px", margin: "0 0 8px" }}>
            Unable to load your dashboard
          </h1>
          <p role="alert" style={mutedText}>
            {error}
          </p>
          <button
            type="button"
            style={{ ...primaryButton, marginTop: "20px" }}
            onClick={fetchInsights}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-container" style={{ paddingBottom: "48px" }}>
      {/* Dashboard header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "28px",
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
              letterSpacing: "0.04em",
              marginBottom: "12px",
            }}
          >
            ORGANIZER WORKSPACE
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
            Your events, at a glance.
          </h1>
          <p style={{ ...mutedText, color: "#475569", marginTop: "10px" }}>
            Track ticket sales, monitor revenue, and manage your events in one
            place.
          </p>
        </div>

        <button
          type="button"
          style={primaryButton}
          onClick={() => navigate("/organizer/events/create")}
        >
          <span aria-hidden="true">＋</span>
          Create Event
        </button>
      </header>

      {/* Summary cards */}
      <section aria-label="Organizer summary" style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2 style={sectionTitle}>Performance overview</h2>
            <p style={mutedText}>A summary of your event activity.</p>
          </div>
          <button
            type="button"
            style={secondaryButton}
            onClick={fetchInsights}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
            gap: "16px",
          }}
        >
          {statCards.map((item) => {
            const value =
              item.key === "revenue"
                ? formatCurrency(insights[item.key])
                : formatNumber(insights[item.key]);

            return (
              <article
                key={item.key}
                style={{
                  ...cardStyle,
                  padding: "20px",
                  transition: "transform 160ms ease, box-shadow 160ms ease",
                }}
              >
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
                    {item.label}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      color: item.color,
                      background: item.background,
                      fontSize: "21px",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
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
                  {value}
                </p>
                <p style={{ ...mutedText, fontSize: "12px", margin: 0 }}>
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Charts */}
      <section
        aria-label="Event performance charts"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <article style={cardStyle}>
          <h2 style={sectionTitle}>Ticket sales by event</h2>
          <p style={mutedText}>
            Compare tickets sold with the remaining inventory.
          </p>

          {chartData.length === 0 ? (
            <div style={{ ...mutedText, padding: "64px 10px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>▤</div>
              No event data available yet.
            </div>
          ) : (
            <div
              role="img"
              aria-label="Bar chart comparing tickets sold and remaining tickets for each event"
              style={{ width: "100%", height: "320px", marginTop: "22px" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 8, left: -15, bottom: 55 }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="event"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={78}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar
                    dataKey="ticketsSold"
                    name="Sold"
                    fill="#4f46e5"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar
                    dataKey="remainingTickets"
                    name="Remaining"
                    fill="#34d399"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={38}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitle}>Revenue by event</h2>
          <p style={mutedText}>
            Revenue reported by your event insights API.
          </p>

          {chartData.length === 0 ? (
            <div style={{ ...mutedText, padding: "64px 10px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>₹</div>
              No revenue data available yet.
            </div>
          ) : (
            <div
              role="img"
              aria-label="Bar chart showing revenue for each event"
              style={{ width: "100%", height: "320px", marginTop: "22px" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 10, left: 8, bottom: 55 }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="event"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={78}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `₹${Number(value).toLocaleString("en-IN")}`
                    }
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={65}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#8b5cf6"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={46}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>

      {/* Event statistics table */}
      <section style={{ ...cardStyle, padding: "0", overflow: "hidden", marginBottom: "32px" }}>
        <div
          style={{
            padding: "22px",
            borderBottom: "1px solid var(--border-color, #e5e7eb)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h2 style={sectionTitle}>Event booking statistics</h2>
            <p style={mutedText}>
              Review ticket inventory, bookings, and revenue for each event.
            </p>
          </div>
          <button
            type="button"
            style={secondaryButton}
            onClick={() => navigate("/organizer/events")}
          >
            Manage Events →
          </button>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "42px 20px" }}>
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>🎟️</div>
            <h3 style={{ fontSize: "18px", margin: "0 0 8px" }}>
              Your events will appear here
            </h3>
            <p style={mutedText}>
              Create your first event to start tracking bookings and ticket sales.
            </p>
            <button
              type="button"
              style={{ ...primaryButton, marginTop: "18px" }}
              onClick={() => navigate("/organizer/events/create")}
            >
              ＋ Create Your First Event
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "13px",
                minWidth: "760px",
              }}
            >
              <thead>
                <tr style={{ background: "var(--table-header-bg, #f8fafc)" }}>
                  {[
                    "Event",
                    "Total Tickets",
                    "Sold",
                    "Remaining",
                    "Bookings",
                    "Revenue",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      style={{
                        padding: "15px 16px",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 750,
                        color: "var(--muted-text, #64748b)",
                        borderBottom: "1px solid var(--border-color, #e2e8f0)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {events.map((event, index) => (
                  <tr
                    key={event.event_id}
                    style={{
                      background:
                        index % 2 === 0
                          ? "var(--card-bg, #ffffff)"
                          : "var(--table-stripe-bg, #fafbff)",
                    }}
                  >
                    <td
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid var(--border-color, #f1f5f9)",
                        fontWeight: 700,
                        color: "var(--text-color, #1e293b)",
                        maxWidth: "240px",
                      }}
                    >
                      {event.event_title || `Event ${event.event_id}`}
                    </td>
                    <td style={tableCellStyle}>{formatNumber(event.total_tickets)}</td>
                    <td style={tableCellStyle}>
                      <span style={{ color: "#047857", fontWeight: 700 }}>
                        {formatNumber(event.tickets_sold)}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {formatNumber(event.remaining_tickets)}
                    </td>
                    <td style={tableCellStyle}>
                      {formatNumber(event.booking_count)}
                    </td>
                    <td
                      style={{
                        ...tableCellStyle,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(event.total_revenue ?? event.revenue ?? 0)}
                    </td>
                    <td style={tableCellStyle}>
                      <button
                        type="button"
                        style={{
                          ...secondaryButton,
                          color: "#4338ca",
                          background: "#eef2ff",
                          borderColor: "#e0e7ff",
                          padding: "8px 11px",
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                        onClick={() =>
                          navigate(
                            `/organizer/events/${event.event_id}/bookings`
                          )
                        }
                      >
                        View Bookings →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>Quick actions</h2>
        <p style={mutedText}>
          Jump straight to the tools you use most.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "14px",
            marginTop: "22px",
          }}
        >
          <button
            type="button"
            style={{
              ...secondaryButton,
              justifyContent: "flex-start",
              padding: "17px",
              textAlign: "left",
            }}
            onClick={() => navigate("/organizer/events")}
          >
            <span
              aria-hidden="true"
              style={{
                display: "grid",
                placeItems: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#e0e7ff",
                color: "#4338ca",
                fontSize: "20px",
              }}
            >
              ▦
            </span>
            <span>
              <span style={{ display: "block" }}>Manage Events</span>
              <span style={{ ...mutedText, display: "block", fontSize: "12px", margin: "3px 0 0" }}>
                Edit and review your events
              </span>
            </span>
          </button>

          <button
            type="button"
            style={{
              ...secondaryButton,
              justifyContent: "flex-start",
              padding: "17px",
              textAlign: "left",
            }}
            onClick={() => navigate("/organizer/events/create")}
          >
            <span
              aria-hidden="true"
              style={{
                display: "grid",
                placeItems: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#d1fae5",
                color: "#047857",
                fontSize: "22px",
              }}
            >
              ＋
            </span>
            <span>
              <span style={{ display: "block" }}>Create New Event</span>
              <span style={{ ...mutedText, display: "block", fontSize: "12px", margin: "3px 0 0" }}>
                Publish your next event
              </span>
            </span>
          </button>

          <button
            type="button"
            style={{
              ...secondaryButton,
              justifyContent: "flex-start",
              padding: "17px",
              textAlign: "left",
            }}
            onClick={fetchInsights}
          >
            <span
              aria-hidden="true"
              style={{
                display: "grid",
                placeItems: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#f3e8ff",
                color: "#7e22ce",
                fontSize: "22px",
              }}
            >
              ↻
            </span>
            <span>
              <span style={{ display: "block" }}>Refresh Insights</span>
              <span style={{ ...mutedText, display: "block", fontSize: "12px", margin: "3px 0 0" }}>
                Reload your latest statistics
              </span>
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}

const tableCellStyle = {
  padding: "16px",
  borderBottom: "1px solid var(--border-color, #f1f5f9)",
  color: "var(--text-color, #334155)",
  whiteSpace: "nowrap",
};

export default OrganizerDashboard;
