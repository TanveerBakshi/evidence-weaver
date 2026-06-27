import type { AnalysisResult, MatrixRow } from "./analysis-store";

/**
 * Transforms the pleading analysis API response shape
 * into the AnalysisResult shape the board expects.
 */
export function transformPleadingResult(raw: any): AnalysisResult {
  const matrix: MatrixRow[] = (raw.matrix || []).map((row: any) => ({
    allegation_summary: row.allegation,
    allegation_type: row.topic,
    topic: row.topic,
    paragraph_ref: `Allegation #${row.allegation_id}`,
    witness_a: raw.documents_analysed?.[0] ?? "Primary Witness",
    supporting: (row.supporting || []).map((s: any) => ({
      witness: s.witness,
      passage: s.relevant_passage ?? s.passage ?? "",
      paragraph: s.paragraph_ref ?? s.paragraph ?? "",
      confidence: s.confidence ?? "MEDIUM",
    })),
    contradicting: (row.contradicting || []).map((c: any) => ({
      witness: c.witness,
      passage: c.relevant_passage ?? c.passage ?? "",
      paragraph: c.paragraph_ref ?? c.paragraph ?? "",
      confidence: c.confidence ?? "MEDIUM",
      reasoning: c.reasoning ?? "",
    })),
    neutral: row.not_addressed ?? [],
    not_addressed: Array.isArray(row.not_addressed) ? row.not_addressed.length : (row.not_addressed ?? 0),
    gap: row.gap ?? false,
    confidence: row.gap ? "LOW" : row.supporting?.length >= 2 ? "HIGH" : "MEDIUM",
  }));

  const gaps = matrix.filter(r => r.gap).map(r => ({
    allegation_summary: r.allegation_summary,
    topic: r.topic,
    paragraph_ref: r.paragraph_ref,
  }));

  const contradictions = matrix
    .filter(r => r.contradicting.length > 0)
    .map(r => ({
      allegation_summary: r.allegation_summary,
      topic: r.topic,
      contradicting: r.contradicting,
    }));

  return {
    primary_witness: raw.documents_analysed?.[0] ?? "Primary Witness",
    comparison_witnesses: (raw.documents_analysed || []).slice(1),
    total_claims: raw.total_allegations ?? matrix.length,
    trial_readiness: raw.trial_readiness ?? "MODERATE",
    trial_readiness_score: raw.trial_readiness_score ?? 0,
    matrix,
    gaps_count: gaps.length,
    contradictions_count: contradictions.length,
    gaps,
    contradictions,
  };
}
