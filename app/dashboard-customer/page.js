"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";

// dynamic react-leaflet imports (Next.js safe)
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

// --- helper: haversine distance in km between two {lat,lng} ---
function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const la = toRad(a.lat);
  const lb = toRad(b.lat);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const aa = sinHalfLat * sinHalfLat + Math.cos(la) * Math.cos(lb) * sinHalfLon * sinHalfLon;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

// --- helper: check point near polyline (array of [lng,lat]) using point-to-vertex distance
// simple approach: compute haversine distance to each vertex; good enough for prototype.
// For better accuracy use point-to-segment distance; but this is simpler and fast.
function isPointNearPolyline(point, polylineCoords, thresholdKm) {
  if (!polylineCoords || !polylineCoords.length) return false;
  for (let i = 0; i < polylineCoords.length; i++) {
    const [lng, lat] = polylineCoords[i];
    const dist = haversineKm({ lat, lng }, point);
    if (dist <= thresholdKm) return true;
  }
  return false;
}

// OSRM route fetch helper (returns GeoJSON coordinates array [ [lng,lat], ... ] )
async function fetchOsrmRouteCoords(start, end) {
  // start, end: { lat, lng }
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("OSRM route fetch failed: " + res.status);
  }
  const j = await res.json();
  if (!j || !j.routes || !j.routes.length) throw new Error("OSRM returned no route");
  return j.routes[0].geometry.coordinates; // array of [lng,lat]
}

