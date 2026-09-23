export const en = {
  "brand.name": "ALFRED",
  "brand.tagline": "Credentials you can prove.",
  "cta.continue": "Continue",
  "cta.signIn": "Sign in to ALFRED",
  "cta.signOut": "Sign out",
  "home.supporting":
    "Verifiable credentials on Stellar — calm, precise, without teaching anyone crypto.",
  "auth.signedIn": "Signed in",
  "auth.wallet": "Your Stellar wallet",
  "auth.deferred":
    "Wallet created. Activation is deferred until ALFRED funds it (KYC / operator step).",
  "auth.missingKey":
    "Add VITE_POLLAR_PUBLISHABLE_KEY to apps/web/.env.local to enable sign-in.",
  "auth.poweredBy": "Secure sign-in via Pollar",
  "auth.sheetSupporting":
    "We create your Stellar wallet for you — no seed phrases.",
  "auth.sheetFootnote": "You’ll continue with Google or GitHub, then return here.",
  "auth.continueGoogle": "Continue with Google",
  "auth.continueGithub": "Continue with GitHub",
  "auth.close": "Cancel",
  "auth.loginError": "Sign-in didn’t complete. Try again.",
  "auth.redirectUrisMissing":
    "Pollar is missing redirect URIs. In the dashboard go to Build → Domains and add http://localhost:3000 (with http://).",
  "auth.activate": "Activate wallet",
  "auth.activating": "Activating…",
  "auth.activated": "Wallet activated",
  "auth.activateHint":
    "Simulates KYC approval: ALFRED funds your Stellar reserve via Pollar.",
  "auth.activateError": "Could not activate the wallet. Check the API and Pollar treasury.",
  "auth.apiOffline":
    "ALFRED API is offline. In another terminal run: pnpm --filter @alfred/api exec wrangler dev src/index.ts --port 8787",
} as const;
