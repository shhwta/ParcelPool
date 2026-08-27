"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  // 🔍 Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // 🚪 LOGIN
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Login successful. Redirecting...");
      router.push("/role"); // role page
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🆕 SIGNUP
  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Account created. Redirecting...");
      router.push("/role");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔓 LOGOUT
  async function handleLogout() {
    await signOut(auth);
    setUser(null);
    setMessage("Logged out successfully.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      
      <div className="absolute top-6 left-6">
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow"
        >
          ← Back Home
        </button>
      </div>

      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8">
        
        <h1 className="text-3xl font-extrabold text-center text-blue-700 mb-6">
          QuickParcel Login
        </h1>

        {/* Already logged in */}
        {user ? (
          <div className="space-y-4 text-center">
            <p className="text-gray-700">
              Logged in as <strong>{user.email}</strong>
            </p>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => router.push("/role")}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Continue
              </button>

              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex justify-center gap-3 mb-6">
              <button
                onClick={() => setMode("login")}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  mode === "login"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Login
              </button>

              <button
                onClick={() => setMode("signup")}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  mode === "signup"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={mode === "login" ? handleLogin : handleSignup}
              className="space-y-4"
            >
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />

              <input
                type="password"
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Login"
                  : "Create Account"}
              </button>
            </form>

            {message && (
              <p className="mt-4 text-center text-red-600 text-sm">{message}</p>
            )}

            <p className="text-center mt-6 text-gray-500 text-sm">
              After login you will choose <strong>Customer</strong> or{" "}
              <strong>Provider</strong>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}