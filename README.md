# notes

A small app that stores notes as Kubernetes objects. The cluster's etcd is
the database.

```
browser ──▶ ingress-nginx (HTTPS + login) ──▶ frontend ──/api──▶ api ──▶ Kubernetes API
                                              React + nginx      Node      Note CRD objects
```

- `api/`: a Node app with no npm dependencies. It reads and writes `Note`
  objects (`demo.example.com/v1`) with its ServiceAccount token. A Role in
  `deploy/rbac.yaml` allows it to change only `Note` objects in its namespace.
- `frontend/`: a React app served by unprivileged nginx. nginx sends
  `/api/*` to the `api` Service.
- `deploy/`: kustomize manifests that ArgoCD deploys into namespace `notes`.

## How it is deployed

The cluster is managed by
[dgmmarin/k8s.cluster](https://github.com/dgmmarin/k8s.cluster). That repo
holds two files for this app:

- `projects/notes.yaml` registers this repo. ArgoCD deploys `deploy/` from
  `main` into namespace `notes`.
- `platform/notes-crd/` installs the `Note` CRD. Projects cannot create
  cluster-scoped resources.

On each push to `main` that changes `api/` or `frontend/`, the `images`
workflow does three things:

1. It builds both images.
2. It pushes them to `ghcr.io/dgmmarin/notes-api` and
   `ghcr.io/dgmmarin/notes-frontend`.
3. It commits the new tag into `deploy/kustomization.yaml`.

ArgoCD then deploys that commit. The app runs at
`https://notes.k8s.bitulzero.ro`.

## First-time setup

1. After the first workflow run, open both packages on GitHub and set their
   visibility to public, so the node can pull them without a login.
2. Copy `.env.example` to `.env`, then set `NOTES_USER` and `NOTES_PASSWORD`.
3. Run `KUBECONFIG=../k8s.cluster/kubeconfig mise run seal-auth`. It encrypts
   the login against the cluster's sealed-secrets key and lists the file in
   `deploy/kustomization.yaml`. Commit and push both files. Until you do,
   nginx refuses every request with 503.
4. The Ingress uses `letsencrypt-staging`. When the staging certificate
   works, change `deploy/ingress.yaml` to `letsencrypt-prod`.

## Local development

```bash
cd frontend && npm install && npm run dev   # Vite proxies /api to localhost:5000
```

The API needs a cluster: it reads its ServiceAccount files at start. Use the
platform's local k3d cluster (`mise run local-up` in k8s.cluster).

The CI workflow builds amd64 images only.
