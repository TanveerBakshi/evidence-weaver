import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { analyze, fetchDocuments } from "../lib/api";
import { analysisStore } from "../lib/analysis-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pleading-to-Proof — Witness Statement Analysis" },
      {
        name: "description",
        content:
          "AI-powered witness statement evidence analysis for the Post Office Horizon IT Inquiry.",
      },
    ],
  }),
  component: UploadPage,
});

function extractName(filename: string): string {
  const m = filename.match(/WITN\d+\s*-\s*([^-]+?)\s*-/i);
  if (m) return m[1].trim();
  return filename.replace(/\.pdf$/i, "");
}

function UploadPage() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<string[] | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [primary, setPrimary] = useState<string>("");
  const [comparisons, setComparisons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments()
      .then((r) => setDocs(r.documents))
      .catch((e) =>
        setDocError(
          e instanceof TypeError
            ? "Backend not running — check port 8000"
            : (e as Error).message,
        ),
      );
  }, []);

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  const filteredDocs = useMemo(
    () => (docs ?? []).filter((d) => d !== primary),
    [docs, primary],
  );

  const canAnalyse =
    primary && comparisons.length >= 2 && comparisons.length <= 4 && !loading;

  const toggleComparison = (doc: string) => {
    setComparisons((prev) => {
      if (prev.includes(doc)) return prev.filter((d) => d !== doc);
      if (prev.length >= 4) return prev;
      return [...prev, doc];
    });
  };

  const onAnalyse = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await analyze(primary, comparisons);
      analysisStore.set(result);
      navigate({ to: "/matrix" });
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "Backend unreachable on port 8000."
          : (e as Error).message,
      );
      setLoading(false);
    }
  };

  if (loading) {
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-xl w-full text-center">
          <div className="mx-auto h-16 w-16 rounded-full border-2 border-white/15 border-t-[color:var(--color-primary)] animate-spin" />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">
            Analysing witness statements
          </h1>
          <p className="mt-3 text-muted-foreground">
            This takes 2–3 minutes while Claude reads and reasons about the
            evidence. Please do not refresh.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm tabular-nums">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b] animate-pulse" />
            Elapsed {mins}:{secs.toString().padStart(2, "0")}
          </div>
          <div className="mt-10 text-left text-sm text-muted-foreground space-y-2">
            <p>• Extracting claims from {comparisons.length + 1} statements</p>
            <p>• Cross-referencing supporting and contradicting passages</p>
            <p>• Scoring evidential gaps and trial readiness</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Pleading-to-Proof
            </h1>
            <p className="text-xs text-muted-foreground">
              Witness Statement Evidence Analysis
            </p>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Post Office Horizon IT Inquiry
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Begin a new analysis
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Select one primary witness statement and 2–4 comparison witnesses.
            The tool extracts claims, then cross-references them to produce a
            supporting / contradicting / gap matrix.
          </p>
        </section>

        {docError && (
          <div className="mb-6 rounded-md border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#fecaca]">
            {docError}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-card p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">1. Primary witness</h3>
              <span className="text-xs text-muted-foreground">
                {docs ? `${docs.length} available` : "Loading…"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              The witness whose claims will be tested against the others.
            </p>
            <select
              className="mt-4 w-full rounded-md border border-white/15 bg-[color:var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              value={primary}
              onChange={(e) => {
                setPrimary(e.target.value);
                setComparisons((c) => c.filter((x) => x !== e.target.value));
              }}
              disabled={!docs}
            >
              <option value="">Select a primary witness…</option>
              {(docs ?? []).map((d) => (
                <option key={d} value={d}>
                  {extractName(d)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-white/10 bg-card p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">2. Comparison witnesses</h3>
              <span className="text-xs text-muted-foreground">
                {comparisons.length} / 4 selected
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose 2 to 4 witnesses to cross-reference.
            </p>
            <div className="mt-4 max-h-72 overflow-y-auto rounded-md border border-white/10 divide-y divide-white/5">
              {filteredDocs.length === 0 && (
                <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                  {primary ? "No other witnesses." : "Select a primary first."}
                </div>
              )}
              {filteredDocs.map((d) => {
                const checked = comparisons.includes(d);
                const disabled = !checked && comparisons.length >= 4;
                return (
                  <label
                    key={d}
                    className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-white/5 ${
                      disabled ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-[color:var(--color-primary)]"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleComparison(d)}
                    />
                    <span className="truncate">{extractName(d)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-md border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#fecaca]">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Analysis typically takes 2–3 minutes. The tab must remain open.
          </p>
          <div className="flex items-center gap-3">
            {analysisStore.get() && (
              <Link
                to="/matrix"
                className="rounded-md border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
              >
                View previous analysis
              </Link>
            )}
            <button
              onClick={onAnalyse}
              disabled={!canAnalyse}
              className="rounded-md bg-[color:var(--color-primary)] px-5 py-2 text-sm font-medium text-[color:var(--color-primary-foreground)] disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              Analyse statements
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
