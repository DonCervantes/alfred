import { PollarProvider } from "@pollar/react";
import type { ReactNode } from "react";
import {
  E2ePollarProvider,
  LivePollarBridge,
  isE2eMock,
} from "./pollar-hooks";

const apiKey = import.meta.env.VITE_POLLAR_PUBLISHABLE_KEY;

if (!apiKey && !isE2eMock()) {
  console.warn(
    "[ALFRED] Missing VITE_POLLAR_PUBLISHABLE_KEY in apps/web/.env.local",
  );
}

export function AlfredPollarProvider({ children }: { children: ReactNode }) {
  if (isE2eMock()) {
    return <E2ePollarProvider>{children}</E2ePollarProvider>;
  }

  if (!apiKey) {
    return <>{children}</>;
  }

  const oauthRedirectUri =
    typeof window !== "undefined" ? window.location.origin : undefined;

  return (
    <PollarProvider
      client={{
        apiKey,
        stellarNetwork: "testnet",
        ...(oauthRedirectUri ? { oauthRedirectUri } : {}),
      }}
    >
      <LivePollarBridge>{children}</LivePollarBridge>
    </PollarProvider>
  );
}
