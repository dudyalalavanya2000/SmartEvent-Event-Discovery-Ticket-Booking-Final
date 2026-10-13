import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

import api from "../../services/api"


function CreateEvent() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Music",
    location: "",
    event_date: "",
    ticket_price: "",
    banner_image: "",
    total_tickets: "",
  })

  const [loading, setLoading] = useState(false)


  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }


  const handleSubmit = async (event) => {
    event.preventDefault()

    if (
      !formData.title ||
      !formData.description ||
      !formData.location ||
      !formData.event_date ||
      !formData.ticket_price ||
      !formData.total_tickets
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    const ticketPrice = Number(formData.ticket_price)
    const totalTickets = Number(formData.total_tickets)

    if (ticketPrice < 0) {
      toast.error("Ticket price cannot be negative")
      return
    }

    if (totalTickets <= 0) {
      toast.error("Total tickets must be greater than 0")
      return
    }

    setLoading(true)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        event_date: new Date(formData.event_date).toISOString(),
        ticket_price: ticketPrice,
        banner_image: formData.banner_image.trim() || null,
        total_tickets: totalTickets,
      }

      await api.post("/events/", payload)

      toast.success("Event created successfully!")

      navigate("/organizer/events")
    } catch (error) {
      console.error("Failed to create event:", error)

      toast.error(
        error.response?.data?.detail ||
          "Failed to create event"
      )
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-8">

        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/organizer")}
            className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Organizer Dashboard
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            Create Event
          </h1>

          <p className="mt-2 text-slate-500">
            Create a new event and start selling tickets.
          </p>
        </div>


        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8"
        >

          <div className="grid gap-6 md:grid-cols-2">

            {/* Event Title */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Event Title *
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>


            {/* Description */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description *
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event"
                rows="5"
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>


            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Category *
              </label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Music">Music</option>
                <option value="Tech">Tech</option>
                <option value="Sports">Sports</option>
                <option value="Business">Business</option>
              </select>
            </div>


            {/* Location */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Location *
              </label>

              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Event location"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>


            {/* Event Date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Event Date & Time *
              </label>

              <input
                type="datetime-local"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>


            {/* Ticket Price */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ticket Price (₹) *
              </label>

              <input
                type="number"
                name="ticket_price"
                value={formData.ticket_price}
                onChange={handleChange}
                placeholder="499"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>


            {/* Total Tickets */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Total Tickets *
              </label>

              <input
                type="number"
                name="total_tickets"
                value={formData.total_tickets}
                onChange={handleChange}
                placeholder="100"
                min="1"
                step="1"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>


            {/* Banner Image */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Banner Image URL
              </label>

              <input
                type="url"
                name="banner_image"
                value={formData.banner_image}
                onChange={handleChange}
                placeholder="https://example.com/event-banner.jpg"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Optional. Provide a public image URL for the event banner.
              </p>
            </div>

          </div>


          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() => navigate("/organizer/events")}
              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Event..." : "Create Event"}
            </button>

          </div>

        </form>

      </main>
    </div>
  )
}


export default CreateEvent
