import { PollarProvider } from "@pollar/react";
import type { ReactNode } from "react";

const apiKey = import.meta.env.VITE_POLLAR_PUBLISHABLE_KEY;

if (!apiKey) {
  console.warn(
    "[ALFRED] Missing VITE_POLLAR_PUBLISHABLE_KEY in apps/web/.env.local",
  );
}

export function AlfredPollarProvider({ children }: { children: ReactNode }) {
  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <PollarProvider
      client={{
        apiKey,
        stellarNetwork: "testnet",
      }}
    >
      {children}
    </PollarProvider>
  );
}
