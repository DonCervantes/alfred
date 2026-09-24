import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePollar as usePollarSdk } from "@pollar/react";

/** Minimal surface HomePage needs from Pollar. */
export type AlfredPollarApi = {
  isAuthenticated: boolean;
  verified: boolean;
  wallet: { address: string } | null;
  login: (opts: { provider: "google" | "github" }) => void;
  logout: () => void;
  refreshWalletBalance: () => Promise<void>;
};

const AlfredPollarContext = createContext<AlfredPollarApi | null>(null);

export function isE2eMock(): boolean {
  return import.meta.env.VITE_E2E_MOCK === "1";
}

const e2eStub: AlfredPollarApi = {
  isAuthenticated: false,
  verified: false,
  wallet: null,
  login: () => {
    /* smoke: no OAuth */
  },
  logout: () => {},
  refreshWalletBalance: async () => {},
};

export function E2ePollarProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => e2eStub, []);
  return (
    <AlfredPollarContext.Provider value={value}>
      {children}
    </AlfredPollarContext.Provider>
  );
}

/** Must sit under PollarProvider. */
export function LivePollarBridge({ children }: { children: ReactNode }) {
  const p = usePollarSdk();
  const login = useCallback(
    (opts: { provider: "google" | "github" }) => p.login(opts),
    [p],
  );
  const logout = useCallback(() => p.logout(), [p]);
  const refreshWalletBalance = useCallback(
    () => p.refreshWalletBalance(),
    [p],
  );
  const value = useMemo<AlfredPollarApi>(
    () => ({
      isAuthenticated: p.isAuthenticated,
      verified: p.verified,
      wallet: p.wallet?.address ? { address: p.wallet.address } : null,
      login,
      logout,
      refreshWalletBalance,
    }),
    [
      p.isAuthenticated,
      p.verified,
      p.wallet?.address,
      login,
      logout,
      refreshWalletBalance,
    ],
  );
  return (
    <AlfredPollarContext.Provider value={value}>
      {children}
    </AlfredPollarContext.Provider>
  );
}

/** Prefer this over `@pollar/react` so Playwright can stub auth. */
export function useAlfredPollar(): AlfredPollarApi {
  const ctx = useContext(AlfredPollarContext);
  if (!ctx) {
    throw new Error("useAlfredPollar must be used within AlfredPollarProvider");
  }
  return ctx;
}
