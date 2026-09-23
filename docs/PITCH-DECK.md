# ALFRED — Business Plan & Pitch Deck

**Format:** Narrative slide outline (copy-paste into Keynote / Pitch / Gamma)  
**Version:** 0.1.0-draft · 2026-09-23  
**Audience:** Angels, Stellar ecosystem funds, design-partner issuers  

---

## Slide 1 — Title

**ALFRED**  
Credentials you can prove — without teaching anyone crypto.

*Credenciales que puedes probar — sin enseñarle crypto a nadie.*

Founders: _[names]_  
Stellar · Verifiable Credentials · Cloudflare · Pollar

---

## Slide 2 — The problem

1. Trust still runs on **PDFs and portal logins**.  
2. Verifiers call issuers by phone/email — slow, forgeable, siloed.  
3. Blockchain credential stacks exist, but **UX kills adoption** (extensions, seed phrases, gas anxiety).  
4. Institutions want compliance-friendly proofs; consumers want **Apple-simple** products.

**Cost of status quo:** fraud, onboarding friction, exclusion from credit/jobs/mobility.

---

## Slide 3 — Insight

> The hard part of decentralized identity is not the cryptography.  
> It’s making identity feel like a **product**, not a protocol.

ALFRED ships the protocol **and** the product surface.

---

## Slide 4 — Solution

**ALFRED** = on-chain identity + credential vaults on **Stellar/Soroban**, with:

- **Pollar** social login → embedded Stellar wallet (no seed-phrase onboarding)
- **Soroban contracts** we own and deploy via Stellar CLI (DID registry + VC vault factory)
- **Apple-like app** (calm UI, ES/EN)
- **Cloudflare** global edge deploy
- **GitBook** for transparent docs

---

## Slide 5 — Product demo storyboard

1. Continue with Apple/Google  
2. “Create my ALFRED” → DID + vault  
3. Issuer taps **Issue**  
4. Holder opens vault — credential appears  
5. Share link → verifier sees **Valid** on Stellar  

_30-second silent demo video placeholder_

---

## Slide 6 — Why Stellar

- Low fees, fast finality — fits high-volume credential events  
- Soroban smart contracts for programmable vaults  
- Growing consumer payment / onboarding rails (Pollar, USDC)  
- Clear path: testnet dogfood → mainnet issuers  

---

## Slide 7 — Why now

- VC standards matured (W3C)  
- Embedded wallets remove the #1 adoption blocker  
- Enterprises seeking portable trust post-AI deepfakes  
- ACTA-class infrastructure proved demand for Stellar VCs — ALFRED productizes it  

---

## Slide 8 — Market

| Layer | Who pays | Example |
|-------|----------|---------|
| **Issuers** (B2B) | Per credential / seat | Universities, employers, lenders |
| **Verifiers** (B2B) | Per verify / API | HR, fintech underwriting |
| **Holders** (B2C) | Free tier / premium share vault | Professionals, migrants |

**TAM framing (order-of-magnitude):** digital identity & credentialing software (multi-billion globally) → **SAM:** Stellar + LatAm/US fintech & education corridors → **SOM:** 10–50 design-partner issuers in 18 months.

_Replace with cited numbers before investor meetings._

---

## Slide 9 — Business model

| Stream | MVP | Scale |
|--------|-----|-------|
| Issuance fee | Sponsored / free on testnet | USDC per VC (factory fee) |
| Verifier API | Free quota | Usage tiers |
| Enterprise | — | SLA, private schemas, SSO |
| Premium holder | — | Encrypted backup, multi-device |

**Principle:** holders shouldn’t pay to own their identity.

---

## Slide 10 — Go-to-market

1. **Dogfood** internal + friends (testnet)  
2. **Design partners** — 3 issuers (education / employment / credit-adjacent)  
3. **Stellar ecosystem** — grants, demo days, GitBook SEO  
4. **Content** — bilingual product story (ES/EN) for LatAm + US  
5. **Open protocol docs** → developer gravity without dumping UX  

---

## Slide 11 — Competition

| | Legacy portals | Generic L1 ID | ACTA-like protocol | **ALFRED** |
|--|----------------|---------------|--------------------|------------|
| UX | Familiar | Poor | Dev-first | **Apple-like** |
| Wallet | Account login | Seed/extension | Extension | **Pollar embedded** |
| Chain | None | Various | Stellar | **Stellar** |
| Hosting | Central DB | Mixed | Mixed | **Cloudflare edge** |

We don’t win by more features — we win by **finishing the last mile to humans**.

---

## Slide 12 — Technology moat (honest)

- Not a pure crypto moat day one  
- Moat compounds via: **issuer integrations**, **brand trust**, **audit trail**, **UX craft**, **deployed contract addresses + bindings**  
- Contracts are open-compatible; product + distribution are the wedge  

---

## Slide 13 — Traction plan (pre-revenue)

| Week | Milestone |
|------|-----------|
| 3 | Contracts live on testnet |
| 6 | Public preview app |
| 8 | First design-partner issuance |
| 12 | 1,000 credentials dogfood / pilot |
| 16 | Mainnet security review kickoff |

---

## Slide 14 — Team

| Role | Who | Superpower |
|------|-----|------------|
| Product / Brand | | Apple-level taste |
| Protocol / Rust | | Soroban |
| Full-stack | | Cloudflare + Pollar |
| Advisors | | Stellar / identity / compliance |

_Add bios + LinkedIn_

---

## Slide 15 — The ask

**Raising:** _[amount]_  
**Use of funds:**

- 40% Protocol + security  
- 35% Product engineering  
- 15% Design partner success  
- 10% Legal / compliance  

**Runway target:** 18 months to mainnet issuer revenue.

---

## Slide 16 — Vision close

Identity should feel like **ALFRED**:  
quiet, precise, inevitable.

Not a wallet.  
Not a dashboard.  
**A product people trust with their proof of life.**

---

## Appendix — One-page business plan

### Mission
Make verifiable credentials as easy as signing into iCloud — settled on Stellar.

### Offer
DID + VC vault platform with issuer/verifier workflows and bilingual Apple-like UI.

### Customers
Primary: issuers who need portable, revocable credentials. Secondary: verifiers. Tertiary: holders (growth loop).

### Economics
Low variable cost (CF edge + Stellar fees sponsored early). Gross margin expands with issuance volume and API tiers.

### Risks
Sponsorship treasury, regulatory framing of “credentials,” Pollar dependency, cold-start issuers — mitigated by deferred funding, counsel, adapters, and design-partner GTM.

### 12-month outcomes
- Mainnet-ready contracts + audit  
- ≥ 5 paying/pilot issuers  
- Documented verify API  
- Brand recognized in Stellar consumer ID narrative  

---

*End of Pitch Deck v0.1*
