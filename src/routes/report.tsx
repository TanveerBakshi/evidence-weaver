import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAnalysis } from "../lib/analysis-store";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report — Pleading-to-Proof" },
      {
        name: "description",
        content:
          "Evidential gaps and contradictions summary across witness statements.",
      },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const result = useAnalysis();
  const navigate = useNavigate();

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold">No analysis loaded</h1>
          <p className="mt-2 text-muted-foreground">
            Run an analysis from the home page first.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-6 rounded-md bg-[color:var(--color-primary)] px-4 py-2 text-sm font-medium text-[color:var(--color-primary-foreground)]"
          >
            Start analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-white">
              ← New analysis
            </Link>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Pleading-to-Proof
            </h1>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/matrix"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-white hover:bg-white/5"
            >
              Matrix
            </Link>
            <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium">
              Report
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-12">
        <section>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-xl font-semibold">
              Evidential gaps
              <span className="ml-3 text-sm font-normal text-muted-foreground">
                {result.gaps_count} found
              </span>
            </h2>
            <p className="text-xs text-muted-foreground max-w-md">
              Claims with no corroboration across comparison witnesses — the
              biggest risk for trial.
            </p>
          </div>

          {result.gaps.length === 0 ? (
            <div className="mt-4 rounded-lg border border-white/10 bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              No evidential gaps identified.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {result.gaps.map((g, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-4"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="rounded bg-[#f59e0b]/20 text-[#fcd34d] px-2 py-0.5 uppercase tracking-wider">
                      {g.topic.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground">
                      {g.paragraph_ref}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white">
                    {g.allegation_summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-xl font-semibold">
              Contradictions
              <span className="ml-3 text-sm font-normal text-muted-foreground">
                {result.contradictions_count} found
              </span>
            </h2>
            <p className="text-xs text-muted-foreground max-w-md">
              Witnesses disagree — these need resolution before trial.
            </p>
          </div>

          {result.contradictions.length === 0 ? (
            <div className="mt-4 rounded-lg border border-white/10 bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              No contradictions identified.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {result.contradictions.map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 p-5"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-[#ef4444]/20 text-[#fca5a5] px-2 py-0.5 uppercase tracking-wider">
                      {c.topic.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white font-medium">
                    {c.allegation_summary}
                  </p>
                  <div className="mt-4 space-y-2">
                    {c.contradicting.map((x, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-[#ef4444]/30 bg-black/30 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium text-white">
                            {x.witness}
                          </span>
                          <span className="text-muted-foreground">
                            {x.paragraph} · {x.confidence}
                          </span>
                        </div>
                        <blockquote className="mt-2 italic text-muted-foreground border-l-2 border-[#ef4444]/50 pl-3">
                          "{x.passage}"
                        </blockquote>
                        {x.reasoning && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="text-[#fca5a5]">Reasoning:</span>{" "}
                            {x.reasoning}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-3 pt-6 border-t border-white/10">
          <Link
            to="/matrix"
            className="rounded-md border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
          >
            ← Back to Matrix
          </Link>
          <Link
            to="/"
            className="rounded-md bg-[color:var(--color-primary)] px-4 py-2 text-sm font-medium text-[color:var(--color-primary-foreground)]"
          >
            New analysis
          </Link>
        </div>
      </main>
    </div>
  );
}
