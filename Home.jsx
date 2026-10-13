import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"

import api from "../services/api"
import EventCard from "../components/EventCard"

function formatPrice(price) {
  const amount = Number(price)

  if (!Number.isFinite(amount)) {
    return "Price unavailable"
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatEventDate(value) {
  if (!value) return "Date to be announced"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Date to be announced"
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function getEventTitle(event) {
  return (
    event.title ||
    event.event_name ||
    event.name ||
    "Untitled Event"
  )
}

function EventSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      aria-hidden="true"
    >
      <div className="h-48 animate-pulse bg-slate-200" />

      <div className="space-y-4 p-5">
        <div className="h-4 w-24 animate-pulse rounded-full bg-indigo-100" />
        <div className="h-6 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="h-6 w-20 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-indigo-100" />
        </div>
      </div>
    </div>
  )
}

function Home() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchEvents = async (
    searchTerm = search,
    selectedCategory = category
  ) => {
    setLoading(true)

    try {
      const params = {}

      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      if (selectedCategory) {
        params.category = selectedCategory
      }

      const response = await api.get("/events/", { params })

      const allEvents = Array.isArray(response.data)
        ? response.data
        : []

      const upcomingEvents = allEvents.filter(
        (event) =>
          String(event.event_status || "").toUpperCase() ===
          "UPCOMING"
      )

      setEvents(upcomingEvents)
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to load events"
      )
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [category])

  const handleSearch = (event) => {
    event.preventDefault()
    fetchEvents(search, category)
  }

  const clearFilters = () => {
    setSearch("")
    setCategory("")
    fetchEvents("", "")
  }

  const featuredEvent = events.length > 0 ? events[0] : null

  // Prefer events with a real popularity/booking metric when available.
  // If the API does not provide one, retain the API's event order.
  const trendingEvents = [...events]
    .filter((event) => event.id !== featuredEvent?.id)
    .sort((a, b) => {
      const getPopularity = (event) =>
        Number(
          event.popularity ??
            event.booking_count ??
            event.bookings_count ??
            0
        )

      return getPopularity(b) - getPopularity(a)
    })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        {/* Hero section */}
        <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 px-6 py-12 shadow-xl sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100 backdrop-blur sm:text-sm">
              <span aria-hidden="true">✦</span>
              Discover · Experience · Celebrate
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Make every moment
              <span className="block text-indigo-200">
                an experience.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">
              Discover concerts, technology summits, sports, and
              unforgettable experiences. Find your next event with
              SmartEvent.
            </p>

            <a
              href="#discover-events"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-indigo-800 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Explore Events
              <span aria-hidden="true">→</span>
            </a>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-indigo-100">
              <span>🎟️ Easy ticket booking</span>
              <span>🔒 Secure booking flow</span>
              <span>📱 Digital tickets</span>
            </div>
          </div>
        </section>

        {/* Search and filters */}
        <section
          id="discover-events"
          className="relative z-10 mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-md sm:p-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Find your next event
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by event name or choose a category.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"
          >
            <div className="relative">
              <span
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400"
                aria-hidden="true"
              >
                ⌕
              </span>

              <input
                id="event-search"
                name="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events by title..."
                aria-label="Search events by title"
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <select
              id="event-category"
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter events by category"
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">All Categories</option>
              <option value="Music">Music</option>
              <option value="Tech">Tech</option>
              <option value="Sports">Sports</option>
              <option value="Business">Business</option>
            </select>

            <button
              type="submit"
              className="min-h-12 rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Search Events
            </button>
          </form>

          {(search || category) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Filters applied
                {category ? ` · ${category}` : ""}
                {search.trim() ? ` · "${search.trim()}"` : ""}
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-indigo-700 underline-offset-4 transition hover:text-indigo-900 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Event count and loading state */}
        <section className="mt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-600">
                Curated for your next outing
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {search || category
                  ? "Search Results"
                  : "Upcoming Events"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Discover something exciting and reserve your spot.
              </p>
            </div>

            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
              {loading
                ? "Loading..."
                : `${events.length} ${
                    events.length === 1 ? "event" : "events"
                  }`}
            </span>
          </div>

          {loading ? (
            <div
              className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Loading events"
              aria-busy="true"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <EventSkeleton key={index} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl"
                aria-hidden="true"
              >
                🎟️
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                No upcoming events found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                We couldn't find events matching your current filters.
                Try a different search or explore all categories.
              </p>

              {(search || category) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
                >
                  Show All Events
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured event */}
              {featuredEvent && !search.trim() && !category && (
                <section aria-labelledby="featured-heading">
                  <div className="mb-5 flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl"
                      aria-hidden="true"
                    >
                      ✨
                    </span>

                    <div>
                      <h3
                        id="featured-heading"
                        className="text-xl font-extrabold text-slate-900"
                      >
                        Featured Event
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        A spotlight on an upcoming experience.
                      </p>
                    </div>
                  </div>

                  <article className="group overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="grid md:grid-cols-[1.1fr_1fr]">
                      <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-800 to-blue-700 p-8 text-white sm:min-h-72 sm:p-10">
                        <div
                          className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-[28px] border-white/10 transition duration-500 group-hover:scale-110"
                          aria-hidden="true"
                        />

                        <div
                          className="absolute -bottom-14 -left-10 h-48 w-48 rounded-full border-[24px] border-white/10"
                          aria-hidden="true"
                        />

                        <div className="relative text-center">
                          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">
                            SmartEvent Spotlight
                          </span>

                          <div className="mt-5 text-6xl" aria-hidden="true">
                            🎫
                          </div>

                          <p className="mt-4 text-sm font-medium text-indigo-100">
                            Your next great experience starts here
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center p-6 sm:p-9">
                        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
                          {featuredEvent.category || "Upcoming Event"}
                        </span>

                        <h4 className="mt-4 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                          {getEventTitle(featuredEvent)}
                        </h4>

                        <div className="mt-5 space-y-3 text-sm text-slate-600">
                          <p className="flex items-start gap-3">
                            <span aria-hidden="true">📅</span>
                            <span>
                              {formatEventDate(
                                featuredEvent.event_date ||
                                  featuredEvent.date ||
                                  featuredEvent.start_date
                              )}
                            </span>
                          </p>

                          <p className="flex items-start gap-3">
                            <span aria-hidden="true">📍</span>
                            <span>
                              {featuredEvent.location ||
                                "Location to be announced"}
                            </span>
                          </p>
                        </div>

                        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Ticket price
                            </p>
                            <p className="mt-1 text-2xl font-extrabold text-indigo-700">
                              {formatPrice(
                                featuredEvent.price ??
                                  featuredEvent.ticket_price
                              )}
                            </p>
                          </div>

                          <Link
                            to={`/events/${featuredEvent.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          >
                            View Event
                            <span aria-hidden="true">→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                </section>
              )}

              {/* Remaining events */}
              <section aria-labelledby="trending-heading">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">
                        🔥
                      </span>
                      <h3
                        id="trending-heading"
                        className="text-xl font-extrabold text-slate-900 sm:text-2xl"
                      >
                        {search || category
                          ? "Matching Events"
                          : "Explore More Events"}
                      </h3>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Find more events that match your interests.
                    </p>
                  </div>
                </div>

                {trendingEvents.length > 0 ? (
                  <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {trendingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="min-w-0 transition duration-300 hover:-translate-y-1"
                      >
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>
                ) : featuredEvent && !search.trim() && !category ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                    <p className="font-semibold text-slate-700">
                      You're all caught up!
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Check back later for more upcoming events.
                    </p>
                  </div>
                ) : (
                  <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="min-w-0 transition duration-300 hover:-translate-y-1"
                      >
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </section>

        {/* Closing call to action */}
        {!loading && events.length > 0 && (
          <section className="mt-12 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">
                  Make plans. Make memories.
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Your next experience is waiting.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Find an event, book your tickets, and keep your digital
                  pass ready for entry.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("discover-events")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="shrink-0 rounded-xl border border-indigo-200 bg-white px-5 py-3 font-bold text-indigo-700 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50"
              >
                Explore Events ↑
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Home