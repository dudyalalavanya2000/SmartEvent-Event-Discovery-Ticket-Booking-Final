
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

function BookingConfirmation() {
  const { bookingId } = useParams();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
        {/* Decorative background */}
        <div className="pointer-events-none absolute left-[-5rem] top-16 h-48 w-48 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-[-4rem] h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />

        <section className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          {/* Success header */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-10 text-center sm:px-12 sm:py-12">
            <div className="mx-auto flex h-24 w-24 animate-[bounce_1s_ease-in-out_1] items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-100 text-5xl shadow-sm">
              <span role="img" aria-label="Success">
                ✓
              </span>
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
              Booking successful
            </p>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              You're going to the event!
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
              Your booking has been created successfully. Get ready for a
              great experience!
            </p>
          </div>

          {/* Booking details */}
          <div className="px-6 pb-8 sm:px-12 sm:pb-10">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  🎟️
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Booking details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Keep this ID for your reference
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-dashed border-slate-300 pt-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Booking ID
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    #{bookingId || "N/A"}
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 sm:text-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Created
                </span>
              </div>
            </div>

            {/* Next steps */}
            <div className="mt-7">
              <h2 className="text-base font-bold text-slate-900">
                What's next?
              </h2>

              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Check your booking
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Visit My Bookings to view your booking details and status.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Find your ticket
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Open My Tickets to view your ticket and QR code when it
                      is available.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/bookings"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                View My Bookings
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                to="/tickets"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                <span aria-hidden="true">🎫</span>
                My Tickets
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
              >
                <span aria-hidden="true">←</span>
                Explore more events
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BookingConfirmation;
