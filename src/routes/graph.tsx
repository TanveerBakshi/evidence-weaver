import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/graph")({
  component: GraphPage,
});

const BASE = "http://127.0.0.1:8000";

const TOPIC_COLORS: Record<string, string> = {
  horizon_system: "#3b82f6",
  knowledge: "#8b5cf6",
  prosecutions: "#ef4444",
  management: "#f59e0b",
  financial_losses: "#10b981",
  other: "#6b7280"
};

const ORG_COLORS: Record<string, string> = {
  "Fujitsu": "#f59e0b",
  "Post Office": "#3b82f6",
  "Other": "#6b7280"
};

const VERDICT_COLORS: Record<string, string> = {
  SUPPORTS: "#22c55e",
  CONTRADICTS: "#ef4444",
};

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}/graph`)
      .then(r => r.json())
      .then(data => { setGraphData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!graphData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const witnesses = graphData.witnesses || [];
    const allegations = graphData.allegations || [];
    const relationships = graphData.relationships || [];

    const witnessPositions: Record<string, any> = {};
    witnesses.forEach((w: any, i: number) => {
      witnessPositions[w.name] = {
        x: 160,
        y: 80 + i * (H - 120) / Math.max(witnesses.length - 1, 1),
        ...w
      };
    });

    const allegationPositions: Record<number, any> = {};
    allegations.forEach((a: any, i: number) => {
      allegationPositions[a.id] = {
        x: W - 160,
        y: 80 + i * (H - 120) / Math.max(allegations.length - 1, 1),
        ...a
      };
    });

    // Draw relationships
    relationships.forEach((rel: any) => {
      const from = witnessPositions[rel.witness];
      const to = allegationPositions[rel.allegation_id];
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = VERDICT_COLORS[rel.verdict] || "#374151";
      ctx.lineWidth = rel.verdict === "CONTRADICTS" ? 2.5 : 1;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw witness nodes
    Object.values(witnessPositions).forEach((w: any) => {
      ctx.beginPath();
      ctx.arc(w.x, w.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = ORG_COLORS[w.org] || "#6b7280";
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      const lastName = w.name.split(" ").pop() || w.name;
      ctx.fillText(lastName.slice(0, 8), w.x, w.y + 4);
      ctx.fillStyle = ORG_COLORS[w.org] || "#6b7280";
      ctx.font = "9px sans-serif";
      ctx.fillText(w.org, w.x - 45, w.y - 2);
    });

    // Draw allegation nodes
    Object.values(allegationPositions).forEach((a: any) => {
      const color = TOPIC_COLORS[a.topic] || "#6b7280";
      ctx.beginPath();
      ctx.arc(a.x, a.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(a.id), a.x, a.y + 4);
      ctx.fillStyle = color;
      ctx.font = "8px sans-serif";
      ctx.fillText(a.topic.replace("_", " "), a.x + 28, a.y);
    });

  }, [graphData]);

  return (
    <div className="min-h-screen bg-[#0f1623] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/board" className="text-xs text-gray-400 hover:text-white">← Back to board</Link>
            <h1 className="mt-1 text-2xl font-semibold">Witness — Allegation Network</h1>
            <p className="text-sm text-gray-400 mt-1">Neo4j relationship graph — powered by graph database</p>
          </div>
        </div>

        <div className="flex gap-6 mb-4 text-xs">
          {Object.entries(ORG_COLORS).map(([org, color]) => (
            <span key={org} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{background: color}}></span>
              <span className="text-gray-400">{org}</span>
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
            <span className="text-gray-400">Supports</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span className="text-gray-400">Contradicts</span>
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">Loading graph...</div>
        ) : !graphData?.witnesses?.length ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            No graph data. Run an analysis first.
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={900}
            height={520}
            className="w-full rounded-lg"
            style={{background: "#111827"}}
          />
        )}

        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{graphData?.witnesses?.length ?? 0}</div>
            <div className="text-gray-400 text-xs mt-1 uppercase tracking-wider">Witnesses</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{graphData?.allegations?.length ?? 0}</div>
            <div className="text-gray-400 text-xs mt-1 uppercase tracking-wider">Allegations</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{graphData?.relationships?.length ?? 0}</div>
            <div className="text-gray-400 text-xs mt-1 uppercase tracking-wider">Relationships</div>
          </div>
        </div>
      </div>
    </div>
  );
}
