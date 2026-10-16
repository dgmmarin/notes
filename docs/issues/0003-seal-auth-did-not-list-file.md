---
type: Issue
title: "0003: seal-auth wrote the sealed file but did not list it"
description: The seal-auth guard matched the marker comment, so the task skipped adding basic-auth.sealed.yaml to the kustomization and the app stayed at 503.
tags: [bug, mise]
status: done
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-16T15:20:00Z }
---

# Problem

After `mise run seal-auth` and a push, `notes.k8s.bitulzero.ro` still
returned 503. `deploy/basic-auth.sealed.yaml` was in git, but
`deploy/kustomization.yaml` did not list it, so ArgoCD did not deploy it.

The task checks `grep -q 'basic-auth.sealed.yaml'` before it replaces the
marker comment. The marker comment itself contains that text, so the check
always matched and the replacement never ran.

# Change

- The guard now matches only a list entry: `^- basic-auth.sealed.yaml$`.
- `deploy/kustomization.yaml` lists `basic-auth.sealed.yaml`.

# Verification

- With the fixed guard, the first run replaces the marker. A second run
  changes nothing.
- `kubectl kustomize deploy` renders the SealedSecret.
- After ArgoCD syncs, the `basic-auth` Secret exists in namespace `notes`,
  and the site returns 401 without a login.
