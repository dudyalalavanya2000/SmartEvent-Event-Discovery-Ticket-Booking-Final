
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

function VerifyTicket() {
  const [ticketCode, setTicketCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    const code = ticketCode.trim();

    if (!code) {
      toast.error("Please enter a ticket code.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.get(
        `/tickets/verify/${encodeURIComponent(code)}`
      );

      setResult(response.data);

      if (response.data.valid) {
        toast.success("Ticket verified successfully!");
      } else {
        toast.error("Invalid ticket.");
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setResult({
          valid: false,
          message: "Ticket not found.",
          ticket_code: code,
        });
        toast.error("Ticket not found.");
      } else {
        setResult({
          valid: false,
          message:
            error.response?.data?.detail ||
            "Unable to verify the ticket.",
          ticket_code: code,
        });
        toast.error("Unable to verify ticket.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatPrice = (price) => {
    const value = Number(price);

    if (!Number.isFinite(value)) return "N/A";

    return value.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const Detail = ({ label, children }) => (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="mt-1 break-words font-semibold text-slate-900">
        {children ?? "N/A"}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
        <div className="pointer-events-none absolute left-[-5rem] top-20 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute right-[-5rem] top-72 h-64 w-64 rounded-full bg-violet-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <header className="mb-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-100 bg-white text-4xl shadow-lg shadow-blue-100/60">
              🎟️
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
              SmartEvent Security
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Verify Your Ticket
            </h1>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
              Check ticket authenticity and review the associated booking
              and event information.
            </p>
          </header>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                🔎
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Ticket lookup
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Enter the unique ticket code shown on the ticket.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="mt-6">
              <label
                htmlFor="ticketCode"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Ticket code
              </label>

              <input
                id="ticketCode"
                name="ticketCode"
                type="text"
                value={ticketCode}
                onChange={(e) => {
                  setTicketCode(e.target.value);
                  if (result) setResult(null);
                }}
                placeholder="TICKET-80D32C7A5559"
                autoComplete="off"
                spellCheck={false}
                disabled={loading}
                aria-describedby="ticket-code-help"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 font-mono text-sm text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p id="ticket-code-help" className="mt-2 text-xs text-slate-500">
                Make sure the code is entered correctly.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Verifying ticket...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">✓</span>
                    Verify Ticket
                  </>
                )}
              </button>
            </form>
          </section>

          {result && (
            <section
              aria-live="polite"
              className="mt-6 animate-[fadeIn_0.3s_ease-out]"
            >
              {result.valid ? (
                <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl shadow-emerald-100/50">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-6 sm:px-8">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-3xl font-bold text-white shadow-lg shadow-emerald-600/20">
                        ✓
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                          Verification successful
                        </p>
                        <h2 className="mt-1 text-2xl font-extrabold text-emerald-950">
                          Ticket Verified
                        </h2>
                        <p className="mt-1 text-sm text-emerald-800">
                          {result.message || "The ticket was verified."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-8">
                    <h3 className="text-lg font-bold text-slate-900">
                      Ticket information
                    </h3>

                    <div className="mt-5 grid gap-x-6 gap-y-5 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2 sm:p-5">
                      <Detail label="Ticket code">
                        <span className="font-mono text-sm">
                          {result.ticket_code}
                        </span>
                      </Detail>

                      <Detail label="Ticket ID">
                        {result.ticket_id != null
                          ? `#${result.ticket_id}`
                          : "N/A"}
                      </Detail>

                      <Detail label="Booking ID">
                        {result.booking_id != null
                          ? `#${result.booking_id}`
                          : "N/A"}
                      </Detail>

                      <Detail label="Booking status">
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
                          {result.booking_status || "N/A"}
                        </span>
                      </Detail>

                      <Detail label="Ticket quantity">
                        {result.ticket_quantity ?? "N/A"}
                      </Detail>

                      <Detail label="Total price">
                        {formatPrice(result.total_price)}
                      </Detail>
                    </div>

                    {result.event && (
                      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                            📅
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              Event details
                            </h3>
                            <p className="text-sm text-slate-500">
                              Event associated with this ticket
                            </p>
                          </div>
                        </div>

                        <h4 className="mt-5 text-xl font-extrabold text-slate-900">
                          {result.event.title || "Untitled event"}
                        </h4>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                          <Detail label="Category">
                            {result.event.category}
                          </Detail>

                          <Detail label="Ticket price">
                            {formatPrice(result.event.ticket_price)}
                          </Detail>

                          <Detail label="Location">
                            {result.event.location}
                          </Detail>

                          <Detail label="Event date">
                            {formatDate(result.event.event_date)}
                          </Detail>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                      <span className="text-lg" aria-hidden="true">
                        ✓
                      </span>
                      <p>
                        The verification API reported this ticket as valid.
                        Review the event and booking information before
                        admitting the attendee.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-xl shadow-red-100/40">
                  <div className="flex items-start gap-4 bg-red-50 px-5 py-6 sm:px-8">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-2xl font-bold text-white">
                      !
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
                        Verification unsuccessful
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold text-red-950">
                        Ticket Could Not Be Verified
                      </h2>
                      <p className="mt-2 leading-6 text-red-800">
                        {result.message ||
                          "This ticket could not be verified. Check the code and try again."}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-8">
                    {result.ticket_code && (
                      <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                          Submitted ticket code
                        </p>
                        <p className="mt-2 break-all font-mono text-sm font-bold text-red-900">
                          {result.ticket_code}
                        </p>
                      </div>
                    )}

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      Check the ticket code for typing errors. If the problem
                      continues, contact the event organizer.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setTicketCode("");
                        setResult(null);
                      }}
                      className="mt-5 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                    >
                      Try another ticket
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
            <Link
              to="/tickets"
              className="font-semibold text-blue-700 transition hover:text-blue-900"
            >
              ← My Tickets
            </Link>

            <Link
              to="/bookings"
              className="font-semibold text-blue-700 transition hover:text-blue-900"
            >
              My Bookings
            </Link>

            <Link
              to="/"
              className="font-semibold text-blue-700 transition hover:text-blue-900"
            >
              Explore Events →
            </Link>
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            SmartEvent · Event ticket verification
          </p>
        </div>
      </main>
    </div>
  );
}

export default VerifyTicket;
