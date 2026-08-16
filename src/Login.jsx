import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid username or password");
      const data = await res.json();
      onLogin({ access: data.access, refresh: data.refresh });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h2>Log in</h2>
      <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit" style={{ padding: "8px 16px" }}>Log in</button>
    </form>
  );
}