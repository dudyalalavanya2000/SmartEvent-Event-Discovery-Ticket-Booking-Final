import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

import api from "../../services/api"


function ManageEvents() {
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)


  useEffect(() => {
    fetchEvents()
  }, [])


  const fetchEvents = async () => {
    try {
      const response = await api.get("/events/my-events")

      setEvents(response.data)
    } catch (error) {
      console.error("Failed to fetch organizer events:", error)

      toast.error(
        error.response?.data?.detail ||
          "Failed to load your events"
      )
    } finally {
      setLoading(false)
    }
  }


  const handleCancelEvent = async (eventId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this event?"
    )

    if (!confirmed) {
      return
    }

    setCancellingId(eventId)

    try {
      const response = await api.patch(
        `/events/${eventId}/cancel`
      )

      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === eventId
            ? response.data
            : event
        )
      )

      toast.success("Event cancelled successfully")
    } catch (error) {
      console.error("Failed to cancel event:", error)

      toast.error(
        error.response?.data?.detail ||
          "Failed to cancel event"
      )
    } finally {
      setCancellingId(null)
    }
  }


  const getStatusClasses = (status) => {
    if (status === "UPCOMING") {
      return "bg-blue-100 text-blue-700"
    }

    if (status === "ONGOING") {
      return "bg-green-100 text-green-700"
    }

    if (status === "COMPLETED") {
      return "bg-slate-100 text-slate-700"
    }

    if (status === "CANCELLED") {
      return "bg-red-100 text-red-700"
    }

    return "bg-slate-100 text-slate-700"
  }


  const formatDate = (date) => {
    if (!date) {
      return "N/A"
    }

    return new Date(date).toLocaleString()
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-7xl px-4 py-12">
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">
              Loading your events...
            </p>
          </div>
        </main>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <button
              type="button"
              onClick={() => navigate("/organizer")}
              className="mb-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              ← Organizer Dashboard
            </button>

            <h1 className="text-3xl font-bold text-slate-900">
              Manage Events
            </h1>

            <p className="mt-2 text-slate-500">
              Create, update and manage your events.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/organizer/events/create")
            }
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            + Create Event
          </button>

        </div>


        {/* Empty State */}
        {events.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">

            <div className="text-5xl">
              🎤
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No events yet
            </h2>

            <p className="mt-2 text-slate-500">
              Create your first event to start selling tickets.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/organizer/events/create")
              }
              className="mt-6 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Create Your First Event
            </button>

          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">

            {events.map((event) => (
              <div
                key={event.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
              >

                {/* Banner */}
                {event.banner_image ? (
                  <img
                    src={event.banner_image}
                    alt={event.title}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-indigo-50 text-6xl">
                    🎤
                  </div>
                )}


                <div className="p-6">

                  {/* Title & Status */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {event.title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {event.category}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                        event.event_status
                      )}`}
                    >
                      {event.event_status}
                    </span>

                  </div>


                  {/* Details */}
                  <div className="mt-5 space-y-3 text-sm">

                    <div className="flex items-start gap-3">
                      <span>📍</span>
                      <span className="text-slate-600">
                        {event.location}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <span>📅</span>
                      <span className="text-slate-600">
                        {formatDate(event.event_date)}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <span>🎟️</span>
                      <span className="text-slate-600">
                        ₹{Number(event.ticket_price).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <span>🎫</span>
                      <span className="text-slate-600">
                        {event.available_tickets} /{" "}
                        {event.total_tickets} tickets available
                      </span>
                    </div>

                  </div>


                  {/* Actions */}
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/organizer/events/${event.id}/edit`
                        )
                      }
                      disabled={
                        event.event_status === "CANCELLED" ||
                        event.event_status === "ONGOING" ||
                        event.event_status === "COMPLETED"
                      }
                      className="rounded-lg border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/organizer/events/${event.id}/bookings`
                        )
                      }
                      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Bookings
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCancelEvent(event.id)
                      }
                      disabled={
                        cancellingId === event.id ||
                        event.event_status === "CANCELLED" ||
                        event.event_status === "ONGOING" ||
                        event.event_status === "COMPLETED"
                      }
                      className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {cancellingId === event.id
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </main>
    </div>
  )
}


export default ManageEvents
