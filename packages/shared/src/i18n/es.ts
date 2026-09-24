export const es = {
  "brand.name": "ALFRED",
  "brand.tagline": "Credenciales que puedes probar.",
  "cta.continue": "Continuar",
  "cta.signIn": "Entra a ALFRED",
  "cta.signOut": "Cerrar sesión",
  "home.supporting":
    "Credenciales verificables en Stellar — con calma, precisión, sin enseñarle crypto a nadie.",
  "auth.signedIn": "Sesión iniciada",
  "auth.wallet": "Tu billetera Stellar",
  "auth.deferred":
    "Billetera creada. La activación es diferida hasta que ALFRED la fondee (paso KYC / operador).",
  "auth.missingKey":
    "Agrega VITE_POLLAR_PUBLISHABLE_KEY en apps/web/.env.local para habilitar el inicio de sesión.",
  "auth.poweredBy": "Inicio de sesión seguro con Pollar",
  "auth.sheetSupporting":
    "Creamos tu billetera Stellar por ti — sin frases semilla.",
  "auth.sheetFootnote": "Continúas con Google o GitHub y regresas aquí.",
  "auth.continueGoogle": "Continuar con Google",
  "auth.continueGithub": "Continuar con GitHub",
  "auth.close": "Cancelar",
  "auth.loginError": "No se pudo iniciar sesión. Inténtalo de nuevo.",
  "auth.redirectUrisMissing":
    "Faltan redirect URIs en Pollar. En el dashboard ve a Build → Domains y agrega http://localhost:3000 (con http://).",
  "auth.activate": "Activar billetera",
  "auth.activating": "Activando…",
  "auth.activated": "Billetera activada",
  "auth.activateHint":
    "Simula aprobación KYC: ALFRED fondea tu reserva Stellar vía Pollar.",
  "auth.activateError":
    "No se pudo activar la billetera. Revisa el API y el treasury de Pollar.",
  "auth.apiOffline":
    "El API de ALFRED no responde. En otra terminal: pnpm --filter @alfred/api exec wrangler dev src/index.ts --port 8787",
  "auth.missingSecret":
    "Falta POLLAR_SECRET_KEY en apps/api/.dev.vars. Pon tu sec_testnet_ y reinicia el API.",
  "auth.walletNotFound":
    "Pollar no reconoce esta billetera. Cierra sesión, entra otra vez y activa.",
  "auth.treasuryEmpty":
    "El treasury de Pollar no tiene XLM. Fondea Account Funding en el dashboard (Treasury).",
  "auth.walletCreationFailed":
    "Pollar no pudo crear/fondear la billetera en Stellar. Revisa Treasury → Account Funding (XLM testnet) y reintenta. También puedes fondear en Users → Wallets.",
  "auth.sessionReady": "Sesión ALFRED lista",
  "onboard.title": "Crea tu ALFRED",
  "onboard.supporting":
    "Registramos tu identidad (DID) y desplegamos tu vault de credenciales en Stellar testnet.",
  "onboard.stepDid": "Registrar DID on-chain",
  "onboard.stepVault": "Desplegar vault personal",
  "onboard.cta": "Crear mi ALFRED",
  "onboard.working": "Firmando con Pollar…",
  "onboard.done": "Listo. Tu identidad y vault están activos.",
  "onboard.error": "No se pudo completar el alta. Reintenta.",
  "onboard.pollarAuthPolicy":
    "Pollar rechazó la firma Soroban. En el dashboard: Treasury → Auth Policy, permite alfred-did-registry.register y alfred-vc-vault-factory.deploy.",
  "onboard.profileDid": "DID",
  "onboard.profileVault": "Vault",
} as const;
