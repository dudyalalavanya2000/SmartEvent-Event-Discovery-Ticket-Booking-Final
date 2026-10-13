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

const primaryButton = {
  background: "#4f46e5",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "11px 17px",
  fontWeight: 650,
  cursor: "pointer",
};

function AnalyticsTable({ columns, rows, getKey, emptyTitle, emptyText }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: "38px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "34px", marginBottom: "10px" }}>▤</div>
        <h3 style={{ fontSize: "16px", margin: "0 0 6px" }}>
          {emptyTitle}
        </h3>
        <p style={mutedText}>{emptyText}</p>
      </div>
    );
  }

  return (
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
            {columns.map((column) => (
              <th
                key={column.key}
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
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getKey(row, index)}
              style={{
                background:
                  index % 2 === 0
                    ? "var(--card-bg, #ffffff)"
                    : "var(--table-stripe-bg, #fafbff)",
              }}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    ...tableCellStyle,
                    ...(column.cellStyle ? column.cellStyle(row) : {}),
                  }}
                >
                  {column.render
                    ? column.render(row, index)
                    : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard");
      setAnalytics(response.data);
    } catch (err) {
      console.error("Failed to load admin analytics:", err);

      const message =
        err.response?.data?.detail || "Failed to load analytics.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !analytics) {
    return (
      <main className="page-container">
        <section
          style={{ ...cardStyle, padding: "48px 24px", textAlign: "center" }}
        >
          <div
            role="status"
            aria-label="Loading analytics"
            style={{
              width: "38px",
              height: "38px",
              border: "4px solid #e0e7ff",
              borderTopColor: "#4f46e5",
              borderRadius: "50%",
              margin: "0 auto 18px",
              animation: "analytics-spin 0.8s linear infinite",
            }}
          />
          <h1 style={{ fontSize: "24px", margin: "0 0 8px" }}>
            Preparing your analytics
          </h1>
          <p style={mutedText}>
            Loading booking trends and event revenue...
          </p>
          <style>{`
            @keyframes analytics-spin {
              to { transform: rotate(360deg); }
            }
            @media (prefers-reduced-motion: reduce) {
              [aria-label="Loading analytics"] {
                animation: none !important;
              }
            }
          `}</style>
        </section>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="page-container">
        <section
          style={{ ...cardStyle, padding: "44px 24px", textAlign: "center" }}
        >
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>⚠️</div>
          <h1 style={{ fontSize: "24px", margin: "0 0 8px" }}>
            Unable to load analytics
          </h1>
          <p role="alert" style={mutedText}>
            {error || "Analytics data is currently unavailable."}
          </p>
          <button
            type="button"
            style={{ ...primaryButton, marginTop: "20px" }}
            onClick={fetchAnalytics}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  const monthlyTrends = Array.isArray(analytics.monthly_booking_trends)
    ? analytics.monthly_booking_trends
    : [];

  const topRevenueEvents = Array.isArray(analytics.top_revenue_events)
    ? analytics.top_revenue_events
    : [];

  const totalMonthlyBookings = monthlyTrends.reduce(
    (total, item) => total + Number(item.bookings || 0),
    0
  );

  const totalMonthlyTickets = monthlyTrends.reduce(
    (total, item) => total + Number(item.tickets_sold || 0),
    0
  );

  const totalMonthlyRevenue = monthlyTrends.reduce(
    (total, item) => total + Number(item.revenue || 0),
    0
  );

  const monthlyColumns = [
    {
      key: "month",
      label: "Month",
      cellStyle: () => ({ fontWeight: 700 }),
    },
    {
      key: "bookings",
      label: "Bookings",
      render: (item) => formatNumber(item.bookings),
    },
    {
      key: "tickets_sold",
      label: "Tickets Sold",
      render: (item) => (
        <span style={{ color: "#047857", fontWeight: 700 }}>
          {formatNumber(item.tickets_sold)}
        </span>
      ),
    },
    {
      key: "revenue",
      label: "Revenue",
      render: (item) => (
        <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
          {formatCurrency(item.revenue)}
        </span>
      ),
    },
  ];

  const revenueColumns = [
    {
      key: "event_title",
      label: "Event",
      render: (event, index) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
          <span style={{ fontWeight: 700, whiteSpace: "normal" }}>
            {event.event_title || "Untitled event"}
          </span>
        </div>
      ),
    },
    {
      key: "tickets_sold",
      label: "Tickets Sold",
      render: (event) => formatNumber(event.tickets_sold),
    },
    {
      key: "bookings",
      label: "Bookings",
      render: (event) => formatNumber(event.bookings),
    },
    {
      key: "revenue",
      label: "Revenue",
      render: (event) => (
        <span style={{ color: "#047857", fontWeight: 750 }}>
          {formatCurrency(event.revenue)}
        </span>
      ),
    },
  ];

  return (
    <main className="page-container" style={{ paddingBottom: "48px" }}>
      {/* Page header */}
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
            ADMIN INSIGHTS
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
            Analytics & performance.
          </h1>

          <p style={{ ...mutedText, color: "#475569", marginTop: "10px" }}>
            Understand booking activity, ticket sales, and your
            highest-revenue events.
          </p>
        </div>

        <button
          type="button"
          style={primaryButton}
          onClick={fetchAnalytics}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh Analytics"}
        </button>
      </header>

      {/* Monthly summary */}
      <section
        aria-label="Monthly booking overview"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {[
          {
            label: "Reported Months",
            value: formatNumber(monthlyTrends.length),
            icon: "▦",
            color: "#4338ca",
            background: "#eef2ff",
          },
          {
            label: "Bookings in Report",
            value: formatNumber(totalMonthlyBookings),
            icon: "▤",
            color: "#7c3aed",
            background: "#ede9fe",
          },
          {
            label: "Tickets in Report",
            value: formatNumber(totalMonthlyTickets),
            icon: "✓",
            color: "#047857",
            background: "#d1fae5",
          },
          {
            label: "Revenue in Report",
            value: formatCurrency(totalMonthlyRevenue),
            icon: "₹",
            color: "#be185d",
            background: "#fce7f3",
          },
        ].map((metric) => (
          <article key={metric.label} style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
                fontSize: "clamp(23px, 3vw, 29px)",
                lineHeight: 1.3,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "var(--text-color, #0f172a)",
                margin: "16px 0 0",
                overflowWrap: "anywhere",
              }}
            >
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      {/* Monthly trends */}
      <section
        style={{
          ...cardStyle,
          padding: 0,
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "22px",
            borderBottom: "1px solid var(--border-color, #e5e7eb)",
          }}
        >
          <h2 style={sectionTitle}>Monthly booking trends</h2>
          <p style={mutedText}>
            Compare booking volume, ticket sales, and revenue across months.
          </p>
        </div>

        <AnalyticsTable
          columns={monthlyColumns}
          rows={monthlyTrends}
          getKey={(item, index) => item.month || index}
          emptyTitle="No monthly data available"
          emptyText="Monthly booking trends will appear here when data is available."
        />
      </section>

      {/* Top revenue events */}
      <section
        style={{
          ...cardStyle,
          padding: 0,
          overflow: "hidden",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            padding: "22px",
            borderBottom: "1px solid var(--border-color, #e5e7eb)",
          }}
        >
          <h2 style={sectionTitle}>Top revenue-generating events</h2>
          <p style={mutedText}>
            Review the event revenue and sales figures returned by the API.
          </p>
        </div>

        <AnalyticsTable
          columns={revenueColumns}
          rows={topRevenueEvents}
          getKey={(event, index) =>
            event.event_id ?? `${event.event_title}-${index}`
          }
          emptyTitle="No revenue data available"
          emptyText="Revenue-generating events will appear here when available."
        />
      </section>

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
        SmartEvent Analytics · Summary values are calculated from the monthly
        data returned by the API.
      </p>
    </main>
  );
}

export default AdminAnalytics;
