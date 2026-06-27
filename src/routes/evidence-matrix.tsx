import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, AlertTriangle, Scale } from "lucide-react";
import { useAnalysis, type SupportingEvidence, type ContradictingEvidence } from "../lib/analysis-store";

export const Route = createFileRoute("/evidence-matrix")({
  head: () => ({
    meta: [
      { title: "Evidence Matrix — Trial Prep" },
      {
        name: "description",
        content:
          "Witness evidence analysis ranking allegations by corroboration, contradiction and gaps.",
      },
    ],
  }),
  component: EvidenceMatrixPage,
});

type ClaimItem = {
  id: string;
  allegation_id: number;
  allegation: string;
  topic: string;
  paragraph: string;
  supporting: SupportingEvidence[];
  contradicting: ContradictingEvidence[];
  gap: boolean;
  confidence: string;
  not_addressed: string[];
};

function readinessTone(r: string) {
  if (r === "STRONG")
    return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/30", dot: "bg-emerald-600" };
  if (r === "MODERATE")
    return { bg: "bg-amber-50", text: "text-amber-800", ring: "ring-amber-600/30", dot: "bg-amber-500" };
  return { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-600/30", dot: "bg-rose-600" };
}

function confTone(c: string) {
  if (c === "HIGH") return "bg-slate-900 text-white";
  if (c === "MEDIUM") return "bg-slate-300 text-slate-900";
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function rankClaim(c: ClaimItem) {
  const witnesses = c.supporting.length + c.contradicting.length;
  return witnesses * 10 + (c.gap ? -1000 : 0);
}

function EvidenceMatrixPage() {
  const result = useAnalysis();
  const [filter, setFilter] = useState<"all" | "supported" | "contradicted" | "gaps">("all");

  const DATA = useMemo<ClaimItem[]>(
    () =>
      result
        ? result.matrix.map((row, idx) => ({
            id: row.allegation_summary,
            allegation_id: idx + 1,
            allegation: row.allegation_summary,
            topic: row.topic,
            paragraph: row.paragraph_ref,
            supporting: row.supporting,
            contradicting: row.contradicting,
            gap: row.gap,
            confidence: row.confidence,
            not_addressed: row.neutral,
          }))
        : [],
    [result],
  );

  const gaps = useMemo(() => DATA.filter((r) => r.gap), [DATA]);
  const contradictions = useMemo(() => DATA.filter((r) => r.contradicting.length > 0), [DATA]);

  const claims = useMemo(() => {
    let rows = DATA.slice();
    if (filter === "supported") rows = rows.filter((r) => r.supporting.length > 0);
    if (filter === "contradicted") rows = rows.filter((r) => r.contradicting.length > 0);
    if (filter === "gaps") rows = rows.filter((r) => r.gap);
    rows.sort((a, b) => rankClaim(b) - rankClaim(a));
    return rows;
  }, [DATA, filter]);

  if (!result)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-type">No analysis loaded. Run an analysis first.</p>
      </div>
    );

  const tr = readinessTone(result.trial_readiness);
  const witnesses = [result.primary_witness, ...result.comparison_witnesses];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link to="/" className="text-xs text-slate-500 hover:text-slate-900">
                ← Back
              </Link>
              <div className="mt-2 flex items-center gap-3">
                <Scale className="h-6 w-6 text-slate-700" />
                <h1
                  className="text-3xl font-semibold tracking-tight text-slate-900"
                  style={{ fontFamily: "Fraunces, serif" }}
                >
                  Evidence Matrix
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Witness statement analysis · {result.total_claims} allegations
              </p>

              <div className="mt-5">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                  Documents analysed
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {witnesses.map((w) => (
                    <span
                      key={w}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                    >
                      <Users className="h-3 w-3" />
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:w-[640px]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                  Trial Readiness
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-4xl font-semibold tabular-nums text-slate-900">
                    {result.trial_readiness_score.toFixed(1)}
                  </div>
                  <div className="text-sm text-slate-400">/ 100</div>
                </div>
                <div
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ${tr.bg} ${tr.text} ${tr.ring}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${tr.dot}`} />
                  {result.trial_readiness}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                  Evidence gaps
                </div>
                <div className="mt-2 text-4xl font-semibold tabular-nums text-slate-900">
                  {gaps.length}
                </div>
                <div className="mt-3 text-[11px] text-slate-500">
                  Allegations with no witness corroboration
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                  Contradictions
                </div>
                <div className="mt-2 text-4xl font-semibold tabular-nums text-slate-900">
                  {contradictions.length}
                </div>
                <div className="mt-3 text-[11px] text-slate-500">
                  Allegations with conflicting witness evidence
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "All allegations"],
              ["supported", "Supported"],
              ["contradicted", "Contradicted"],
              ["gaps", "Evidence gaps"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === k
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Claims */}
        <div className="space-y-5">
          {claims.map((c) => (
            <ClaimCard key={c.id} claim={c} />
          ))}
          {claims.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No allegations match the current filter.
            </div>
          )}
        </div>

        {/* Legend */}
        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Legend
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-3 w-3 rounded-sm bg-emerald-600 ring-1 ring-emerald-700" />
              <span>Green = witness supports the allegation.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-3 w-3 rounded-sm bg-rose-600 ring-1 ring-rose-700" />
              <span>Red = witness contradicts the allegation.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-3 w-3 rounded-sm bg-slate-400 ring-1 ring-slate-500" />
              <span>Grey = evidence gap; no witness addressed it.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ClaimCard({ claim }: { claim: ClaimItem }) {
  const notAddressedCount = claim.not_addressed.length;

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
        claim.gap
          ? "border-slate-300"
          : claim.contradicting.length > 0
          ? "border-rose-300"
          : claim.supporting.length > 0
          ? "border-emerald-300"
          : "border-slate-200"
      }`}
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Allegation #{claim.allegation_id}
          </span>
          {claim.gap && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
              <AlertTriangle className="h-3 w-3" />
              Evidence gap
            </span>
          )}
          {claim.contradicting.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Contradicted
            </span>
          )}
          {claim.supporting.length > 0 && claim.contradicting.length === 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Supported
            </span>
          )}
        </div>
        <h2
          className="mt-2 text-lg font-semibold leading-snug text-slate-900"
          style={{ fontFamily: "Fraunces, serif" }}
        >
          "{claim.allegation}"
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <Chip>{claim.topic.replace(/_/g, " ")}</Chip>
        </div>
      </div>

      {claim.gap && claim.supporting.length === 0 && claim.contradicting.length === 0 ? (
        <div className="flex items-center gap-3 bg-slate-50 px-5 py-6 text-sm text-slate-600">
          <AlertTriangle className="h-5 w-5 text-slate-500" />
          <div>
            <div className="font-semibold text-slate-800">No corroborating evidence found.</div>
            <div className="text-xs text-slate-500">
              Not addressed by {notAddressedCount} witness{notAddressedCount === 1 ? "" : "es"}
              {notAddressedCount > 0 && `: ${claim.not_addressed.join(", ")}`}.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-slate-100 lg:border-b-0 lg:border-r lg:border-slate-100 px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Supporting ({claim.supporting.length})
              </h3>
            </div>
            {claim.supporting.length > 0 ? (
              <div className="space-y-2">
                {claim.supporting.map((w, i) => (
                  <WitnessCard key={i} w={w} kind="support" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-[11px] text-slate-400">
                No witness supports this allegation.
              </div>
            )}
          </div>

          <div className="px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Contradicting ({claim.contradicting.length})
              </h3>
            </div>
            {claim.contradicting.length > 0 ? (
              <div className="space-y-2">
                {claim.contradicting.map((w, i) => (
                  <WitnessCard key={i} w={w} kind="contradict" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-[11px] text-slate-400">
                No witness contradicts this allegation.
              </div>
            )}
          </div>
        </div>
      )}

      {notAddressedCount > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5 text-[11px] text-slate-500">
          Not addressed by {notAddressedCount} witness{notAddressedCount === 1 ? "" : "es"}:{" "}
          {claim.not_addressed.join(", ")}
        </div>
      )}
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded px-1.5 py-0.5 capitalize bg-slate-100 text-slate-600">
      {children}
    </span>
  );
}

function WitnessCard({
  w,
  kind,
}: {
  w: SupportingEvidence | ContradictingEvidence;
  kind: "support" | "contradict";
}) {
  const isSupport = kind === "support";
  return (
    <div
      className={`rounded-md border-l-2 bg-white px-3 py-2.5 ring-1 ring-slate-100 ${
        isSupport ? "border-emerald-500" : "border-rose-500"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-slate-800">{w.witness}</div>
        <span className="text-[10px] text-slate-400">{w.paragraph}</span>
      </div>
      <p className="mt-1.5 text-xs italic text-slate-700">"{w.passage}"</p>
      {"reasoning" in w && w.reasoning && (
        <p className="mt-1 text-[11px] text-slate-500">↳ {w.reasoning}</p>
      )}
      <div className="mt-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${confTone(w.confidence)}`}
        >
          {w.confidence}
        </span>
      </div>
    </div>
  );
}
