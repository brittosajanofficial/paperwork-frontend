import React, { useState } from "react";

const API_BASE = "https://paperwork-backend.onrender.com";

export default function Signup({ onSignedUp, onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(Object.values(data).flat().join(" "));
      }
      onSignedUp();
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Could not reach the server — it may be waking up, try again in 30 seconds."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h2>Sign up</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
      <input
        placeholder="Password (min 8 characters)"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
      {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
        {loading ? "Signing up..." : "Sign up"}
      </button>
      <p style={{ fontSize: 13, marginTop: 12 }}>
        Already have an account?{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin(); }}>
          Log in here
        </a>
      </p>
    </form>
  );
}