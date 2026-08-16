import React, { useState } from "react";

const DOC_TYPES = [
  "RC_BOOK", "INSURANCE", "PUC", "PERMIT",
  "FITNESS", "ROAD_TAX", "DRIVING_LICENSE", "OTHER",
];

export default function NewDocumentForm({ token, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    doc_type: "OTHER",
    document_number: "",
    expiry_date: "",
    reminder_days_before: 15,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/documents/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(JSON.stringify(data));
      }
      const created = await res.json();
      onCreated(created);
      setForm({ title: "", doc_type: "OTHER", document_number: "", expiry_date: "", reminder_days_before: 15 });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 360, margin: "0 auto 2rem", fontFamily: "sans-serif", border: "1px solid #ccc", padding: "1rem" }}>
      <h3>Add a document</h3>
      <input placeholder="Title" value={form.title} onChange={(e) => update("title", e.target.value)} required style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
      <select value={form.doc_type} onChange={(e) => update("doc_type", e.target.value)} style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}>
        {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input placeholder="Document number" value={form.document_number} onChange={(e) => update("document_number", e.target.value)} style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
      <label style={{ fontSize: 12 }}>Expiry date</label>
      <input type="date" value={form.expiry_date} onChange={(e) => update("expiry_date", e.target.value)} required style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
      <label style={{ fontSize: 12 }}>Remind me (days before)</label>
      <input type="number" value={form.reminder_days_before} onChange={(e) => update("reminder_days_before", Number(e.target.value))} style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
      {error && <p style={{ color: "red", fontSize: 12 }}>{error}</p>}
      <button type="submit" disabled={saving} style={{ padding: "8px 16px" }}>
        {saving ? "Saving..." : "Add document"}
      </button>
    </form>
  );
}