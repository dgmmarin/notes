import { useEffect, useState } from "react";

// All requests are relative — nginx proxies /api/* to the api Service.
const api = {
  list: () => fetch("/api/notes").then((r) => r.json()),
  create: (note) =>
    fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    }).then((r) => r.json()),
  remove: (name) => fetch(`/api/notes/${name}`, { method: "DELETE" }),
};

export default function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setNotes(await api.list());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addNote(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await api.create({ title, content });
    if (res.error) return setError(res.error);
    setTitle("");
    setContent("");
    refresh();
  }

  async function deleteNote(name) {
    await api.remove(name);
    refresh();
  }

  return (
    <main style={S.page}>
      <header style={S.header}>
        <h1 style={S.h1}>📝 Notes</h1>
        <p style={S.sub}>
          Each note is a <code style={S.code}>Note</code> custom resource
          (CRD) stored in the cluster's Kubernetes API.
        </p>
      </header>

      <form onSubmit={addNote} style={S.form}>
        <input
          style={S.input}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          style={{ ...S.input, minHeight: 60, resize: "vertical" }}
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button style={S.button} type="submit">
          Add note
        </button>
      </form>

      {error && <div style={S.error}>⚠ {error}</div>}
      {loading ? (
        <p style={S.muted}>Loading…</p>
      ) : notes.length === 0 ? (
        <p style={S.muted}>No notes yet — add one above.</p>
      ) : (
        <ul style={S.list}>
          {notes.map((n) => (
            <li key={n.name} style={S.card}>
              <div style={{ flex: 1 }}>
                <strong>{n.title}</strong>
                {n.content && <p style={S.content}>{n.content}</p>}
                <code style={S.name}>{n.name}</code>
              </div>
              <button style={S.del} onClick={() => deleteNote(n.name)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const S = {
  page: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "2rem 1rem",
    fontFamily: "system-ui, sans-serif",
    color: "#1a1a2e",
  },
  header: { marginBottom: "1.5rem" },
  h1: { margin: 0, fontSize: "2rem" },
  sub: { color: "#555", marginTop: 4 },
  code: { background: "#eef", padding: "1px 5px", borderRadius: 4 },
  form: { display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" },
  input: {
    padding: "0.6rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontFamily: "inherit",
  },
  button: {
    padding: "0.6rem",
    fontSize: "1rem",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  list: { listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 },
  card: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "0.9rem",
    border: "1px solid #e2e2ef",
    borderRadius: 8,
    background: "#fafaff",
  },
  content: { margin: "4px 0", color: "#333", whiteSpace: "pre-wrap" },
  name: { fontSize: "0.75rem", color: "#888" },
  del: {
    border: "none",
    background: "transparent",
    color: "#c00",
    fontSize: "1.1rem",
    cursor: "pointer",
  },
  error: { background: "#fee", color: "#900", padding: "0.6rem", borderRadius: 6, marginBottom: 12 },
  muted: { color: "#888" },
};
