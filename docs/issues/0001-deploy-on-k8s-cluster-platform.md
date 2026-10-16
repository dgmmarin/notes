---
type: Issue
title: "0001: Deploy the notes app on the k8s.cluster platform"
description: Move the notes app into its own repo and deploy it as a k8s.cluster project with ArgoCD, ghcr.io images, and a sealed login.
tags: [deploy, argocd, ci, feature]
status: done
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-16T13:00:00Z }
---

# Problem

The notes app was a local kind demo with images loaded by hand. The platform
repo (dgmmarin/k8s.cluster) deploys each project from its own repo.

# Change

- The repo layout is `api/`, `frontend/`, and `deploy/` (kustomize).
- `deploy/` has no namespace in its manifests. The platform ApplicationSet
  sets it to `notes`. The `Note` CRD moved to the platform repo, because
  project apps cannot create cluster-scoped resources.
- Pods follow the platform's `securityContext`: non-root, read-only root
  filesystem, and no capabilities. The frontend now uses
  `nginxinc/nginx-unprivileged` on port 8080.
- The Ingress uses `ingressClassName: nginx`, `letsencrypt-staging`, and
  basic auth from the `basic-auth` Secret.
- `mise run seal-auth` writes `deploy/basic-auth.sealed.yaml` and lists it
  in the kustomization.
- `.github/workflows/images.yml` builds and pushes the images to ghcr.io and
  commits the new tag.

# Verification

The test used a k3s v1.36.5 container with Traefik disabled and ingress-nginx
controller v1.15.1. It applied the CRD and the rendered `deploy/` with
local images. The results:

- Both pods run with the hardened `securityContext`.
- With no `basic-auth` Secret, nginx returns 503 for every request.
- With the Secret, no login or a wrong login gives 401, and the correct
  login gives 200. HTTP redirects to HTTPS (308).
- `POST /api/notes` through the Ingress creates a `Note` object.
- The real `kustomize edit set image` (CI step) and the seal-auth `sed` work
  in either order, and the result renders.

Not tested: the GitHub Actions run, ghcr.io visibility, `kubeseal` against
the real cluster, and Let's Encrypt.
