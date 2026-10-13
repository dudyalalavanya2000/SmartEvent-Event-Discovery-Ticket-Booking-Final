import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"

import api from "../services/api"
import TicketCard from "../components/TicketCard"

function Tickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await api.get("/tickets/my-tickets")

      setTickets(response.data)
    } catch (error) {
      console.error("Failed to fetch tickets:", error)

      toast.error(
        error.response?.data?.detail ||
          "Failed to load your tickets"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            My Tickets
          </h1>

          <p className="mt-2 text-slate-600">
            View your tickets and QR codes for upcoming events.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">
              Loading your tickets...
            </p>
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🎟️</div>

            <h2 className="mt-4 text-xl font-semibold text-slate-800">
              No tickets found
            </h2>

            <p className="mt-2 text-slate-500">
              Book an event to generate your ticket.
            </p>

            <Link
              to="/"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Browse Events
            </Link>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="space-y-6">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Tickets