export default function DashboardCustomer() {
  const router = useRouter();
  // auth guard
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  // UI state
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupCoord, setPickupCoord] = useState(null);
  const [dropoffCoord, setDropoffCoord] = useState(null);

  const [distanceKm, setDistanceKm] = useState(null);
  const [vehicle, setVehicle] = useState("");
  const [price, setPrice] = useState(null);

  const [providers, setProviders] = useState([]); // all online providers raw
  const [matchedProviders, setMatchedProviders] = useState([]); // providers matching route rule
  const [loading, setLoading] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");

  // map refs
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const providerMarkerRefs = useRef({}); // providerId -> marker

  // provider route cache (avoid repeated OSRM calls for same provider in this session)
  const providerRouteCacheRef = useRef({}); // providerId -> { coords: [ [lng,lat], ...], fetchedAt }

  // threshold (your choice): 35 km
  const MATCH_THRESHOLD_KM = 35;

  // subscribe providers realtime (status == "online")
  useEffect(() => {
    const q = query(collection(db, "providers"), where("status", "==", "online"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProviders(arr);
      // update existing markers positions (if shown)
      arr.forEach((p) => {
        const m = providerMarkerRefs.current[p.id];
        if (m && p.pickupCoord && p.pickupCoord.lat && p.pickupCoord.lng) {
          m.setLatLng([p.pickupCoord.lat, p.pickupCoord.lng]);
        }
      });
    }, (err) => {
      console.error("providers subscription error:", err);
    });
    return () => unsub();
  }, []);

  // geocode helper (Nominatim)
  async function geocode(address) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`);
      const j = await res.json();
      if (!j || !j.length) return null;
      return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
    } catch (err) {
      console.error("geocode err", err);
      return null;
    }
  }

  // draw customer route using OSRM and set distanceKm
  async function drawCustomerRoute(start, end) {
    try {
      if (routeLayerRef.current && mapRef.current) {
        try { mapRef.current.removeLayer(routeLayerRef.current); } catch {}
        routeLayerRef.current = null;
      }
      const coords = await fetchOsrmRouteCoords(start, end);
      if (!coords || !coords.length) return;
      if (mapRef.current && L) {
        routeLayerRef.current = L.geoJSON({ type: "LineString", coordinates: coords }, {
          style: { color: "#2563eb", weight: 5, opacity: 0.9 },
        }).addTo(mapRef.current);

        const bounds = routeLayerRef.current.getBounds();
        if (bounds.isValid()) mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
      // distance from OSRM route summary would be better; we can compute approx from endpoints:
      // But to keep consistent, compute total segment distance from coordinates:
      let total = 0;
      for (let i = 1; i < coords.length; i++) {
        const [lng1, lat1] = coords[i - 1];
        const [lng2, lat2] = coords[i];
        total += haversineKm({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
      }
      setDistanceKm(parseFloat(total.toFixed(2)));
      return coords;
    } catch (err) {
      console.error("drawCustomerRoute err:", err);
      return null;
    }
  }

  // main: when user clicks Show Route
  async function handleShowRoute(e) {
    e?.preventDefault();
    setLoading(true);
    setMatchedProviders([]);
    setPrice(null);
    setDistanceKm(null);

    // geocode user input
    const p = await geocode(pickup);
    const d = await geocode(dropoff);
    if (!p || !d) {
      alert("Could not find pickup or dropoff address. Try a more specific address.");
      setLoading(false);
      return;
    }
    setPickupCoord(p);
    setDropoffCoord(d);

    // ensure map exists
    if (mapRef.current && p) mapRef.current.setView([p.lat, p.lng], 11);

    // draw customer route and get its polyline coords
    const customerRouteCoords = await drawCustomerRoute(p, d);

    // fetch current providers snapshot (providers state is realtime but we also use latest)
    const currentProviders = providers.slice();

    // For each provider, if provider has pickupCoord & dropoffCoord -> fetch provider route (cached) and test intersection.
    // If provider lacks dropoffCoord -> fallback to proximity of pickupCoord to customer pickup.
    const matching = [];
    for (const prov of currentProviders) {
      try {
        if (prov.pickupCoord && prov.dropoffCoord && prov.pickupCoord.lat && prov.dropoffCoord.lat) {
          // check cache
          let routeObj = providerRouteCacheRef.current[prov.id];
          if (!routeObj) {
            // fetch provider route coords from OSRM
            try {
              const coords = await fetchOsrmRouteCoords(prov.pickupCoord, prov.dropoffCoord);
              routeObj = { coords, fetchedAt: Date.now() };
              providerRouteCacheRef.current[prov.id] = routeObj;
            } catch (err) {
              console.warn("OSRM fetch for provider failed:", prov.id, err.message);
              // fallback: use direct line [pickup, dropoff]
              routeObj = { coords: [[prov.pickupCoord.lng, prov.pickupCoord.lat], [prov.dropoffCoord.lng, prov.dropoffCoord.lat]], fetchedAt: Date.now() };
              providerRouteCacheRef.current[prov.id] = routeObj;
            }
          }

          // check whether customer pickup is within MATCH_THRESHOLD_KM of any point in provider route
          const customerPoint = p; // {lat,lng}
          const near = isPointNearPolyline(customerPoint, routeObj.coords, MATCH_THRESHOLD_KM);
          if (near) {
            matching.push({ provider: prov, matchType: "route" });
            continue;
          } else {
            // if not near route, also check simple distance to provider pickup (maybe provider is already near)
            const dkm = haversineKm(prov.pickupCoord, customerPoint);
            if (dkm <= MATCH_THRESHOLD_KM) {
              matching.push({ provider: prov, matchType: "pickup-proximity" });
              continue;
            }
          }
        } else if (prov.pickupCoord && prov.pickupCoord.lat) {
          // provider doesn't have dropoffCoord — fallback to proximity
          const dkm = haversineKm(prov.pickupCoord, p);
          if (dkm <= MATCH_THRESHOLD_KM) {
            matching.push({ provider: prov, matchType: "pickup-only" });
            continue;
          }
        }
      } catch (err) {
        console.error("provider match check error for", prov.id, err);
      }
    }

    // matched providers now contains all providers that match (you chose option A: show all)
    const matchedList = matching.map((m) => ({ ...m.provider, _matchType: m.matchType }));
    setMatchedProviders(matchedList);

    // add markers for matched providers on map (cleanup previous unmatched markers)
    try {
      // remove any markers that are no longer matched
      Object.keys(providerMarkerRefs.current).forEach((pid) => {
        if (!matchedList.find((mp) => mp.id === pid)) {
          try { providerMarkerRefs.current[pid].remove(); } catch {}
          delete providerMarkerRefs.current[pid];
        }
      });

      // add or update markers for matchedList
      matchedList.forEach((prov) => {
        if (!providerMarkerRefs.current[prov.id] && mapRef.current && L) {
          const marker = L.marker([prov.pickupCoord.lat, prov.pickupCoord.lng]).addTo(mapRef.current);
          marker.bindPopup(`<b>${(prov.truckType || "truck").toUpperCase()}</b><br/>${prov.email}<br/><button id="book-${prov.id}">Book</button>`);
          marker.on("popupopen", () => {
            setTimeout(() => {
              const btn = document.getElementById(`book-${prov.id}`);
              if (btn) btn.onclick = () => handleBook(prov);
            }, 50);
          });
          providerMarkerRefs.current[prov.id] = marker;
        } else {
          // update existing marker position
          const m = providerMarkerRefs.current[prov.id];
          if (m && prov.pickupCoord) m.setLatLng([prov.pickupCoord.lat, prov.pickupCoord.lng]);
        }
      });
    } catch (err) {
      console.error("marker update error", err);
    }

    // set price if distance known (distanceKm is set from route)
    if (distanceKm) {
      // simple default rates
      const rates = { tempo: 10, mini: 18, large: 25 };
      if (vehicle) setPrice(Math.round(distanceKm * (rates[vehicle] || 18)));
    }

    setLoading(false);
  }

  // book handler
  async function handleBook(provider) {
    if (!user) {
      alert("Please login first.");
      return;
    }
    if (!pickup || !dropoff) {
      alert("Enter route first.");
      return;
    }
    try {
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        providerId: provider.providerId || provider.id,
        providerDocId: provider.id,
        pickup,
        dropoff,
        pickupCoord,
        dropoffCoord,
        distanceKm,
        vehicle,
        price,
        createdAt: Timestamp.now(),
      });
      setConfirmMsg("✅ Booking created. Provider will be notified.");
      setTimeout(() => setConfirmMsg(""), 4000);
    } catch (err) {
      console.error("booking error", err);
      alert("Booking failed: " + (err.message || err));
    }
  }

  // compute price when distance changes or vehicle changes
  useEffect(() => {
    if (!distanceKm || !vehicle) { setPrice(null); return; }
    const rates = { tempo: 10, mini: 18, large: 25 };
    setPrice(Math.round(distanceKm * (rates[vehicle] || 18)));
  }, [distanceKm, vehicle]);

  // small UI styles (no Tailwind)
  const containerStyle = { minHeight: "100vh", display: "flex", flexDirection: "row", fontFamily: "system-ui, Arial" };
  const mapStyle = { flex: 2, height: "100vh" };
  const panelStyle = { flex: 1, padding: 20, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" };

  return (
    <div style={containerStyle}>
      {/* Map area */}
      <div style={mapStyle}>
        <MapContainer
          whenCreated={(map) => { mapRef.current = map; }}
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {/* Customer pickup/dropoff markers */}
          {pickupCoord && <Marker position={[pickupCoord.lat, pickupCoord.lng]} />}
          {dropoffCoord && <Marker position={[dropoffCoord.lat, dropoffCoord.lng]} />}
        </MapContainer>
      </div>

      {/* Control panel */}
      <div style={panelStyle}>
        <h2 style={{ margin: 0 }}>QuickParcel — Customer</h2>
        <p style={{ color: "#666" }}>Enter route. We will show trucks that pass near your pickup (35 km threshold).</p>

        <form onSubmit={handleShowRoute} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            placeholder="Pickup address"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            required
          />
          <input
            placeholder="Dropoff address"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            required
          />
          <button type="submit" style={{ padding: 10, borderRadius: 8, background: "#2563eb", color: "white", border: "none", cursor: "pointer" }}>
            {loading ? "Searching..." : "Show Route & Find Trucks"}
          </button>
        </form>

        {distanceKm !== null && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#f7fbff", border: "1px solid #e6f0ff" }}>
            <div style={{ fontWeight: 700 }}>Distance: {distanceKm} km</div>
            <div style={{ marginTop: 8 }}>
              <label>Vehicle</label>
              <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={{ display: "block", width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", marginTop: 6 }}>
                <option value="">-- choose vehicle --</option>
                <option value="tempo">Tempo (₹10/km)</option>
                <option value="mini">Mini Truck (₹18/km)</option>
                <option value="large">Large Truck (₹25/km)</option>
              </select>
            </div>
            {price !== null && <div style={{ marginTop: 10, fontWeight: 700 }}>Estimated price: ₹{price}</div>}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <h3>Matching trucks (within 35 km of provider route)</h3>
          {matchedProviders.length === 0 ? (
            <div style={{ color: "#666" }}>No matching trucks found. Try widening area or wait for providers to go online.</div>
          ) : (
            matchedProviders.map((p) => (
              <div key={p.id} style={{ padding: 10, borderRadius: 8, border: "1px solid #eee", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{(p.truckType || "truck").toUpperCase()}</div>
                    <div style={{ fontSize: 13, color: "#555" }}>{p.email}</div>
                    <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Pickup: {p.pickup || "-"}</div>
                    <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Match: {p._matchType || "route"}</div>
                  </div>
                  <div>
                    <button onClick={() => handleBook(p)} style={{ padding: "8px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {confirmMsg && <div style={{ marginTop: 12, color: "green", fontWeight: 700 }}>{confirmMsg}</div>}
      </div>
    </div>
  );
}