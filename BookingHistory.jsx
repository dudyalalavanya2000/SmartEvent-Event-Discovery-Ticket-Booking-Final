
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"

import api from "../services/api"

function BookingHistory() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get("/bookings/my-bookings")
        setBookings(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error("Failed to load booking history:", error)
        toast.error(
          error.response?.data?.detail || "Failed to load booking history"
        )
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0)

  const formatDate = (dateValue) => {
    if (!dateValue) return "Not available"

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) return "Not available"

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getStatusStyles = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "CONFIRMED":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200"
      case "CANCELLED":
        return "bg-red-50 text-red-700 ring-red-200"
      case "PENDING":
        return "bg-amber-50 text-amber-700 ring-amber-200"
      default:
        return "bg-slate-100 text-slate-700 ring-slate-200"
    }
  }

  const confirmedCount = bookings.filter(
    (booking) =>
      String(booking.booking_status || "").toUpperCase() === "CONFIRMED"
  ).length

  const cancelledCount = bookings.filter(
    (booking) =>
      String(booking.booking_status || "").toUpperCase() === "CANCELLED"
  ).length

  const confirmedTotal = bookings.reduce((total, booking) => {
    if (
      String(booking.booking_status || "").toUpperCase() !== "CONFIRMED"
    ) {
      return total
    }

    return total + (Number(booking.total_price) || 0)
  }, 0)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-700 to-blue-600 px-6 py-9 text-white shadow-lg sm:px-9 sm:py-11">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-100">
            Your SmartEvent account
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            My Bookings
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
            Keep track of your event reservations, booking statuses, and ticket
            details — all in one place.
          </p>
        </section>

        {loading ? (
          <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="mt-4 font-medium text-slate-600">
              Loading your bookings...
            </p>
          </div>
        ) : (
          <>
            {/* Booking summary */}
            <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    Total bookings
                  </p>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl"
                    aria-hidden="true"
                  >
                    📋
                  </span>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  {bookings.length}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  All your reservations
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    Confirmed bookings
                  </p>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-emerald-700">
                  {confirmedCount}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Successfully confirmed
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    Confirmed booking value
                  </p>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl"
                    aria-hidden="true"
                  >
                    ₹
                  </span>
                </div>
                <p className="mt-3 break-words text-2xl font-extrabold text-indigo-700">
                  {money(confirmedTotal)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Excludes cancelled and pending bookings
                </p>
              </div>
            </section>

            {/* Booking list heading */}
            <section className="mt-10">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                    Reservation history
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                    Your bookings
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Review each booking and access your tickets.
                  </p>
                </div>

                {bookings.length > 0 && (
                  <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                    {bookings.length}{" "}
                    {bookings.length === 1 ? "booking" : "bookings"}
                  </span>
                )}
              </div>

              {bookings.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:py-16">
                  <div
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-4xl"
                    aria-hidden="true"
                  >
                    🎟️
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    No bookings yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Your next great experience is waiting. Browse upcoming
                    events and book your first ticket!
                  </p>

                  <Link
                    to="/"
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Explore Events →
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {bookings.map((booking) => {
                    const status = String(
                      booking.booking_status || "UNKNOWN"
                    ).toUpperCase()

                    return (
                      <article
                        key={booking.id}
                        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md"
                      >
                        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span
                                className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xl"
                                aria-hidden="true"
                              >
                                🎟️
                              </span>

                              <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                  Booking reference
                                </p>
                                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                                  Booking #{booking.id}
                                </h3>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${getStatusStyles(status)}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  status === "CONFIRMED"
                                    ? "bg-emerald-500"
                                    : status === "CANCELLED"
                                      ? "bg-red-500"
                                      : status === "PENDING"
                                        ? "bg-amber-500"
                                        : "bg-slate-400"
                                }`}
                              />
                              {status}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 sm:p-6">
                          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Event ID
                              </p>
                              <p className="mt-2 font-bold text-slate-800">
                                #{booking.event_id ?? "N/A"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Tickets booked
                              </p>
                              <p className="mt-2 font-bold text-slate-800">
                                {Number(booking.ticket_quantity) || 0}{" "}
                                {(Number(booking.ticket_quantity) || 0) === 1
                                  ? "ticket"
                                  : "tickets"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Total amount
                              </p>
                              <p className="mt-2 text-lg font-extrabold text-indigo-700">
                                {money(booking.total_price)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Booked on
                              </p>
                              <p className="mt-2 font-semibold leading-6 text-slate-800">
                                {formatDate(booking.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm leading-6 text-slate-500">
                              {status === "CONFIRMED"
                                ? "Your booking is confirmed. Check your tickets before the event."
                                : status === "CANCELLED"
                                  ? "This booking has been cancelled."
                                  : status === "PENDING"
                                    ? "Your booking is awaiting confirmation."
                                    : "Check the booking status for the latest information."}
                            </p>

                            {status === "CONFIRMED" && (
                              <Link
                                to="/tickets"
                                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                              >
                                View My Tickets →
                              </Link>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            {cancelledCount > 0 && (
              <p className="mt-5 text-sm text-slate-500">
                You have {cancelledCount} cancelled{" "}
                {cancelledCount === 1 ? "booking" : "bookings"} in your history.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default BookingHistory
