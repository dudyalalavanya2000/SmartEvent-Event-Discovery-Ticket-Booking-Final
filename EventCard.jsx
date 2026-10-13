
import { useState } from "react"
import { Link } from "react-router-dom"

function EventCard({ event }) {
  const [imageError, setImageError] = useState(false)

  const status = String(event.event_status || "").toUpperCase()

  const statusStyles = {
    UPCOMING: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ONGOING: "bg-amber-50 text-amber-700 ring-amber-200",
    COMPLETED: "bg-slate-100 text-slate-600 ring-slate-200",
    CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  }

  const statusMessages = {
    UPCOMING: "Booking available",
    ONGOING: "Currently ongoing",
    COMPLETED: "Event completed",
    CANCELLED: "Event cancelled",
  }

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(event.ticket_price) || 0)

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Date to be announced"

  const category = event.category
    ? event.category.charAt(0) +
      event.category.slice(1).toLowerCase()
    : "Event"

  const canBook =
    status === "UPCOMING" &&
    Number(event.available_tickets) > 0

  const showImage = event.banner_image && !imageError

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Event banner */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-500">
        {showImage ? (
          <img
            src={event.banner_image}
            alt={event.title || "Event banner"}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white">
            <span className="text-5xl" aria-hidden="true">
              🎟️
            </span>
            <span className="mt-2 text-sm font-medium text-white/90">
              Discover something exciting
            </span>
          </div>
        )}

        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
            {category}
          </span>
        </div>

        <div className="absolute bottom-4 right-4 rounded-xl bg-white px-3 py-2 shadow-md">
          <span className="text-base font-extrabold text-slate-900">
            {formattedPrice}
          </span>
          <span className="ml-1 text-xs text-slate-500">
            / ticket
          </span>
        </div>
      </div>

      {/* Event information */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
              statusStyles[status] ||
              "bg-slate-100 text-slate-600 ring-slate-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === "UPCOMING"
                  ? "bg-emerald-500"
                  : status === "ONGOING"
                    ? "bg-amber-500"
                    : status === "CANCELLED"
                      ? "bg-red-500"
                      : "bg-slate-400"
              }`}
            />
            {status || "UNKNOWN"}
          </span>

          <span className="text-xs font-medium text-slate-500">
            {statusMessages[status] || "Status unavailable"}
          </span>
        </div>

        <h2 className="text-xl font-bold leading-snug tracking-tight text-slate-900 transition group-hover:text-indigo-700">
          {event.title || "Untitled event"}
        </h2>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-slate-600">
          {event.description || "Discover more details about this event."}
        </p>

        {/* Date and location */}
        <div className="mt-5 space-y-3">
          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-lg"
              aria-hidden="true"
            >
              📅
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Date & time
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                {formattedDate}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-lg"
              aria-hidden="true"
            >
              📍
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Location
              </p>
              <p className="mt-0.5 break-words text-sm font-semibold text-slate-700">
                {event.location || "Location to be announced"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-lg"
              aria-hidden="true"
            >
              🎟️
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Availability
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                {Number(event.available_tickets) || 0} tickets left
              </p>
            </div>
          </div>
        </div>

        {/* Status notices */}
        {status === "CANCELLED" && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            This event has been cancelled.
          </div>
        )}

        {status === "ONGOING" && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            This event is in progress. Booking is closed.
          </div>
        )}

        {status === "COMPLETED" && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            This event has already ended.
          </div>
        )}

        {status === "UPCOMING" &&
          Number(event.available_tickets) <= 0 && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              Tickets are currently sold out.
            </div>
          )}

        {/* Action */}
        <div className="mt-auto pt-6">
          <Link
            to={`/events/${event.id}`}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              canBook
                ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                : "border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            {canBook ? "Explore Event" : "View Event Details"}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}

export default EventCard
