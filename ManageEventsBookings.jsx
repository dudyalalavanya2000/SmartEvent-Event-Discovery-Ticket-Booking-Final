
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const cardStyle = {
  padding: "20px",
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: "16px",
  background: "var(--surface, #ffffff)",
  minWidth: 0,
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  padding: "11px 13px",
  border: "1px solid var(--border, #d1d5db)",
  borderRadius: "10px",
  background: "var(--surface, #ffffff)",
  color: "var(--text, #111827)",
  fontSize: "14px",
};

const buttonStyle = {
  padding: "9px 13px",
  border: "1px solid var(--border, #d1d5db)",
  borderRadius: "9px",
  background: "var(--surface, #ffffff)",
  color: "var(--text, #111827)",
  fontSize: "13px",
  fontWeight: 650,
  cursor: "pointer",
};

const tableCellStyle = {
  padding: "14px 16px",
  textAlign: "left",
  borderBottom: "1px solid var(--border, #e5e7eb)",
  fontSize: "13px",
  verticalAlign: "middle",
};

const tableHeaderStyle = {
  ...tableCellStyle,
  background: "var(--table-header, #f9fafb)",
  color: "var(--muted, #6b7280)",
  fontSize: "11px",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
};

function getEventId(event) {
  return event.event_id ?? event.id;
}

function getBookingId(booking) {
  return booking.booking_id ?? booking.id;
}

function getEventStatus(event) {
  return String(
    event.status ?? event.event_status ?? ""
  ).toUpperCase();
}

function getBookingStatus(booking) {
  return String(
    booking.status ?? booking.booking_status ?? ""
  ).toUpperCase();
}

function getEventTitle(event) {
  return event.title ?? event.event_title ?? event.name ?? "Untitled event";
}

function getBookingEvent(booking) {
  return (
    booking.event_title ??
    booking.event?.title ??
    booking.event_id ??
    "—"
  );
}

function isEventCancelled(status) {
  return status.includes("CANCEL") || status === "INACTIVE";
}

function isBookingCancelled(status) {
  return status.includes("CANCEL");
}

function StatusBadge({ status }) {
  const normalized = String(status || "UNKNOWN").toUpperCase();

  let colors = {
    background: "#f3f4f6",
    color: "#4b5563",
  };

  if (
    normalized.includes("CANCEL") ||
    normalized === "INACTIVE" ||
    normalized === "FAILED"
  ) {
    colors = { background: "#fee2e2", color: "#b91c1c" };
  } else if (
    normalized.includes("CONFIRM") ||
    normalized === "ACTIVE" ||
    normalized === "COMPLETED"
  ) {
    colors = { background: "#dcfce7", color: "#15803d" };
  } else if (
    normalized.includes("PENDING") ||
    normalized.includes("UPCOMING")
  ) {
    colors = { background: "#fef3c7", color: "#92400e" };
  }

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "5px 9px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 750,
        whiteSpace: "nowrap",
        background: colors.background,
        color: colors.color,
      }}
    >
      {normalized.replaceAll("_", " ") || "UNKNOWN"}
    </span>
  );
}

function SummaryCard({ label, value, icon, accent }) {
  return (
    <article style={cardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        <span
          style={{
            color: "var(--muted, #6b7280)",
            fontSize: "13px",
          }}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          style={{
            display: "grid",
            placeItems: "center",
            width: "36px",
            height: "36px",
            borderRadius: "11px",
            background: accent,
            fontSize: "18px",
          }}
        >
          {icon}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          color: "var(--text, #111827)",
          fontSize: "29px",
          fontWeight: 800,
        }}
      >
        {value.toLocaleString("en-IN")}
      </p>
    </article>
  );
}

