# ALFRED Whitepaper

**Subtitle:** A product-grade protocol for Decentralized Identifiers and Verifiable Credentials on Stellar  

**Version:** 0.1.0-draft  
**Date:** 2026-09-23  
**Status:** Informal technical + product whitepaper (not a securities offering)  
**Languages:** English body · Spanish executive summary  

---

## Resumen ejecutivo (ES)

**ALFRED** es infraestructura de identidad descentralizada y **credenciales verificables (VCs)** sobre **Stellar/Soroban**. Combina:

1. Contratos inteligentes propios (registro DID + vaults de VCs por usuario), desplegados con el **CLI de Stellar**.  
2. Onboarding humano con **Pollar** (login social + wallet embebida).  
3. Una aplicación con lenguaje de producto **tipo Apple**, bilingüe ES/EN.  
4. Despliegue global en **Cloudflare**.  
5. Documentación pública en **GitBook**.

A diferencia de stacks solo para desarrolladores, ALFRED trata la experiencia del holder como requisito de protocolo: si la gente no puede entrar, el ledger no importa.

**Principio de privacidad:** en cadena solo viven identificadores, estados y **hashes**; los datos personales van cifrados fuera de cadena.

---

## Abstract (EN)

ALFRED is a Stellar-native identity and Verifiable Credential system designed as a **consumer product**, not merely a smart-contract toolkit. It provides an on-chain `did:stellar` registry, a factory for per-holder credential vaults, and an application layer that onboards users through Pollar’s embedded wallets. Status of credentials is publicly verifiable on Soroban; sensitive claims remain encrypted off-chain. This paper specifies goals, architecture, trust model, economic sketch, and roadmap.

---

## 1. Motivation

Digital society still authenticates people with screenshots, email forwards, and siloed issuer portals. Cryptographic Verifiable Credentials solve integrity and issuer authenticity — but most deployments fail the **adoption test**:

- Seed phrases and browser extensions exclude mainstream users.  
- Gas and network jargon create anxiety.  
- UIs resemble block explorers, not trusted consumer software.  

Meanwhile, Stellar offers low-cost settlement and mature Soroban smart contracts. Projects such as ACTA demonstrated viable on-chain registries and VC vaults. ALFRED builds on that **capability class** while optimizing for **product completion**: login, sponsorship, edge hosting, bilingual UX, and documentation.

---

## 2. Design goals

| ID | Goal |
|----|------|
| G1 | Holders obtain a Stellar identity without learning crypto primitives |
| G2 | Each holder controls a dedicated vault contract instance |
| G3 | Credential **validity/revocation** is authoritative on-chain |
| G4 | Claim **confidentiality** by default (hash on-chain, ciphertext off-chain) |
| G5 | Issuers and verifiers complete core jobs in minutes |
| G6 | Deployments are reproducible via Stellar CLI + Cloudflare CI |
| G7 | Interface copy ships in Spanish and English |

### Non-goals (v1)

- Multi-chain DIDs  
- Full Linked Data proof cryptosuite matrix on day one  
- On-chain storage of raw PII  
- Governance token  

---

## 3. Roles

Aligned with W3C VC Data Model:

- **Holder** — subject who possesses credentials in their vault.  
- **Issuer** — party that creates and may revoke credentials.  
- **Verifier** — party that checks proofs/status.  
- **Operator** — ALFRED deployers maintaining contracts, sponsorship, and edge API.  

Pollar provides **account abstraction UX** (social login → Stellar account) but does not replace on-chain authority for DID/VC state.

---

## 4. Architecture

### 4.1 Layers

1. **Presentation** — React app (Apple-like), i18n ES/EN, Cloudflare Pages.  
2. **Edge API** — Cloudflare Workers: sessions, encrypted payload store, transaction preparation.  
3. **Onboarding** — Pollar SDK/Server: auth, embedded wallet, optional fee-bump sponsorship.  
4. **Ledger** — Soroban contracts on Stellar (testnet → mainnet).  
5. **Docs** — GitBook (protocol + product).  

### 4.2 On-chain components

#### DID Registry
Stores authoritative DID records for `did:stellar` identifiers: controller, document fields / pointers, version, active flag. Supports register, update (optimistic concurrency), transfer, deactivate, and read.

#### VC Vault Factory
Deploys **single-tenant** vaults keyed by `(owner, salt)`, tracks `is_vault`, and may quote issuance fees (disabled or zero on early testnet).

