import type { AnalysisResult } from "./analysis-store";

const BASE = "http://127.0.0.1:8000";

export async function fetchDocuments(): Promise<{ documents: string[]; count: number }> {
  const r = await fetch(`${BASE}/documents`);
  if (!r.ok) throw new Error(`Failed to fetch documents (${r.status})`);
  return r.json();
}

export async function analyze(
  primary: string,
  comparisons: string[],
  signal?: AbortSignal,
): Promise<AnalysisResult> {
  const prefix = (n: string) => (n.startsWith("data/raw/") ? n : `data/raw/${n}`);
  const r = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      primary_pdf: prefix(primary),
      comparison_pdfs: comparisons.map(prefix),
    }),
    signal,
  });
  if (!r.ok) throw new Error(`Analysis failed (${r.status})`);
  return r.json();
}
