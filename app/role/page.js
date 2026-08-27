"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function RoleSelectionPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // waits for firebase auth check
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/"); // redirect to login if not logged in
      } else {
        setUser(u);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  async function selectRole(role) {
    if (!user) return alert("User not found. Please log in again.");
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), { role }, { merge: true });
      if (role === "customer") router.push("/dashboard-customer");
      else router.push("/dashboard-provider");
    } catch (err) {
      console.error(err);
      alert("Error saving role: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500 text-lg">
        Checking user session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500 text-lg">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="bg-white shadow-lg p-8 rounded-2xl text-center space-y-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-700">
          👋 Welcome, {user.email}
        </h1>
        <p className="text-gray-600">
          Please select how you want to use <strong>QuickParcel</strong>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => selectRole("customer")}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            🧍 Customer
          </button>
          <button
            onClick={() => selectRole("provider")}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            🚚 Provider
          </button>
        </div>

        {saving && (
          <div className="text-blue-600 font-semibold mt-3 animate-pulse">
            Saving your selection...
          </div>
        )}
      </div>
    </div>
  );
}