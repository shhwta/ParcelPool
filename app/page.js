"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-white text-slate-900">
      {/* NAV */}
      <header className="w-full z-30">
        <nav className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              QP
            </div>
            <div>
              <div className="text-lg font-extrabold">QuickParcel</div>
              <div className="text-xs -mt-1 text-slate-500">Parcel delivery & tracking</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded-full bg-white text-blue-600 font-semibold shadow hover:scale-[1.02] transition"
            >
              Login
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 md:px-8 pt-12 md:pt-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left: text */}
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900">
              Fast. Reliable. Transparent. <br />
              <span className="text-emerald-600">Parcel delivery</span> — built for businesses & people.
            </h1>
            <p className="mt-6 text-slate-600 max-w-xl">
              Book trucks, tempos and cargo vehicles in seconds. Smart matching, live tracking and clear pricing — all in one
              dashboard. Trusted by customers and providers across the city.
            </p>

            {/* Search card (UI only) */}
            <div className="mt-8 bg-white shadow-lg border border-slate-100 rounded-2xl p-4 max-w-xl">
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <input
                  aria-label="pickup"
                  placeholder="Pickup location (e.g., MG Road)"
                  className="flex-1 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  aria-label="dropoff"
                  placeholder="Dropoff location (e.g., Koramangala)"
                  className="flex-1 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={() => router.push("/login")}
                  className="px-5 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:scale-[1.02] transition"
                >
                  Get Estimate
                </button>
              </div>

              <div className="mt-3 text-sm text-slate-500 flex items-center gap-3">
                <span className="inline-flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80"><path fill="currentColor" d="M12 2a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 16a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></svg>
                  Instant quotes
                </span>
                <span className="inline-flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80"><path fill="currentColor" d="M12 2l3 7h7l-5.5 4.2L20 22l-8-5-8 5 1.5-8.8L0 9h7l3-7z"/></svg>
                  Live tracking
                </span>
              </div>
            </div>

            {/* CTA row */}
            <div className="mt-8 flex gap-4 items-center">
              <button
                onClick={() => router.push("/login")}
                className="px-6 py-3 rounded-xl bg-amber-400 text-slate-900 font-bold shadow hover:brightness-95 transition"
              >
                Start Sending Packages
              </button>

              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Become a Provider
              </button>
            </div>

            {/* Trust stats */}
            <div className="mt-8 flex gap-6">
              <div>
                <div className="text-2xl font-extrabold">12k+</div>
                <div className="text-sm text-slate-500">Deliveries</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold">1.8k+</div>
                <div className="text-sm text-slate-500">Active drivers</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold">98%</div>
                <div className="text-sm text-slate-500">On-time rate</div>
              </div>
            </div>
          </div>

          {/* Right: animated hero visual */}
          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-lg relative">
              <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Your route</div>
                    <div className="text-lg font-semibold">Koramangala → MG Road</div>
                  </div>
                  <div className="text-sm text-slate-400">ETA ~ 45 mins</div>
                </div>

                <div className="mt-6 h-48 relative overflow-hidden rounded-lg bg-gradient-to-b from-sky-50 to-white border border-slate-100">
                  {/* stylized map / road */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1">
                        <stop offset="0" stopColor="#e6f2ff" />
                        <stop offset="1" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#g1)" />
                    {/* road */}
                    <path d="M50 240 C 200 180, 300 230, 400 210 C 500 190, 600 230, 750 180" stroke="#e2e8f0" strokeWidth="22" strokeLinecap="round" fill="none"/>
                    <path d="M50 240 C 200 180, 300 230, 400 210 C 500 190, 600 230, 750 180" stroke="#f8fafc" strokeWidth="6" strokeDasharray="18 14" strokeLinecap="round" fill="none" />
                  </svg>

                  {/* moving truck (svg) */}
                  <div className="truck absolute top-1/2 -translate-y-1/2 left-0 w-28 h-16">
                    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <rect x="0" y="8" width="48" height="22" rx="3" fill="#0284c7"/>
                      <rect x="48" y="14" width="26" height="16" rx="3" fill="#0369a1" />
                      <rect x="6" y="12" width="12" height="8" rx="1" fill="#fff" opacity="0.9"/>
                      <circle cx="18" cy="32" r="4" fill="#0f172a"/>
                      <circle cx="62" cy="32" r="4" fill="#0f172a"/>
                    </svg>
                  </div>
                </div>

                <div className="mt-4 text-sm text-slate-500">Real-time routing • OpenStreetMap • OSRM</div>
              </div>

              {/* badge */}
              <div className="absolute -bottom-6 right-6 bg-white rounded-xl shadow-lg px-4 py-2 border border-slate-100">
                <div className="text-xs text-slate-500">Featured</div>
                <div className="text-sm font-semibold">Instant Bookings</div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16">
          <h3 className="text-2xl font-bold text-center text-slate-900">What we offer</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
              <div className="text-3xl">📍</div>
              <h4 className="mt-4 font-semibold">Real-time tracking</h4>
              <p className="mt-2 text-slate-600">Watch your parcel move on the map in real time with ETA estimates.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
              <div className="text-3xl">⚡</div>
              <h4 className="mt-4 font-semibold">Instant booking</h4>
              <p className="mt-2 text-slate-600">Book a vehicle in seconds. Instant availability & transparent pricing.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
              <div className="text-3xl">🛡️</div>
              <h4 className="mt-4 font-semibold">Verified drivers</h4>
              <p className="mt-2 text-slate-600">All providers are verified and rated by customers.</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12">
          <h3 className="text-2xl font-bold text-center">How it works</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Enter route", text: "Add pickup & dropoff" },
              { step: "2", title: "Choose vehicle", text: "Select tempo, mini or large truck" },
              { step: "3", title: "Find trucks", text: "Smart matching with live providers" },
              { step: "4", title: "Track & deliver", text: "Realtime tracking until delivered" },
            ].map((s) => (
              <div key={s.step} className="p-6 bg-white rounded-2xl shadow flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600">{s.step}</div>
                <div className="font-semibold">{s.title}</div>
                <div className="text-sm text-slate-500 text-center">{s.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Vehicles */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 bg-slate-50">
          <h3 className="text-2xl font-bold text-center">Choose vehicle</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Tempo", cap: "Small loads", price: "₹10/km" },
              { name: "Mini Truck", cap: "Medium loads", price: "₹18/km" },
              { name: "Large Truck", cap: "Large loads", price: "₹25/km" },
            ].map((v) => (
              <div key={v.name} className="p-6 bg-white rounded-2xl shadow hover:scale-[1.02] transition">
                <div className="text-4xl">🚚</div>
                <div className="mt-4 font-semibold text-lg">{v.name}</div>
                <div className="text-sm text-slate-500 mt-2">{v.cap}</div>
                <div className="mt-4 font-bold">{v.price}</div>
                <div className="mt-4">
                  <button onClick={() => router.push("/login")} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Book</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Provider CTA */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-extrabold">Drive with QuickParcel</h3>
              <p className="mt-2 text-white/90">Earn daily by accepting nearby trips. Flexible hours, instant payouts.</p>
            </div>
            <div>
              <button onClick={() => router.push("/login")} className="px-6 py-3 rounded-lg bg-white text-emerald-700 font-bold shadow">Become a Provider</button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12">
          <h3 className="text-2xl font-bold text-center">What our users say</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Riya", text: "Saved my day — parcel arrived in 40 minutes!" },
              { name: "Amit", text: "Transparent pricing and live tracking. Great app." },
              { name: "Sameer", text: "Good earnings as a provider. Reliable platform." },
            ].map((t) => (
              <div key={t.name} className="p-6 bg-white rounded-2xl shadow">
                <div className="font-semibold">{t.name}</div>
                <div className="text-slate-500 mt-2">{t.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-100 py-8">
          <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-bold">QuickParcel</div>
              <div className="text-sm text-slate-500">Fast parcel delivery • Live tracking</div>
            </div>

            <div className="flex gap-6">
              <a className="text-sm text-slate-500 hover:text-slate-700">About</a>
              <a className="text-sm text-slate-500 hover:text-slate-700">Contact</a>
              <a className="text-sm text-slate-500 hover:text-slate-700">FAQ</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Floating CTA */}
      <button
        onClick={() => router.push("/login")}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg text-slate-900 font-bold hover:scale-[1.03] transition"
        aria-label="Book now"
      >
        Book Now
      </button>

      {/* small custom styles for truck animation */}
      <style jsx>{`
        .truck {
          left: -10%;
          transform: translateX(0);
          animation: drive 8s linear infinite;
        }

        @keyframes drive {
          0% { left: -18%; transform: translateY(0) scale(0.98); opacity: 0.95; }
          10% { transform: translateY(-2px) scale(1); opacity: 1; }
          50% { left: 62%; transform: translateY(0) scale(1); }
          90% { left: 110%; transform: translateY(2px) scale(0.98); opacity: 0.9; }
          100% { left: 120%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};