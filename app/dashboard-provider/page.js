"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

let L;
if (typeof window !== "undefined") {
  import("leaflet/dist/leaflet.css");
  L = require("leaflet");
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [truckType, setTruckType] = useState("mini");
  const [status, setStatus] = useState("offline");
  const [dropoff, setDropoff] = useState("");
  const [dropoffCoord, setDropoffCoord] = useState(null);
  const [map, setMap] = useState(null);
  const watchIdRef = useRef(null);
  const [loc, setLoc] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  async function geocode(address) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    );
    const j = await res.json();
    if (!j.length) return null;
    return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
  }

  async function goOnline() {
    if (!user) return alert("Login required");
    if (!loc) return alert("Allow location and wait for a fix first.");

    const providerRef = doc(db, "providers", user.uid);
    await setDoc(
      providerRef,
      {
        providerId: user.uid,
        email: user.email,
        truckType,
        status: "online",
        pickupCoord: loc,
        dropoff,
        dropoffCoord: dropoffCoord || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setStatus("online");
    startWatch();
  }

  async function goOffline() {
    if (!user) return;
    const providerRef = doc(db, "providers", user.uid);
    await setDoc(providerRef, { status: "offline", updatedAt: serverTimestamp() }, { merge: true });

    setStatus("offline");
    stopWatch();
  }

  function startWatch() {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    if (watchIdRef.current) return;

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(coords);

        if (user && status === "online") {
          const providerRef = doc(db, "providers", user.uid);
          await setDoc(providerRef, { pickupCoord: coords, updatedAt: serverTimestamp() }, { merge: true });
        }
      },
      (err) => console.error("Error:", err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    watchIdRef.current = id;
  }

  function stopWatch() {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopWatch();
  }, []);

  async function setDropoffHandler() {
    if (!dropoff) return alert("Enter dropoff location");
    const c = await geocode(dropoff);
    if (!c) return alert("Could not find location");
    setDropoffCoord(c);
  }

  function getSingleFix() {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(coords);
        if (map) map.setView([coords.lat, coords.lng], 13);
      },
      (err) => alert("Error: " + err.message),
      { enableHighAccuracy: true }
    );
  }

  // ---------- UI STYLING ----------
  const sidebar = {
    width: "420px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 0 20px rgba(0,0,0,0.08)",
    borderLeft: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  };

  const card = {
    background: "#f9fafb",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  };

  const label = { fontWeight: 600, marginBottom: "4px", display: "block" };

  const input = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    marginTop: "4px",
  };

  const select = { ...input };

  const primaryBtn = {
    padding: "12px",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
  };

  const grayBtn = {
    ...primaryBtn,
    background: "#6b7280",
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f3f4f6" }}>
      {/* MAP */}
      <div style={{ flex: 2 }}>
        <MapContainer
          whenCreated={setMap}
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {loc && (
            <Marker position={[loc.lat, loc.lng]}>
              <Popup>Your current location</Popup>
            </Marker>
          )}
          {dropoffCoord && (
            <Marker position={[dropoffCoord.lat, dropoffCoord.lng]}>
              <Popup>Your destination</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <h2 style={{ margin: 0, fontWeight: 700, color: "#1e3a8a" }}>
          Provider Dashboard
        </h2>

        <div style={card}>
          <label style={label}>Truck Type</label>
          <select
            value={truckType}
            onChange={(e) => setTruckType(e.target.value)}
            style={select}
          >
            <option value="tempo">Tempo</option>
            <option value="mini">Mini Truck</option>
            <option value="large">Large Truck</option>
          </select>
        </div>

        <div style={card}>
          <label style={label}>Destination (Dropoff)</label>
          <input
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            placeholder="e.g., Mumbai"
            style={input}
          />
          <button onClick={setDropoffHandler} style={{ ...primaryBtn, marginTop: 8 }}>
            Set Destination
          </button>
        </div>

        <div style={card}>
          <button onClick={getSingleFix} style={primaryBtn}>
            Update My Location
          </button>
        </div>

        <div style={card}>
          {status === "online" ? (
            <button onClick={goOffline} style={grayBtn}>
              Go Offline
            </button>
          ) : (
            <button onClick={goOnline} style={primaryBtn}>
              Go Online
            </button>
          )}
        </div>

        <div style={card}>
          <div><strong>Status:</strong> {status}</div>
          <div style={{ marginTop: 4 }}>
            <strong>Current Location:</strong>{" "}
            {loc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : "Waiting..."}
          </div>
          <div style={{ marginTop: 4 }}>
            <strong>Dropoff:</strong> {dropoff || "Not set"}
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", marginTop: "auto" }}>
          Your location updates in real-time when Online
        </p>
      </div>
    </div>
  );
}