import { useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Props = {
  onHashReady?: (hash: string, fileName: string) => void;
};

/** ALF-080–082: client hash + optional verify against a known commitment. */
export function DocumentSealPanel({ onHashReady }: Props) {
  const { tr } = useLocale();
  const [hash, setHash] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [expected, setExpected] = useState("");
  const [match, setMatch] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setMatch(null);
    try {
      const h = await sha256Hex(file);
      setHash(h);
      setFileName(file.name);
      onHashReady?.(h, file.name);
    } finally {
      setBusy(false);
    }
  }

  function verify() {
    if (!hash || !expected.trim()) return;
    setMatch(hash === expected.trim().toLowerCase());
  }

  return (
    <div className="w-full max-w-md rounded-[var(--radius)] bg-[var(--surface)] px-5 py-5 text-left shadow-sm ring-1 ring-black/5">
      <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
        {tr("seal.title")}
      </p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {tr("seal.supporting")}
      </p>

      <label className="mt-4 block text-xs text-[var(--text-secondary)]">
        {tr("seal.file")}
        <input
          type="file"
          className="mt-1 block w-full text-sm"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {busy ? (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {tr("seal.hashing")}
        </p>
      ) : null}

      {hash ? (
        <div className="mt-3">
          <p className="text-xs text-[var(--text-secondary)]">
            {fileName} · SHA-256
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-[var(--text)]">
            {hash}
          </p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            {tr("seal.issueHint")}
          </p>
        </div>
      ) : null}

      <label className="mt-4 block text-xs text-[var(--text-secondary)]">
        {tr("seal.expected")}
        <input
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 font-mono text-xs"
          placeholder="documentHash…"
        />
      </label>
      <button
        type="button"
        onClick={verify}
        disabled={!hash || !expected.trim()}
        className="mt-3 w-full rounded-[var(--radius)] bg-[var(--text)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {tr("seal.verify")}
      </button>
      {match === true ? (
        <p className="mt-2 text-sm text-[var(--success)]">{tr("seal.match")}</p>
      ) : null}
      {match === false ? (
        <p className="mt-2 text-sm text-[var(--danger)]">{tr("seal.mismatch")}</p>
      ) : null}
      <p className="mt-4 text-[11px] text-[var(--text-secondary)]">
        {tr("seal.signNote")}
      </p>
    </div>
  );
}
