"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { collection } from "firebase/firestore";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

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

export default function TrackPage({ params }) {
  const bookingId = params.bookingId;
  const [booking, setBooking] = useState(null);
  const [provider, setProvider] = useState(null);
  const mapRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!bookingId) return;
    // subscribe to booking doc
    const bRef = doc(db, "bookings", bookingId);
    const unsubB = onSnapshot(bRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setBooking(data);

      // draw route if not drawn
      if (data.pickupCoord && data.dropoffCoord && mapRef.current && L) {
        // draw via OSRM
        try {
          if (routeLayerRef.current) { mapRef.current.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
          const p = data.pickupCoord; const d = data.dropoffCoord;
          const url = `https://router.project-osrm.org/route/v1/driving/${p.lng},${p.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url); const j = await res.json();
          if (j?.routes?.length) {
            routeLayerRef.current = L.geoJSON(j.routes[0].geometry, { style: { color: "#2563eb", weight: 5 } }).addTo(mapRef.current);
            mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });
          }
        } catch (err) { console.error("track route err", err); }
      }

      // subscribe provider doc
      if (data.providerDocId) {
        const pRef = doc(db, "providers", data.providerDocId);
        const unsubP = onSnapshot(pRef, (psnap) => {
          if (!psnap.exists()) return;
          const pdata = psnap.data();
          setProvider(pdata);
          // update marker
          if (mapRef.current && pdata.pickupCoord) {
            if (!providerMarkerRef.current) {
              providerMarkerRef.current = L.marker([pdata.pickupCoord.lat, pdata.pickupCoord.lng]).addTo(mapRef.current).bindPopup("Provider");
            } else {
              providerMarkerRef.current.setLatLng([pdata.pickupCoord.lat, pdata.pickupCoord.lng]);
            }
          }
        }, (err) => console.error("provider sub err", err));
        // cleanup when booking changes
        return () => unsubP();
      }
    }, (err) => console.error("booking sub err", err));
    return () => unsubB();
  }, [bookingId]);

  return (
    <div style={{ height: "100vh", display: "flex" }}>
      <div style={{ flex: 1 }}>
        <MapContainer whenCreated={(m) => (mapRef.current = m)} center={[20.5937,78.9629]} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
      </div>
      <div style={{ width: 360, padding: 12 }}>
        <h2>Track Booking</h2>
        <div>Booking id: {bookingId}</div>
        <div>Customer pickup: {booking?.pickup}</div>
        <div>Provider: {provider?.email}</div>
        <div>Provider location: {provider?.pickupCoord ? `${provider.pickupCoord.lat.toFixed(5)}, ${provider.pickupCoord.lng.toFixed(5)}` : "—"}</div>
      </div>
    </div>
  );
}