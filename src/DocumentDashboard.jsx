import React, { useEffect, useMemo, useState } from "react";
import NewDocumentForm from "./NewDocumentForm";

const API_BASE = "https://paperwork-backend.onrender.com";

const DOC_TYPE_LABELS = {
  RC_BOOK: "RC Book",
  INSURANCE: "Insurance",
  PUC: "PUC Certificate",
  PERMIT: "Permit",
  FITNESS: "Fitness Certificate",
  ROAD_TAX: "Road Tax",
  DRIVING_LICENSE: "Driving License",
  OTHER: "Other",
};

function statusOf(expiryIso) {
  const ms = new Date(expiryIso).getTime() - Date.now();
  const days = ms / 86400000;
  if (days < 0) return "expired";
  if (days <= 7) return "due_soon";
  if (days <= 30) return "upcoming";
  return "ok";
}

const STATUS_META = {
  expired: { label: "Expired", ink: "#8a1f11", paper: "#f6e6e1", rule: "#c94a2f" },
  due_soon: { label: "Due soon", ink: "#8a5a06", paper: "#f8eed7", rule: "#c98a1a" },
  upcoming: { label: "Upcoming", ink: "#1f4a52", paper: "#e3eef0", rule: "#3f8a94" },
  ok: { label: "In order", ink: "#28502f", paper: "#e6ede2", rule: "#5c8a52" },
};

function useCountdown(expiryIso) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(id);
  }, []);
  const diff = new Date(expiryIso).getTime() - now;
  const past = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  return { days, hours, minutes, past };
}

function DocumentCard({ doc, onRenew, onDelete, onUpdate }) {
  const status = statusOf(doc.expiry_date);
  const meta = STATUS_META[status];
  const { days, hours, minutes, past } = useCountdown(doc.expiry_date);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: doc.title,
    document_number: doc.document_number || "",
    expiry_date: doc.expiry_date,
  });

  function saveEdit() {
    onUpdate(doc.id, form);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="doc-card" style={{ background: meta.paper, borderColor: meta.rule }}>
        <div className="doc-card__rule" style={{ background: meta.rule }} />
        <span className="doc-card__type">{DOC_TYPE_LABELS[doc.doc_type] || "Document"}</span>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          style={{ display: "block", width: "100%", margin: "0.5rem 0", padding: 6 }}
        />
        <input
          value={form.document_number}
          onChange={(e) => setForm((f) => ({ ...f, document_number: e.target.value }))}
          placeholder="Document number"
          style={{ display: "block", width: "100%", marginBottom: 6, padding: 6 }}
        />
        <input
          type="date"
          value={form.expiry_date}
          onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }}
        />
        <button className="doc-card__action" style={{ borderColor: meta.rule, color: meta.ink }} onClick={saveEdit}>
          Save
        </button>
        <button
          className="doc-card__action"
          style={{ borderColor: "#999", color: "#555", marginLeft: "0.5rem" }}
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="doc-card" style={{ background: meta.paper, borderColor: meta.rule }}>
      <div className="doc-card__rule" style={{ background: meta.rule }} />
      <div className="doc-card__top">
        <span className="doc-card__type">{DOC_TYPE_LABELS[doc.doc_type] || "Document"}</span>
        <span className="doc-card__badge" style={{ color: meta.ink, borderColor: meta.rule }}>
          {meta.label}
        </span>
      </div>

      <h3 className="doc-card__title">{doc.title}</h3>
      <p className="doc-card__number">No. {doc.document_number || "—"}</p>

      <div className="doc-card__countdown" style={{ color: meta.ink }}>
        <CountdownUnit value={days} label="days" />
        <CountdownUnit value={hours} label="hrs" />
        <CountdownUnit value={minutes} label="min" />
      </div>
      <p className="doc-card__sub">
        {past ? "expired" : "remaining"} · target {new Date(doc.expiry_date).toLocaleDateString()}
      </p>

      {!past && status !== "ok" && (
        <button className="doc-card__action" style={{ borderColor: meta.rule, color: meta.ink }} onClick={() => onRenew(doc.id)}>
          Mark renewed
        </button>
      )}
      <button
        className="doc-card__action"
        style={{ borderColor: "#3f8a94", color: "#1f4a52", marginLeft: "0.5rem" }}
        onClick={() => setEditing(true)}
      >
        Edit
      </button>
      <button
        className="doc-card__action"
        style={{ borderColor: "#999", color: "#555", marginLeft: "0.5rem" }}
        onClick={() => onDelete(doc.id)}
      >
        Delete
      </button>
    </div>
  );
}
function CountdownUnit({ value, label }) {
  return (
    <div className="doc-card__unit">
      <span className="doc-card__unit-value">{String(value).padStart(2, "0")}</span>
      <span className="doc-card__unit-label">{label}</span>
    </div>
  );
}

