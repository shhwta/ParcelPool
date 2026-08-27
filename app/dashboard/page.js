"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet-routing-machine";

// ✅ Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});


// 🛻 Routing + Animation Component
function RoutingMachine({ pickup, dropoff, onDistance }) {
  const map = useMap();
  const controlRef = useRef(null);
  const truckRef = useRef(null);
  const routeCoordsRef = useRef([]);
  const animRef = useRef(null);
  const stepRef = useRef(0);

  useEffect(() => {
    if (!pickup || !dropoff) return;

    // remove existing controls & truck
    if (controlRef.current) {
      try {
        map.removeControl(controlRef.current);
      } catch {}
      controlRef.current = null;
    }
    if (truckRef.current) {
      try {
        map.removeLayer(truckRef.current);
      } catch {}
      truckRef.current = null;
    }

    const control = L.Routing.control({
      waypoints: [
        L.latLng(pickup.lat, pickup.lng),
        L.latLng(dropoff.lat, dropoff.lng),
      ],
      lineOptions: { styles: [{ color: "#2563eb", weight: 6, opacity: 0.8 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      routeWhileDragging: false,
      createMarker: () => null,
    })
      .on("routesfound", (e) => {
        const route = e.routes[0];
        const dist = (route.summary.totalDistance / 1000).toFixed(2);
        onDistance(parseFloat(dist));

        // prepare truck animation
        routeCoordsRef.current = route.coordinates;
        if (routeCoordsRef.current.length > 0) {
          const first = routeCoordsRef.current[0];
          const truckIcon = L.icon({
            iconUrl: "/truck_icon.png", // 👈 add this in /public
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });
          truckRef.current = L.marker([first.lat, first.lng], {
            icon: truckIcon,
          }).addTo(map);
          stepRef.current = 0;
          animateTruck();
        }
      })
      .addTo(map);

    controlRef.current = control;

    // 🛻 Animate Truck
    const animateTruck = () => {
      if (!truckRef.current || routeCoordsRef.current.length === 0) return;
      const coords = routeCoordsRef.current;
      if (stepRef.current >= coords.length) return;
      const pos = coords[stepRef.current];
      truckRef.current.setLatLng([pos.lat, pos.lng]);
      stepRef.current += 2; // speed (1 slow - 3 fast)
      animRef.current = requestAnimationFrame(animateTruck);
    };

    return () => {
      cancelAnimationFrame(animRef.current);
      if (controlRef.current) map.removeControl(controlRef.current);
      if (truckRef.current) map.removeLayer(truckRef.current);
      controlRef.current = null;
      truckRef.current = null;
    };
  }, [pickup, dropoff, map, onDistance]);

  return null;
}


// 🚀 MAIN DASHBOARD PAGE
export default function DashboardPage() {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupCoord, setPickupCoord] = useState(null);
  const [dropoffCoord, setDropoffCoord] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [vehicle, setVehicle] = useState("");
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);

  // redirect unauthenticated users
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  // 🌍 Geocode addresses
  async function geocode(address) {
    const q = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }

  // 🎯 Handle Show Route
  async function handleShowRoute(e) {
    e.preventDefault();
    setLoading(true);
    setDistanceKm(null);
    setPrice(null);

    const p = await geocode(pickup);
    const d = await geocode(dropoff);
    if (!p || !d) {
      alert("Could not find one of the addresses. Try again.");
      setLoading(false);
      return;
    }

    setPickupCoord(p);
    setDropoffCoord(d);
    setLoading(false);
  }

  // 💰 Pricing
  useEffect(() => {
    if (!distanceKm || !vehicle) {
      setPrice(null);
      return;
    }
    const rates = { tempo: 10, mini: 18, large: 25 };
    setPrice((distanceKm * rates[vehicle]).toFixed(0));
  }, [distanceKm, vehicle]);

  // 📦 Book Now
  async function handleBookNow() {
    if (!pickup || !dropoff || !distanceKm || !vehicle || !price) {
      alert("Please complete all fields before booking.");
      return;
    }

    try {
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        pickup,
        dropoff,
        distanceKm,
        vehicle,
        price,
        createdAt: Timestamp.now(),
      });

      setConfirmMsg("✅ Booking Confirmed!");
      setPickup("");
      setDropoff("");
      setPickupCoord(null);
      setDropoffCoord(null);
      setDistanceKm(null);
      setVehicle("");
      setPrice(null);
      fetchBookings();
      setTimeout(() => setConfirmMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Error saving booking: " + err.message);
    }
  }

  // 🔄 Fetch Bookings
  async function fetchBookings() {
    if (!user) return;
    try {
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setBookings(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-gray-100">
      {/* 🗺️ MAP */}
      <div className="w-full md:w-2/3 h-[70vh] md:h-screen relative">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pickupCoord && <Marker position={[pickupCoord.lat, pickupCoord.lng]} />}
          {dropoffCoord && <Marker position={[dropoffCoord.lat, dropoffCoord.lng]} />}
          {pickupCoord && dropoffCoord && (
            <RoutingMachine
              pickup={pickupCoord}
              dropoff={dropoffCoord}
              onDistance={setDistanceKm}
            />
          )}
        </MapContainer>

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* ⚙️ CONTROL PANEL */}
      <div className="md:w-1/3 w-full p-6 flex flex-col justify-between">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-extrabold text-blue-700 mb-4 text-center">
            🚚 QuickParcel Booking
          </h2>

          <form onSubmit={handleShowRoute} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pickup Location
              </label>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="e.g., MG Road, Bangalore"
                className="border border-gray-300 p-3 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dropoff Location
              </label>
              <input
                type="text"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="e.g., Koramangala, Bangalore"
                className="border border-gray-300 p-3 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            >
              {loading ? "Loading Route..." : "Show Route"}
            </button>
          </form>

          {distanceKm && (
            <div className="mt-6 space-y-3">
              <div className="text-lg text-gray-700">
                <strong>📏 Distance:</strong> {distanceKm} km
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Vehicle
                </label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="border border-gray-300 p-3 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  <option value="">-- Choose Vehicle --</option>
                  <option value="tempo">🚐 Tempo (₹10/km)</option>
                  <option value="mini">🚚 Mini Truck (₹18/km)</option>
                  <option value="large">🚛 Large Truck (₹25/km)</option>
                </select>
              </div>

              {price && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-green-800 font-semibold text-lg shadow-sm">
                  💰 Estimated Price: ₹ {price}
                </div>
              )}

              {distanceKm && vehicle && (
                <button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-[1.03]"
                >
                  🚀 Book Now
                </button>
              )}

              {confirmMsg && (
                <div className="text-center text-green-700 font-semibold mt-4 animate-bounce">
                  {confirmMsg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 📋 Bookings List */}
        <div className="mt-4 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-4 border border-gray-200">
          <h3 className="text-xl font-bold text-blue-600 mb-2 text-center">
            📋 My Bookings
          </h3>
          {bookings.length === 0 ? (
            <p className="text-gray-500 text-center">No bookings yet.</p>
          ) : (
            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {bookings.map((b) => (
                <li
                  key={b.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm"
                >
                  <div className="font-semibold">
                    {b.pickup} → {b.dropoff}
                  </div>
                  <div className="text-sm text-gray-600">
                    {b.vehicle.toUpperCase()} | {b.distanceKm} km | ₹{b.price}
                  </div>
                  <div className="text-xs text-gray-400">
                    {b.createdAt?.toDate?.().toLocaleString?.() || ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="text-center text-sm text-gray-500 mt-4">
          © {new Date().getFullYear()} QuickParcel — powered by OpenStreetMap
        </footer>
      </div>
    </div>
  );
};