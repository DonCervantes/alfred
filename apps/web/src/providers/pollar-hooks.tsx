import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePollar as usePollarSdk } from "@pollar/react";

/** Minimal surface HomePage / vault need from Pollar. */
export type AlfredPollarApi = {
  isAuthenticated: boolean;
  verified: boolean;
  wallet: { address: string } | null;
  login: (opts: { provider: "google" | "github" }) => void;
  logout: () => void;
  refreshWalletBalance: () => Promise<void>;
  signAndSubmitTx: (xdr: string) => Promise<unknown>;
};

const AlfredPollarContext = createContext<AlfredPollarApi | null>(null);

export function isE2eMock(): boolean {
  return import.meta.env.VITE_E2E_MOCK === "1";
}

const E2E_WALLET = "GTESTE2EWALLET000000000000000000000000000000000000000";

export function E2ePollarProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);

  const login = useCallback((_opts: { provider: "google" | "github" }) => {
    setSignedIn(true);
  }, []);

  const logout = useCallback(() => {
    setSignedIn(false);
  }, []);

  const value = useMemo<AlfredPollarApi>(
    () => ({
      isAuthenticated: signedIn,
      verified: signedIn,
      wallet: signedIn ? { address: E2E_WALLET } : null,
      login,
      logout,
      refreshWalletBalance: async () => {},
      signAndSubmitTx: async () => ({ status: "success", hash: "e2e-mock" }),
    }),
    [signedIn, login, logout],
  );

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
      signAndSubmitTx: (xdr: string) => p.signAndSubmitTx(xdr),
    }),
    [
      p.isAuthenticated,
      p.verified,
      p.wallet?.address,
      login,
      logout,
      refreshWalletBalance,
      p.signAndSubmitTx,
    ],
  );
  return (
    <AlfredPollarContext.Provider value={value}>
      {children}
    </AlfredPollarContext.Provider>
  );
}

export function useAlfredPollar(): AlfredPollarApi {
  const ctx = useContext(AlfredPollarContext);
  if (!ctx) {
    throw new Error("useAlfredPollar must be used within AlfredPollarProvider");
  }
  return ctx;
}
