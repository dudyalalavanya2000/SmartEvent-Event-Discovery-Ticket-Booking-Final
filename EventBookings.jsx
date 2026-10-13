import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"

import api from "../../services/api"

function EventBookings() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEventBookings()
  }, [eventId])

  const fetchEventBookings = async () => {
    try {
      setLoading(true)

      const [eventResponse, bookingsResponse] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/bookings`),
      ])

      setEvent(eventResponse.data)
      setBookings(bookingsResponse.data)
    } catch (error) {
      console.error("Failed to fetch event bookings:", error)

      toast.error(
        error.response?.data?.detail ||
          "Failed to load event bookings"
      )
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A"
    }

    return new Date(dateValue).toLocaleString()
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "status-confirmed"

      case "PENDING":
        return "status-pending"

      case "CANCELLED":
        return "status-cancelled"

      default:
        return "status-default"
    }
  }

  const totalTicketsSold = bookings
    .filter((booking) => booking.booking_status !== "CANCELLED")
    .reduce(
      (total, booking) => total + booking.ticket_quantity,
      0
    )

  const totalRevenue = bookings
    .filter((booking) => booking.booking_status !== "CANCELLED")
    .reduce(
      (total, booking) => total + Number(booking.total_price || 0),
      0
    )

  if (loading) {
    return (
      <div className="page-container">
        <h2>Event Bookings</h2>
        <p>Loading bookings...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Event Bookings</h1>

          {event && (
            <p>
              <strong>{event.title}</strong>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate("/organizer/events")}
        >
          ← Back to My Events
        </button>
      </div>

      {event && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <div className="card">
            <h3>Total Bookings</h3>
            <p>{bookings.length}</p>
          </div>

          <div className="card">
            <h3>Tickets Sold</h3>
            <p>{totalTicketsSold}</p>
          </div>

          <div className="card">
            <h3>Remaining Tickets</h3>
            <p>{event.available_tickets}</p>
          </div>

          <div className="card">
            <h3>Total Revenue</h3>
            <p>₹{totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="card">
          <h3>No bookings yet</h3>
          <p>
            No customers have booked tickets for this event yet.
          </p>
        </div>
      ) : (
        <div className="card">
          <h2>Booking Details</h2>

          <div
            style={{
              overflowX: "auto",
              marginTop: "20px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Booking ID</th>
                  <th style={tableHeaderStyle}>User ID</th>
                  <th style={tableHeaderStyle}>Tickets</th>
                  <th style={tableHeaderStyle}>Total Price</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Booked At</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td style={tableCellStyle}>
                      #{booking.id}
                    </td>

                    <td style={tableCellStyle}>
                      {booking.user_id}
                    </td>

                    <td style={tableCellStyle}>
                      {booking.ticket_quantity}
                    </td>

                    <td style={tableCellStyle}>
                      ₹{Number(booking.total_price || 0).toFixed(2)}
                    </td>

                    <td style={tableCellStyle}>
                      <span
                        className={getStatusClass(
                          booking.booking_status
                        )}
                      >
                        {booking.booking_status}
                      </span>
                    </td>

                    <td style={tableCellStyle}>
                      {formatDate(booking.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const tableHeaderStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "2px solid #ddd",
  whiteSpace: "nowrap",
}

const tableCellStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
}

export default EventBookings