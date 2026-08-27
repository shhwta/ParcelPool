"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* NAVBAR */}
      <div
        style={{
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        <div style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "1px" }}>
          QuickParcel 🚚
        </div>

        <button
          onClick={() => router.push("/login")}
          style={{
            padding: "10px 18px",
            background: "white",
            color: "#1e3a8a",
            fontWeight: "700",
            fontSize: "15px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          }}
        >
          Login
        </button>
      </div>

      {/* HERO SECTION */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 60px",
        }}
      >
        {/* LEFT SIDE HERO TEXT */}
        <div style={{ maxWidth: "520px" }}>
          <h1
            style={{
              fontSize: "55px",
              fontWeight: "800",
              lineHeight: "1.1",
              marginBottom: "20px",
            }}
          >
            Fast, Safe & Reliable Parcel Delivery
          </h1>

          <p
            style={{
              fontSize: "18px",
              opacity: 0.9,
              marginBottom: "25px",
            }}
          >
            Book mini trucks, tempos, and cargo vehicles instantly.
            Real-time tracking, transparent pricing, and smart matching with nearby delivery providers.
          </p>

          <button
            onClick={() => router.push("/login")}
            style={{
              fontSize: "20px",
              padding: "14px 26px",
              background: "#facc15",
              color: "#1f2937",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
            }}
          >
            Start Sending Packages →
          </button>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div
          style={{
            width: "420px",
            height: "420px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "30px",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          }}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/7436/7436354.png"
            style={{
              width: "70%",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
            }}
          />
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div
        style={{
          padding: "50px 60px",
          background: "white",
          color: "#1f2937",
          borderTopLeftRadius: "40px",
          borderTopRightRadius: "40px",
        }}
      >
        <h2 style={{ fontSize: "34px", fontWeight: "800", textAlign: "center" }}>
          Why Choose QuickParcel?
        </h2>

        <div
          style={{
            marginTop: "40px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {[
            {
              title: "Instant Booking",
              desc: "Book a delivery in seconds with live pricing.",
            },
            {
              title: "Live Tracking",
              desc: "Track your parcels live on the map.",
            },
            {
              title: "Verified Providers",
              desc: "Trusted and verified truck/tempo drivers.",
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                width: "30%",
                padding: "20px",
                borderRadius: "15px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                background: "white",
                textAlign: "center",
              }}
            >
              <h3 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "10px" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "15px", opacity: 0.8 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "14px 26px",
              fontSize: "18px",
              fontWeight: "700",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            Login & Start Delivering →
          </button>
        </div>
      </div>
    </div>
  );
}