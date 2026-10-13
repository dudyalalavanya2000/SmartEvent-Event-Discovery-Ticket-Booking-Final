import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"

import api from "../../services/api"


function EditEvent() {
  const { eventId } = useParams()
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

  const [eventStatus, setEventStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)


  useEffect(() => {
    fetchEvent()
  }, [eventId])


  const fetchEvent = async () => {
    try {
      const response = await api.get(
        `/events/${eventId}`
      )

      const event = response.data

      setEventStatus(event.event_status)

      setFormData({
        title: event.title || "",
        description: event.description || "",
        category: event.category || "Music",
        location: event.location || "",
        event_date: event.event_date
          ? new Date(event.event_date)
              .toISOString()
              .slice(0, 16)
          : "",
        ticket_price:
          event.ticket_price ?? "",
        banner_image:
          event.banner_image || "",
        total_tickets:
          event.total_tickets ?? "",
      })
    } catch (error) {
      console.error("Failed to load event:", error)

      toast.error(
        error.response?.data?.detail ||
          "Failed to load event"
      )

      navigate("/organizer/events")
    } finally {
      setLoading(false)
    }
  }


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

    setSaving(true)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        event_date: new Date(
          formData.event_date
        ).toISOString(),
        ticket_price: ticketPrice,
        banner_image:
          formData.banner_image.trim() || null,
        total_tickets: totalTickets,
      }

      await api.put(
        `/events/${eventId}`,
        payload
      )

      toast.success("Event updated successfully!")

      navigate("/organizer/events")
    } catch (error) {
      console.error("Failed to update event:", error)

      toast.error(
        error.response?.data?.detail ||
          "Failed to update event"
      )
    } finally {
      setSaving(false)
    }
  }


  const isEditable =
    eventStatus !== "CANCELLED" &&
    eventStatus !== "ONGOING" &&
    eventStatus !== "COMPLETED"


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">
              Loading event...
            </p>
          </div>
        </main>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-8">

        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              navigate("/organizer/events")
            }
            className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Manage Events
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Edit Event
              </h1>

              <p className="mt-2 text-slate-500">
                Update your event information.
              </p>
            </div>

            {eventStatus && (
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                  eventStatus === "UPCOMING"
                    ? "bg-blue-100 text-blue-700"
                    : eventStatus === "ONGOING"
                      ? "bg-green-100 text-green-700"
                      : eventStatus === "COMPLETED"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-red-100 text-red-700"
                }`}
              >
                {eventStatus}
              </span>
            )}

          </div>
        </div>


        {!isEditable ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">

            <div className="text-5xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Event cannot be edited
            </h2>

            <p className="mt-2 text-slate-500">
              Events that are cancelled, ongoing, or completed
              cannot be modified.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/organizer/events")
              }
              className="mt-6 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Back to Manage Events
            </button>

          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8"
          >

            <div className="grid gap-6 md:grid-cols-2">

              {/* Title */}
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
                  rows="5"
                  placeholder="Describe your event"
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
                  <option value="Music">
                    Music
                  </option>

                  <option value="Tech">
                    Tech
                  </option>

                  <option value="Sports">
                    Sports
                  </option>

                  <option value="Business">
                    Business
                  </option>
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


              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Event Date & Time *
                </label>

                <input
                  type="datetime-local"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>


              {/* Price */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ticket Price (₹) *
                </label>

                <input
                  type="number"
                  name="ticket_price"
                  value={formData.ticket_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="499"
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
                  min="1"
                  step="1"
                  placeholder="100"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>


              {/* Banner */}
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
              </div>

            </div>


            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  navigate("/organizer/events")
                }
                className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>

            </div>

          </form>
        )}

      </main>
    </div>
  )
}


export default EditEvent