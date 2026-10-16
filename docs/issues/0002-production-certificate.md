---
type: Issue
title: "0002: Use the Let's Encrypt production certificate"
description: Switch the notes Ingress from letsencrypt-staging to letsencrypt-prod after the staging certificate was issued.
tags: [tls, chore]
status: done
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-16T15:00:00Z }
---

# Change

The staging certificate for `notes.k8s.bitulzero.ro` was issued on the
netcup cluster, so `deploy/ingress.yaml` now uses `letsencrypt-prod`.

# Verification

After ArgoCD syncs, the certificate issuer is "Let's Encrypt" without
"(STAGING)", and `curl https://notes.k8s.bitulzero.ro/` succeeds without `-k`.
