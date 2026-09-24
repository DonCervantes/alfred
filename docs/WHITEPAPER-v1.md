# ALFRED — Whitepaper v1 (ALF-054)

**Version:** 1.0 · **Date:** 2026-09-24  

## Abstract

ALFRED is infrastructure for decentralized identity and Verifiable Credentials on Stellar/Soroban with a product UX (not an explorer UX). Users authenticate via Pollar (social → G-account), register a `did:stellar`, deploy a personal VC vault, and issue/share/revoke credentials with encrypted off-chain payloads and on-chain hashes.

## Architecture

- **Web:** Vite/React on Cloudflare Pages  
- **API:** Hono Worker + D1 + optional R2 blobs  
- **Chain:** DID registry + per-holder vault (factory) on Stellar testnet  
- **Auth:** Pollar custodial signing; ALFRED HttpOnly session cookie  

## Trust model

Operators fund deferred activation; Auth Policy gates Soroban methods. Presentation links are time-bound. Issuance may be restricted by org allowlist (admin/issuer/viewer). Document sealing commits SHA-256 via credential claims.

## Status

MVP A (DID + Vault VC) shipped and dogfooded on testnet. Stretch B/C/D delivered as thin product surfaces (templates, issuer dashboard, education `/edu`, document seal).

Full threat notes: `docs/THREAT-MODEL.md`.
