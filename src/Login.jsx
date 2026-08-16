import React, { useState } from "react";

const API_BASE = "https://paperwork-backend.onrender.com";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid username or password");
      const data = await res.json();
      onLogin({ access: data.access, refresh: data.refresh });
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
      <h2>Log in</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
      {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
        {loading ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}