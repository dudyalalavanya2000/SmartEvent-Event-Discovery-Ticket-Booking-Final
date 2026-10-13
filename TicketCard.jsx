
import { useState } from "react"

function TicketCard({ ticket }) {
  const [downloading, setDownloading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0)

  const formatDate = (value) => {
    if (!value) return "Date unavailable"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return "Date unavailable"

    return date.toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getQrUrl = () => {
    if (!ticket.qr_code_url) return null

    const value = String(ticket.qr_code_url).trim()

    // Preserve absolute URLs if the API already provides one.
    if (/^https?:\/\//i.test(value)) {
      return value
    }

    // Support both Windows and Unix-style file paths.
    const fileName = value.split(/[\\/]/).pop()

    if (!fileName) return null

    return `http://127.0.0.1:8000/qr-codes/${encodeURIComponent(fileName)}`
  }

  const qrUrl = getQrUrl()

  // Escape ticket data before placing it inside downloadable HTML.
  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")

  const handleDownload = async () => {
    if (downloading) return

    if (!qrUrl) {
      window.alert("QR code is not available for this ticket.")
      return
    }

    setDownloading(true)

    try {
      const response = await fetch(qrUrl)

      if (!response.ok) {
        throw new Error("Unable to retrieve the ticket QR code.")
      }

      const qrBlob = await response.blob()

      const qrDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error("Unable to read QR code."))

        reader.readAsDataURL(qrBlob)
      })

      const eventTitle = escapeHtml(ticket.event_title || "Event")
      const category = escapeHtml(ticket.event_category || "N/A")
      const eventDate = escapeHtml(formatDate(ticket.event_date))
      const location = escapeHtml(ticket.event_location || "N/A")
      const ticketCode = escapeHtml(ticket.ticket_code || "N/A")
      const bookingId = escapeHtml(ticket.booking_id ?? "N/A")
      const ticketId = escapeHtml(ticket.id ?? "N/A")
      const ticketQuantity = Number(ticket.ticket_quantity) || 0
      const ticketPrice = money(ticket.ticket_price)
      const totalPrice = money(ticket.total_price)
      const createdDate = escapeHtml(formatDate(ticket.created_at))
      const qrImage = escapeHtml(qrDataUrl)

      const ticketHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SmartEvent Ticket - ${ticketCode}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 16px;
      background: #f1f5f9;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    .ticket {
      max-width: 760px;
      margin: 0 auto;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      background: #fff;
      box-shadow: 0 12px 36px rgba(15, 23, 42, .10);
    }
    .header {
      padding: 28px;
      color: white;
      background: linear-gradient(120deg, #4338ca, #7c3aed, #2563eb);
    }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 8px 0 0; color: #e0e7ff; }
    .content { padding: 28px; }
    .event-title { margin-bottom: 24px; font-size: 26px; font-weight: 800; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .detail { padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; overflow-wrap: anywhere; }
    .label { margin-bottom: 7px; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
    .value { font-size: 15px; font-weight: 600; line-height: 1.5; }
    .total {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 24px;
      padding: 18px;
      border-radius: 14px;
      background: #eef2ff;
    }
    .total strong { color: #4338ca; font-size: 22px; }
    .qr-section {
      margin-top: 28px;
      padding-top: 28px;
      border-top: 2px dashed #cbd5e1;
      text-align: center;
    }
    .qr-section img {
      display: block;
      width: 230px;
      height: 230px;
      margin: 18px auto;
      padding: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      object-fit: contain;
    }
    .ticket-code { margin-top: 12px; font-size: 17px; font-weight: 800; overflow-wrap: anywhere; }
    .footer { padding: 18px 24px; background: #f8fafc; color: #64748b; font-size: 12px; text-align: center; }
    @media (max-width: 540px) {
      .details { grid-template-columns: 1fr; }
      .content, .header { padding: 22px; }
      .event-title { font-size: 22px; }
      .total strong { font-size: 18px; }
    }
    @media print {
      body { padding: 0; background: white; }
      .ticket { max-width: 100%; box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="ticket">
    <header class="header">
      <h1>🎟️ SmartEvent</h1>
      <p>Your event ticket</p>
    </header>
    <section class="content">
      <div class="event-title">${eventTitle}</div>
      <div class="details">
        <div class="detail"><div class="label">Category</div><div class="value">${category}</div></div>
        <div class="detail"><div class="label">Event date & time</div><div class="value">${eventDate}</div></div>
        <div class="detail"><div class="label">Location</div><div class="value">${location}</div></div>
        <div class="detail"><div class="label">Price per ticket</div><div class="value">${ticketPrice}</div></div>
        <div class="detail"><div class="label">Ticket quantity</div><div class="value">${ticketQuantity}</div></div>
        <div class="detail"><div class="label">Booking ID</div><div class="value">#${bookingId}</div></div>
        <div class="detail"><div class="label">Ticket ID</div><div class="value">#${ticketId}</div></div>
      </div>
      <div class="total"><span>Total amount</span><strong>${totalPrice}</strong></div>
      <div class="qr-section">
        <h3>Scan your QR code</h3>
        <img src="${qrImage}" alt="SmartEvent ticket QR code" />
        <div class="ticket-code">${ticketCode}</div>
        <p>Present this QR code at the event entrance.</p>
      </div>
    </section>
    <footer class="footer">
      SmartEvent — Event Discovery & Ticket Booking System<br />
      Ticket viewed on ${createdDate}
    </footer>
  </main>
</body>
</html>`

      const blob = new Blob([ticketHtml], {
        type: "text/html;charset=utf-8",
      })

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = downloadUrl
      link.download = `SmartEvent-Ticket-${String(
        ticket.ticket_code || ticket.id || "ticket"
      ).replace(/[^a-zA-Z0-9_-]/g, "_")}.html`

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000)
    } catch (error) {
      console.error("Ticket download failed:", error)
      toastDownloadError()
    } finally {
      setDownloading(false)
    }
  }

  const toastDownloadError = () => {
    window.alert("Unable to download the complete ticket. Please check that the QR code is available and try again.")
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">
      {/* Ticket header */}
      <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-blue-600 px-5 py-5 text-white sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-100">
              SmartEvent · Your ticket
            </p>
            <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
              {ticket.event_title || "Event Ticket"}
            </h2>
            <p className="mt-2 text-sm text-indigo-100">
              Ticket #{ticket.id}
            </p>
          </div>
          <span className="text-4xl" aria-hidden="true">🎟️</span>
        </div>
      </div>

      <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_280px]">
        {/* Ticket details */}
        <div>
          <div className="mb-6">
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
              {ticket.event_category || "Event"}
            </span>
          </div>

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Date & time
              </p>
              <p className="mt-2 font-semibold leading-6 text-slate-800">
                {formatDate(ticket.event_date)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Location
              </p>
              <p className="mt-2 font-semibold leading-6 text-slate-800">
                📍 {ticket.event_location || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Price per ticket
              </p>
              <p className="mt-2 font-semibold text-slate-800">
                {money(ticket.ticket_price)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ticket quantity
              </p>
              <p className="mt-2 font-semibold text-slate-800">
                {Number(ticket.ticket_quantity) || 0}{" "}
                {(Number(ticket.ticket_quantity) || 0) === 1 ? "ticket" : "tickets"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total amount
              </p>
              <p className="mt-2 text-xl font-extrabold text-indigo-700">
                {money(ticket.total_price)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Booking ID
              </p>
              <p className="mt-2 font-semibold text-slate-800">
                #{ticket.booking_id ?? "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ticket code
            </p>
            <p className="mt-2 break-all font-mono text-sm font-bold text-slate-900">
              {ticket.ticket_code || "Not available"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || !qrUrl}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {downloading ? "Preparing ticket..." : "↓ Download Complete Ticket"}
          </button>

          {!qrUrl && (
            <p className="mt-2 text-sm text-amber-700">
              A QR code URL is not available for this ticket.
            </p>
          )}
        </div>

        {/* QR code panel */}
        <aside className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-bold text-slate-900">
            Your ticket QR code
          </h3>
          <p className="mt-1 text-center text-sm leading-6 text-slate-500">
            Keep this code ready for ticket verification.
          </p>

          {qrUrl && !imageError ? (
            <img
              src={qrUrl}
              alt={`QR code for ticket ${ticket.ticket_code || ticket.id}`}
              onError={() => setImageError(true)}
              className="mt-5 h-52 w-52 rounded-xl border border-slate-200 bg-white p-3 object-contain shadow-sm"
            />
          ) : (
            <div className="mt-5 flex h-52 w-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 text-center">
              <span className="text-4xl" aria-hidden="true">▦</span>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                QR code unavailable
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Please check the ticket QR code URL.
              </p>
            </div>
          )}

          <p className="mt-4 break-all text-center font-mono text-xs text-slate-500">
            {ticket.ticket_code || ""}
          </p>
        </aside>
      </div>
    </article>
  )
}

export default TicketCard
