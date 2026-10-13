
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"

import api from "../services/api"

function EventDetails() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [imageError, setImageError] = useState(false)

  const fetchEvent = async () => {
    setLoading(true)
    setEvent(null)
    setImageError(false)

    try {
      const response = await api.get(`/events/${eventId}`)
      setEvent(response.data)
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to load event"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const handleBooking = async () => {
    if (!event || booking) return

    const status = String(event.event_status || "").toUpperCase()
    const availableTickets = Number(event.available_tickets) || 0

    if (status !== "UPCOMING") {
      toast.error(
        `Booking is unavailable for ${status.toLowerCase() || "this"} events`
      )
      return
    }

    if (availableTickets <= 0) {
      toast.error("This event is sold out")
      return
    }

    if (quantity < 1 || quantity > availableTickets) {
      toast.error("Please select a valid number of available tickets")
      return
    }

    setBooking(true)

    try {
      const response = await api.post("/bookings/", {
        event_id: event.id,
        ticket_quantity: quantity,
      })

      toast.success("Booking confirmed successfully!")
      navigate(`/booking-confirmation/${response.data.id}`)
    } catch (error) {
      toast.error(error.response?.data?.detail || "Booking failed")
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-4 font-medium text-slate-600">
            Loading event details...
          </p>
        </div>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-5xl" aria-hidden="true">🎟️</div>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Event not found
          </h1>
          <p className="mt-2 text-slate-500">
            This event may no longer be available. Return to the events page to
            explore other experiences.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Browse Events
          </button>
        </div>
      </main>
    )
  }

  const status = String(event.event_status || "").toUpperCase()
  const availableTickets = Math.max(0, Number(event.available_tickets) || 0)
  const ticketPrice = Math.max(0, Number(event.ticket_price) || 0)
  const totalPrice = ticketPrice * quantity

  const isUpcoming = status === "UPCOMING"
  const isOngoing = status === "ONGOING"
  const isCompleted = status === "COMPLETED"
  const isCancelled = status === "CANCELLED"
  const canBook = isUpcoming && availableTickets > 0

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Date to be announced"

  const category = event.category
    ? String(event.category).charAt(0) +
      String(event.category).slice(1).toLowerCase()
    : "Event"

  const statusStyles = {
    UPCOMING: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ONGOING: "bg-amber-50 text-amber-700 ring-amber-200",
    COMPLETED: "bg-slate-100 text-slate-600 ring-slate-200",
    CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  }

  const bannerImage = event.banner_image && !imageError

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          <span aria-hidden="true">←</span> Back to Events
        </button>

        <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          {/* Event banner */}
          <div className="relative h-64 overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-600 to-blue-500 sm:h-80 lg:h-[26rem]">
            {bannerImage ? (
              <img
                src={event.banner_image}
                alt={event.title || "Event banner"}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white">
                <span className="text-7xl" aria-hidden="true">🎟️</span>
                <p className="mt-4 text-sm font-medium text-white/90">
                  Discover something exciting
                </p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/10" />

            <div className="absolute left-5 top-5 sm:left-8 sm:top-8">
              <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm">
                {category}
              </span>
            </div>

            <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8">
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                  statusStyles[status] ||
                  "bg-slate-100 text-slate-700 ring-slate-200"
                }`}
              >
                {status || "STATUS UNAVAILABLE"}
              </span>
              <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
                {event.title || "Untitled event"}
              </h1>
            </div>
          </div>

          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_340px] lg:gap-10 lg:p-10">
            {/* Main event information */}
            <section>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                  About this event
                </p>
                <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-600">
                  {event.description || "More information about this event will be available soon."}
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xl" aria-hidden="true">
                      📍
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-500">Location</p>
                      <p className="mt-1 break-words font-bold text-slate-800">
                        {event.location || "Location to be announced"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-xl" aria-hidden="true">
                      📅
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-500">Event date</p>
                      <p className="mt-1 font-bold leading-6 text-slate-800">
                        {formattedDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl" aria-hidden="true">
                      🎟️
                    </span>
                    <div>
                      <p className="text-sm text-slate-500">Tickets available</p>
                      <p className="mt-1 font-bold text-slate-800">
                        {availableTickets.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl" aria-hidden="true">
                      💳
                    </span>
                    <div>
                      <p className="text-sm text-slate-500">Price per ticket</p>
                      <p className="mt-1 font-bold text-slate-800">
                        {money(ticketPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {isCancelled && (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <h2 className="font-bold text-red-800">⚠️ Event Cancelled</h2>
                  <p className="mt-2 text-sm leading-6 text-red-700">
                    This event has been cancelled. Booking is no longer available.
                  </p>
                </div>
              )}

              {isOngoing && (
                <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h2 className="font-bold text-amber-800">🔴 Event in Progress</h2>
                  <p className="mt-2 text-sm leading-6 text-amber-700">
                    This event is currently in progress. Booking is closed.
                  </p>
                </div>
              )}

              {isCompleted && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="font-bold text-slate-800">✓ Event Completed</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This event has already been completed. Explore other upcoming events.
                  </p>
                </div>
              )}

              {isUpcoming && availableTickets === 0 && (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <h2 className="font-bold text-red-800">Tickets Sold Out</h2>
                  <p className="mt-2 text-sm leading-6 text-red-700">
                    Unfortunately, there are no tickets currently available for this event.
                  </p>
                </div>
              )}
            </section>

            {/* Booking panel */}
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Ticket booking
              </p>

              <p className="mt-3 text-sm text-slate-500">Price per ticket</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {money(ticketPrice)}
              </p>

              <div className="my-5 border-t border-slate-200" />

              {canBook ? (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Book your tickets
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Choose how many tickets you need for this event.
                  </p>

                  <label
                    htmlFor="ticket-quantity"
                    className="mt-5 block text-sm font-semibold text-slate-700"
                  >
                    Number of tickets
                  </label>

                  <select
                    id="ticket-quantity"
                    name="ticket_quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={booking}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                  >
                    {Array.from(
                      { length: Math.min(availableTickets, 10) },
                      (_, index) => index + 1
                    ).map((number) => (
                      <option key={number} value={number}>
                        {number} {number === 1 ? "ticket" : "tickets"}
                      </option>
                    ))}
                  </select>

                  <div className="mt-6 rounded-xl bg-indigo-50 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                      <span>
                        {quantity} × {money(ticketPrice)}
                      </span>
                      <span>{money(totalPrice)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-indigo-100 pt-3">
                      <span className="font-semibold text-slate-800">
                        Total price
                      </span>
                      <span className="text-xl font-extrabold text-indigo-700">
                        {money(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBooking}
                    disabled={booking}
                    className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {booking ? "Confirming booking..." : "Book Tickets →"}
                  </button>

                  <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                    Your booking will be processed securely through SmartEvent.
                  </p>
                </>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-center">
                  <span className="text-3xl" aria-hidden="true">
                    {isCancelled ? "⚠️" : isCompleted ? "✓" : isOngoing ? "🔴" : "🎟️"}
                  </span>
                  <h2 className="mt-3 font-bold text-slate-800">
                    {isCancelled
                      ? "Booking unavailable"
                      : isCompleted
                        ? "Event completed"
                        : isOngoing
                          ? "Event in progress"
                          : "Tickets unavailable"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {isUpcoming && availableTickets === 0
                      ? "This event is sold out."
                      : "You cannot book tickets for this event right now."}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                  >
                    Explore Other Events
                  </button>
                </div>
              )}
            </aside>
          </div>
        </article>

        <p className="mt-6 text-center text-sm text-slate-500">
          Have a great experience with SmartEvent 🎉
        </p>
      </div>
    </main>
  )
}

export default EventDetails