function RecordTable({
  type,
  records,
  processing,
  onCancel,
}) {
  const isEvents = type === "events";
  const columns = isEvents
    ? ["Event ID", "Event", "Status", "Action"]
    : ["Booking ID", "Event", "Status", "Action"];

  if (records.length === 0) {
    return (
      <div
        style={{
          padding: "38px 16px",
          textAlign: "center",
          border: "1px dashed var(--border, #d1d5db)",
          borderRadius: "12px",
        }}
      >
        <p style={{ margin: "0 0 8px", fontSize: "25px" }} aria-hidden="true">
          {isEvents ? "🎟️" : "📋"}
        </p>
        <p style={{ margin: 0, fontWeight: 700 }}>
          No {isEvents ? "events" : "bookings"} found
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "13px",
            color: "var(--muted, #6b7280)",
          }}
        >
          Try adjusting your search or status filter.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: "12px",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: "640px",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={tableHeaderStyle}>
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {records.map((record) => {
            const id = isEvents
              ? getEventId(record)
              : getBookingId(record);

            const status = isEvents
              ? getEventStatus(record)
              : getBookingStatus(record);

            const cancelled = isEvents
              ? isEventCancelled(status)
              : isBookingCancelled(status);

            const key = `${isEvents ? "event" : "booking"}-${id}`;
            const busy = processing === key;

            return (
              <tr key={id}>
                <td style={tableCellStyle}>{id ?? "—"}</td>

                <td style={tableCellStyle}>
                  <div
                    style={{
                      fontWeight: 650,
                      color: "var(--text, #111827)",
                    }}
                  >
                    {isEvents ? getEventTitle(record) : getBookingEvent(record)}
                  </div>
                  {isEvents && record.location && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "var(--muted, #6b7280)",
                      }}
                    >
                      📍 {record.location}
                    </div>
                  )}
                </td>

                <td style={tableCellStyle}>
                  <StatusBadge status={status} />
                </td>

                <td style={tableCellStyle}>
                  <button
                    type="button"
                    disabled={cancelled || busy || id == null}
                    onClick={() => onCancel(type, id)}
                    style={{
                      ...buttonStyle,
                      color: cancelled ? "#6b7280" : "#b91c1c",
                      background: cancelled ? "#f9fafb" : "#fff7f7",
                      borderColor: cancelled ? "#e5e7eb" : "#fecaca",
                      opacity: busy ? 0.65 : 1,
                      cursor: cancelled || busy ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {busy
                      ? "Cancelling..."
                      : cancelled
                        ? "Cancelled"
                        : `Cancel ${isEvents ? "Event" : "Booking"}`}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ManageEventsBookings() {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState("");
  const [search, setSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("ALL");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");

  const fetchData = useCallback(async (showToast = false) => {
    setRefreshing(true);
    setError("");

    try {
      const [eventsResponse, bookingsResponse] = await Promise.all([
        api.get("/admin/events"),
        api.get("/admin/bookings"),
      ]);

      const eventData = eventsResponse.data;
      const bookingData = bookingsResponse.data;

      setEvents(
        Array.isArray(eventData)
          ? eventData
          : Array.isArray(eventData?.items)
            ? eventData.items
            : Array.isArray(eventData?.events)
              ? eventData.events
              : []
      );

      setBookings(
        Array.isArray(bookingData)
          ? bookingData
          : Array.isArray(bookingData?.items)
            ? bookingData.items
            : Array.isArray(bookingData?.bookings)
              ? bookingData.bookings
              : []
      );

      if (showToast) {
        toast.success("Admin records refreshed.");
      }
    } catch (err) {
      console.error("Failed to load admin records:", err);

      const message =
        err.response?.data?.detail ||
        "Failed to load events and bookings.";

      setError(message);

      if (showToast) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const eventSummary = useMemo(() => {
    return {
      total: events.length,
      active: events.filter(
        (event) => !isEventCancelled(getEventStatus(event))
      ).length,
      cancelled: events.filter(
        (event) => isEventCancelled(getEventStatus(event))
      ).length,
    };
  }, [events]);

  const bookingSummary = useMemo(() => {
    return {
      total: bookings.length,
      active: bookings.filter(
        (booking) => !isBookingCancelled(getBookingStatus(booking))
      ).length,
      cancelled: bookings.filter(
        (booking) => isBookingCancelled(getBookingStatus(booking))
      ).length,
    };
  }, [bookings]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const id = String(getEventId(event) ?? "");
      const title = getEventTitle(event).toLowerCase();
      const status = getEventStatus(event);
      const location = String(event.location || "").toLowerCase();

      const matchesSearch =
        !query ||
        id.toLowerCase().includes(query) ||
        title.includes(query) ||
        location.includes(query);

      const matchesStatus =
        eventStatusFilter === "ALL" ||
        (eventStatusFilter === "CANCELLED" &&
          isEventCancelled(status)) ||
        (eventStatusFilter === "ACTIVE" &&
          !isEventCancelled(status));

      return matchesSearch && matchesStatus;
    });
  }, [events, search, eventStatusFilter]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const id = String(getBookingId(booking) ?? "");
      const eventName = String(getBookingEvent(booking)).toLowerCase();
      const status = getBookingStatus(booking);

      const matchesSearch =
        !query ||
        id.toLowerCase().includes(query) ||
        eventName.includes(query);

      const matchesStatus =
        bookingStatusFilter === "ALL" ||
        (bookingStatusFilter === "CANCELLED" &&
          isBookingCancelled(status)) ||
        (bookingStatusFilter === "ACTIVE" &&
          !isBookingCancelled(status));

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, bookingStatusFilter]);

  const cancelRecord = async (type, id) => {
    const isEvents = type === "events";
    const key = `${isEvents ? "event" : "booking"}-${id}`;

    if (processing) return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel this ${isEvents ? "event" : "booking"}?`
    );

    if (!confirmed) return;

    setProcessing(key);

    try {
      if (isEvents) {
        await api.patch(`/admin/events/${id}/cancel`);
      } else {
        await api.patch(`/admin/bookings/${id}/cancel`);
      }

      toast.success(
        `${isEvents ? "Event" : "Booking"} cancelled successfully.`
      );

      await fetchData();
    } catch (err) {
      console.error(`Failed to cancel ${type}:`, err);

      toast.error(
        err.response?.data?.detail ||
          `Failed to cancel ${isEvents ? "event" : "booking"}.`
      );
    } finally {
      setProcessing("");
    }
  };

  return (
    <div
      className="page-container"
      style={{
        display: "grid",
        gap: "24px",
        paddingBottom: "40px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p
            style={{
              color: "#6366f1",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.1em",
              marginBottom: "8px",
            }}
          >
            ADMINISTRATION
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(26px, 4vw, 34px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            Events & Bookings
          </h1>

          <p
            style={{
              marginTop: "8px",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "var(--muted, #6b7280)",
            }}
          >
            Review platform records and manage event or booking cancellations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          style={{
            ...buttonStyle,
            opacity: refreshing ? 0.65 : 1,
          }}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh records"}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            ...cardStyle,
            background: "#fef2f2",
            borderColor: "#fecaca",
            color: "#991b1b",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 750 }}>
            Unable to load admin records
          </p>
          <p style={{ margin: "0 0 12px", fontSize: "13px" }}>{error}</p>
          <button
            type="button"
            onClick={() => fetchData(true)}
            style={buttonStyle}
          >
            Try again
          </button>
        </div>
      )}

      <section
        aria-label="Platform record summary"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "14px",
        }}
      >
        <SummaryCard
          label="Total events"
          value={eventSummary.total}
          icon="🎟️"
          accent="#eef2ff"
        />
        <SummaryCard
          label="Active events"
          value={eventSummary.active}
          icon="📅"
          accent="#dcfce7"
        />
        <SummaryCard
          label="Cancelled events"
          value={eventSummary.cancelled}
          icon="⊘"
          accent="#fee2e2"
        />
        <SummaryCard
          label="Total bookings"
          value={bookingSummary.total}
          icon="📋"
          accent="#f3e8ff"
        />
        <SummaryCard
          label="Non-cancelled bookings"
          value={bookingSummary.active}
          icon="✓"
          accent="#dbeafe"
        />
        <SummaryCard
          label="Cancelled bookings"
          value={bookingSummary.cancelled}
          icon="↩"
          accent="#ffedd5"
        />
      </section>

      <section style={{ ...cardStyle, display: "grid", gap: "18px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 800 }}>
            Find records
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px",
              color: "var(--muted, #6b7280)",
            }}
          >
            Search by event name, location, event ID, booking ID, or event title.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "12px",
          }}
        >
          <input
            type="search"
            aria-label="Search events and bookings"
            placeholder="Search records..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={inputStyle}
          />

          <select
            aria-label="Filter events by status"
            value={eventStatusFilter}
            onChange={(event) => setEventStatusFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="ALL">All event statuses</option>
            <option value="ACTIVE">Non-cancelled events</option>
            <option value="CANCELLED">Cancelled events</option>
          </select>

          <select
            aria-label="Filter bookings by status"
            value={bookingStatusFilter}
            onChange={(event) => setBookingStatusFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="ALL">All booking statuses</option>
            <option value="ACTIVE">Non-cancelled bookings</option>
            <option value="CANCELLED">Cancelled bookings</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setEventStatusFilter("ALL");
              setBookingStatusFilter("ALL");
            }}
            style={buttonStyle}
          >
            Reset filters
          </button>
        </div>
      </section>

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            ...cardStyle,
            padding: "45px 20px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: "25px" }}>◌</p>
          <p style={{ margin: 0, fontWeight: 650 }}>
            Loading events and bookings...
          </p>
        </div>
      ) : (
        <>
          <section style={{ ...cardStyle, display: "grid", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 800 }}>
                  Events
                </h2>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "13px",
                    color: "var(--muted, #6b7280)",
                  }}
                >
                  {filteredEvents.length} of {events.length} events
                </p>
              </div>
              <span aria-hidden="true" style={{ fontSize: "25px" }}>
                🎟️
              </span>
            </div>

            <RecordTable
              type="events"
              records={filteredEvents}
              processing={processing}
              onCancel={cancelRecord}
            />
          </section>

          <section style={{ ...cardStyle, display: "grid", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 800 }}>
                  Bookings
                </h2>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "13px",
                    color: "var(--muted, #6b7280)",
                  }}
                >
                  {filteredBookings.length} of {bookings.length} bookings
                </p>
              </div>
              <span aria-hidden="true" style={{ fontSize: "25px" }}>
                📋
              </span>
            </div>

            <RecordTable
              type="bookings"
              records={filteredBookings}
              processing={processing}
              onCancel={cancelRecord}
            />
          </section>
        </>
      )}
    </div>
  );
}
