import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../i18n/LocaleProvider";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787";
const MOCK_KEY = "alfred-edu-mock";

type MockCred = {
  id: string;
  institution: string;
  program: string;
  graduatedAt: string;
  status: "valid" | "revoked";
};

function loadMock(): MockCred[] {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    return raw ? (JSON.parse(raw) as MockCred[]) : [];
  } catch {
    return [];
  }
}

function saveMock(rows: MockCred[]) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
}

export function EducationAppPage() {
  const { tr } = useLocale();
  const [mockMode, setMockMode] = useState(true);
  const [rows, setRows] = useState<MockCred[]>([]);
  const [institution, setInstitution] = useState("");
  const [program, setProgram] = useState("");
  const [graduatedAt, setGraduatedAt] = useState("");
  const [liveHint, setLiveHint] = useState<string | null>(null);

  useEffect(() => {
    setRows(loadMock());
  }, []);

  function addMock() {
    if (!institution.trim() || !program.trim()) return;
    const next: MockCred[] = [
      {
        id: crypto.randomUUID(),
        institution: institution.trim(),
        program: program.trim(),
        graduatedAt: graduatedAt || new Date().toISOString().slice(0, 10),
        status: "valid",
      },
      ...rows,
    ];
    setRows(next);
    saveMock(next);
    setInstitution("");
    setProgram("");
    setGraduatedAt("");
  }

  async function checkLive() {
    setLiveHint(null);
    try {
      const res = await fetch(`${API_URL}/api/credentials/templates`, {
        credentials: "include",
      });
      if (res.status === 401) {
        setLiveHint(tr("edu.needSignIn"));
        return;
      }
      const data = (await res.json()) as { ok?: boolean };
      setLiveHint(
        data.ok ? tr("edu.liveReady") : tr("edu.liveError"),
      );
    } catch {
      setLiveHint(tr("edu.liveError"));
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-10">
      <div className="flex items-center justify-between">
        <Link to="/edu" className="text-sm text-[var(--accent)]">
          ← {tr("edu.badge")}
        </Link>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={mockMode}
            onChange={(e) => setMockMode(e.target.checked)}
          />
          {tr("edu.mockMode")}
        </label>
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text)]">
        {tr("edu.appTitle")}
      </h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {mockMode ? tr("edu.mockHint") : tr("edu.realHint")}
      </p>

      {mockMode ? (
        <div className="mt-8 space-y-3 rounded-[var(--radius)] bg-[var(--surface)] p-5 ring-1 ring-black/5">
          <input
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder={tr("vault.tpl.field.institution")}
            className="w-full rounded-[var(--radius)] border border-black/10 px-3 py-2 text-sm"
          />
          <input
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder={tr("vault.tpl.field.program")}
            className="w-full rounded-[var(--radius)] border border-black/10 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={graduatedAt}
            onChange={(e) => setGraduatedAt(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-black/10 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addMock}
            className="w-full rounded-[var(--radius)] bg-[var(--accent)] py-3 text-sm font-medium text-white"
          >
            {tr("edu.addMock")}
          </button>
          <ul className="mt-4 space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="border-t border-black/5 pt-2 text-sm">
                <p className="font-medium text-[var(--text)]">
                  {r.program} · {r.status}
                </p>
                <p className="text-[var(--text-secondary)]">{r.institution}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-8 space-y-3 rounded-[var(--radius)] bg-[var(--surface)] p-5 ring-1 ring-black/5">
          <p className="text-sm text-[var(--text-secondary)]">
            {tr("edu.realSteps")}
          </p>
          <Link
            to="/"
            className="inline-flex rounded-[var(--radius)] bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white"
          >
            {tr("edu.openAlfred")}
          </Link>
          <button
            type="button"
            onClick={() => void checkLive()}
            className="ml-2 text-sm text-[var(--accent)] underline"
          >
            {tr("edu.checkSession")}
          </button>
          {liveHint ? (
            <p className="text-sm text-[var(--text)]" role="status">
              {liveHint}
            </p>
          ) : null}
        </div>
      )}
    </main>
  );
}
