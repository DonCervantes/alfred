# ALF-070 — Vertical: Education (MVP)

**Status:** Chosen for stretch C  
**Date:** 2026-09-24  

## Problem

Institutions need a lightweight way to issue and share study credentials without a custom wallet UX.

## Scope (thin)

- Route `/edu` — branded education landing + CTA into ALFRED app.
- Uses existing `EducationCredential` template (institution, program, graduatedAt).
- Mock mode (localStorage) for demos without chain; Real mode uses live ALFRED vault.
- Holder list/share/verify reused from core product (`/v/:token`).

## Non-goals

- Full SIS/LMS integrations, transcripts PDF, multi-tenant school admin.