#### VC Vault
Per-holder contract exposing issue, revoke, get, list, verify, and issuer policy hooks. Each credential entry includes identifiers, issuer, timestamps, status, and `content_hash` (and optional URI).

### 4.3 Off-chain components

- **D1** — user profile, credential metadata index.  
- **R2** — AES-GCM encrypted credential payloads.  
- **KV** — short-lived sessions / rate-limit counters.  
- **Presentation tokens** — time-boxed share links for verifiers.  

### 4.4 Data minimization

```
On-chain:  vc_id, status, issuer, hashes, timestamps
Off-chain: encrypted claims JSON, UX fields, locale
Never:     plaintext national IDs on-chain
```

---

## 5. Protocol flows

### 5.1 Activation

User authenticates with Pollar → ALFRED session binds `pollar_user_id` to `stellar_address` → user signs `did-registry.register` → user signs `factory.deploy` → profile stores DID + vault address.

### 5.2 Issuance

Issuer submits claims to Workers → canonicalize → `content_hash` → encrypt to R2 → prepare `vault.issue` → issuer signs → network confirms → index updated.

### 5.3 Verification

Verifier opens `/v/:token` or queries API → Worker reads vault `verify_vc` / `get_vc` → returns status (+ optional authorized claims). No verifier account required for public status checks.

### 5.4 Revocation

Authorized party submits `revoke` → on-chain status flips → subsequent verifies fail closed for “valid”.

---

## 6. Trust model & security

| Asset | Threat | Control |
|-------|--------|---------|
| Session | Theft | HttpOnly cookies, short TTL, rotation |
| VC payload | Breach of R2 | Envelope encryption; key in CF Secrets |
| Malicious issuer | Spam credentials | Denylist; future allowlists; rate limits |
| Phishing verify pages | Fake UI | Canonical domain; clear Valid/Revoked language |
| Sponsorship drain | Griefing txs | Pollar policies; monitoring; deferred funding |
| Key compromise (deployer) | Contract admin abuse | Multisig / hardware; nominate-accept admin |

**Honesty clause:** ALFRED does not claim anonymity. Metadata leakage via chain analysis is possible; users should treat public status as public.

Security reviews and third-party audits are **mandatory before mainnet** handling real-world sensitive credentials.

---

## 7. Economics (sketch)

Early networks subsidize activation (reserves, fees) via operator sponsorship (Pollar funding modes). Sustainable model:

- Issuers pay per credential or subscription.  
- Verifiers pay for elevated API SLA.  
- Holders free for core ownership.  

On-chain factory fees (e.g., USDC) can enforce metering without ALFRED running a payment processor — complementary to SaaS billing.

This whitepaper does **not** propose a token.

---

## 8. Compliance notes

Credentials can be regulated by sector (education, health, credit). ALFRED provides **tools**, not legal determinations of credential meaning. Implementers must:

- Avoid unlawful collection of sensitive data.  
- Prefer salted hashes / selective disclosure strategies as the product matures.  
- Publish Privacy Policy & Terms before public mainnet.  

---

## 9. Comparison

ALFRED is **protocol-compatible in spirit** with Stellar VC vault designs (e.g., ACTA-class systems) while specifying a different product boundary: Pollar login, Cloudflare edge, Apple-like UX, GitBook docs, and bilingual defaults. Interoperability with external wallets remains a roadmap item via adapters.

---

## 10. Roadmap

| Phase | Outcome |
|-------|---------|
| 0 | Specs, accounts, empty deploys |
| 1 | Contracts on testnet via Stellar CLI |
| 2 | Workers API + Pollar sessions |
| 3 | Consumer UI ES/EN |
| 4 | GitBook + hardening |
| 5 | Design partners → mainnet readiness |

---

## 11. Conclusion

Decentralized credentials only matter if ordinary people complete the funnel. ALFRED asserts that **wallet abstraction, edge delivery, and product design** are first-class protocol concerns — alongside Soroban contracts deployed with engineering discipline through the Stellar CLI.

Quiet software. Public verification. Stellar settlement.

---

## References

1. W3C Verifiable Credentials Data Model  
2. Stellar Soroban documentation  
3. Pollar documentation — https://docs.pollar.xyz  
4. ACTA-Team public repositories (prior art / inspiration)  
5. ALFRED Master Spec v0.1 — `docs/ALFRED-MASTER-SPEC.md`  

---

## Disclaimer

This document is for informational purposes only. It is not legal, financial, or investment advice. Features described may change. No offer of securities or tokens is made herein.

---

*End of ALFRED Whitepaper v0.1.0-draft*