export default function DocumentDashboard({ token, refreshToken, onAuthChange }) {
  const [documents, setDocuments] = useState([]);
  const [loadError, setLoadError] = useState("");

  async function refreshAccessToken() {
    const res = await fetch(`${API_BASE}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) throw new Error("Session expired, please log in again");
    const data = await res.json();
    onAuthChange((prev) => ({ ...prev, access: data.access }));
    return data.access;
  }

  useEffect(() => {
    async function load() {
      try {
        let res = await fetch(`${API_BASE}/api/documents/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          const newToken = await refreshAccessToken();
          res = await fetch(`${API_BASE}/api/documents/`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        }
        const data = await res.json();
        setDocuments(data.results ?? data);
      } catch (err) {
        setLoadError("Could not load documents — the server may be waking up, refresh in a moment.");
      }
    }
    load();
  }, [token]);

  const grouped = useMemo(() => {
    const buckets = { expired: [], due_soon: [], upcoming: [], ok: [] };
    documents
      .slice()
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
      .forEach((d) => buckets[statusOf(d.expiry_date)].push(d));
    return buckets;
  }, [documents]);

  async function handleRenew(id) {
    const res = await fetch(`${API_BASE}/api/documents/${id}/mark_renewed/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this document permanently?")) return;
    const res = await fetch(`${API_BASE}/api/documents/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert("Could not delete — please try again.");
    }
  }
  async function handleUpdate(id, updates) {
  const res = await fetch(`${API_BASE}/api/documents/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (res.ok) {
    const updated = await res.json();
    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
  } else {
    alert("Could not update — please try again.");
  }
}

  const order = ["expired", "due_soon", "upcoming", "ok"];

  return (
    <div className="registry">
      <style>{CSS}</style>
      <header className="registry__header">
        <p className="registry__eyebrow">Paperwork Registry</p>
        <h1 className="registry__title">Every document, one filing cabinet.</h1>
        <p className="registry__lede">
          RC books, insurance, PUC and permits — tracked to the day so nothing lapses quietly.
        </p>
      </header>

      <NewDocumentForm token={token} onCreated={(doc) => setDocuments((prev) => [...prev, doc])} />

      {loadError && <p style={{ textAlign: "center", color: "red" }}>{loadError}</p>}

      {order.map(
        (status) =>
          grouped[status].length > 0 && (
            <section key={status} className="registry__section">
              <h2 className="registry__section-title" style={{ color: STATUS_META[status].rule }}>
                {STATUS_META[status].label}
                <span className="registry__count">{grouped[status].length}</span>
              </h2>
              <div className="registry__grid">
                {grouped[status].map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} onRenew={handleRenew} onDelete={handleDelete} onUpdate={handleUpdate} />
                ))}
              </div>
            </section>
          )
      )}
    </div>
  );
}

const CSS = `
.registry {
  min-height: 100%;
  background: #f4efe6;
  padding: 2.5rem 1.5rem 4rem;
  font-family: 'Iowan Old Style', 'Georgia', serif;
  color: #2a2420;
}
.registry__header { max-width: 42rem; margin: 0 auto 2.5rem; }
.registry__eyebrow {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.72rem;
  color: #8a6f4a;
  margin: 0 0 0.5rem;
}
.registry__title { font-size: 2rem; line-height: 1.15; margin: 0 0 0.6rem; font-weight: 600; }
.registry__lede { font-size: 1rem; color: #5b5148; margin: 0; }

.registry__section { max-width: 68rem; margin: 0 auto 2rem; }
.registry__section-title {
  display: flex; align-items: baseline; gap: 0.6rem;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  border-bottom: 1px solid currentColor;
  padding-bottom: 0.4rem;
  margin: 0 0 1rem;
}
.registry__count {
  font-family: Georgia, serif;
  color: #5b5148;
  letter-spacing: normal;
  font-size: 0.85rem;
}

.registry__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr));
  gap: 1rem;
}

.doc-card {
  position: relative;
  border: 1px solid;
  border-radius: 2px;
  padding: 1.1rem 1.1rem 1rem;
  overflow: hidden;
}
.doc-card__rule { position: absolute; top: 0; left: 0; right: 0; height: 4px; }
.doc-card__top { display: flex; justify-content: space-between; align-items: center; margin: 0.4rem 0 0.7rem; }
.doc-card__type {
  font-family: 'Courier New', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b5f52;
}
.doc-card__badge {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
}
.doc-card__title { font-size: 1.05rem; margin: 0 0 0.15rem; line-height: 1.25; }
.doc-card__number { font-family: 'Courier New', monospace; font-size: 0.75rem; color: #6b5f52; margin: 0 0 0.9rem; }

.doc-card__countdown { display: flex; gap: 1rem; margin-bottom: 0.4rem; }
.doc-card__unit { display: flex; flex-direction: column; align-items: flex-start; }
.doc-card__unit-value { font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; }
.doc-card__unit-label { font-family: 'Courier New', monospace; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.75; }

.doc-card__sub { font-size: 0.72rem; color: #6b5f52; margin: 0.2rem 0 0.8rem; }

.doc-card__action {
  font-family: 'Courier New', monospace;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: transparent;
  border: 1px solid;
  border-radius: 2px;
  padding: 0.4rem 0.7rem;
  cursor: pointer;
}
.doc-card__action:hover { background: rgba(0,0,0,0.04); }

@media (max-width: 480px) {
  .registry__title { font-size: 1.5rem; }
}
`;