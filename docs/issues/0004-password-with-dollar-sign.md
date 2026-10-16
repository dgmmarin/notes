---
type: Issue
title: "0004: Login fails when the password contains $"
description: mise expands $ in unquoted .env values, so seal-auth sealed a different password than the one in .env.
tags: [bug, docs]
status: done
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-16T15:40:00Z }
---

# Problem

The login on `notes.k8s.bitulzero.ro` failed with the password from `.env`.
The password contained `$`. mise reads `.env` like a dotenv file: in an
unquoted or double-quoted value, `$NAME` is a variable, and an unknown
variable becomes empty. `seal-auth` got a 12-character value from mise
instead of the 13 characters in the file, and sealed that.

# Change

- `.env.example` and `README.md` say to put the password in single quotes.
  mise keeps single-quoted values literal.
- The login was sealed again from the quoted value.

# Verification

- A test `.env` showed `ab$cd#e!f` unquoted becomes `ab#e!f`; in single
  quotes it stays `ab$cd#e!f`.
- After quoting, the file value and the mise value have the same length (13)
  and are equal.
- With the exact text from `.env`, the site returns 200.
