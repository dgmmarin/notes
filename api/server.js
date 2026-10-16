// Tiny zero-dependency API.
// It stores data as `Note` custom resources (a CRD) in the Kubernetes API.
// In other words: the cluster's etcd IS our database, accessed through the
// mounted ServiceAccount token + RBAC. No external DB, no npm packages.

const http = require("http");
const fs = require("fs");

const SA = "/var/run/secrets/kubernetes.io/serviceaccount";
const API = "https://kubernetes.default.svc";
const GROUP = "demo.example.com";
const VERSION = "v1";
const PLURAL = "notes";

// Namespace + CA are stable for the pod's life; the token is re-read per
// request because Kubernetes rotates projected tokens periodically.
const NAMESPACE = fs.readFileSync(`${SA}/namespace`, "utf8").trim();
const readToken = () => fs.readFileSync(`${SA}/token`, "utf8").trim();
// Node verifies the API server's TLS cert against the cluster CA that we
// point at via NODE_EXTRA_CA_CERTS (see the Deployment manifest).

const collectionUrl = `${API}/apis/${GROUP}/${VERSION}/namespaces/${NAMESPACE}/${PLURAL}`;

async function k8s(method, path = "", body) {
  const res = await fetch(collectionUrl + path, {
    method,
    headers: {
      Authorization: `Bearer ${readToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(data.message || `k8s ${method} failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Map a raw Note custom resource down to the shape the frontend cares about.
const toNote = (item) => ({
  name: item.metadata.name,
  title: item.spec?.title ?? "",
  content: item.spec?.content ?? "",
  createdAt: item.metadata.creationTimestamp,
});

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    // Same-origin in the cluster (nginx proxies /api), but permissive CORS
    // makes it easy to poke the API directly via `kubectl port-forward`.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1e6) reject(new Error("body too large"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const method = req.method;

  try {
    if (method === "OPTIONS") return send(res, 204, {});

    // Liveness/readiness probe target.
    if (path === "/healthz") return send(res, 200, { ok: true });

    if (path === "/api/notes" && method === "GET") {
      const list = await k8s("GET");
      return send(res, 200, (list.items || []).map(toNote));
    }

    if (path === "/api/notes" && method === "POST") {
      const { title, content } = await readJsonBody(req);
      if (!title || !String(title).trim()) {
        return send(res, 400, { error: "title is required" });
      }
      const created = await k8s("POST", "", {
        apiVersion: `${GROUP}/${VERSION}`,
        kind: "Note",
        metadata: { generateName: "note-" }, // let k8s assign a unique name
        spec: { title: String(title), content: String(content ?? "") },
      });
      return send(res, 201, toNote(created));
    }

    // DELETE /api/notes/<name>
    const del = path.match(/^\/api\/notes\/([a-z0-9-]+)$/);
    if (del && method === "DELETE") {
      await k8s("DELETE", `/${del[1]}`);
      return send(res, 200, { deleted: del[1] });
    }

    return send(res, 404, { error: "not found" });
  } catch (err) {
    console.error(`${method} ${path} ->`, err.status || 500, err.message);
    return send(res, err.status || 500, { error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`api listening on :${PORT}`);
  console.log(`storing Notes in namespace "${NAMESPACE}" via ${GROUP}/${VERSION}`);
});
