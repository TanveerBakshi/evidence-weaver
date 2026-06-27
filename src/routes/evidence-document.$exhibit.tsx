import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  FileText,
  Receipt,
  Users,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  MapPin,
  Hash,
  X,
  ExternalLink,
  FileText as FilePdf,
} from "lucide-react";
import { findExhibit, type DocType } from "../lib/evidence-data";

export const Route = createFileRoute("/evidence-document/$exhibit")({
  head: ({ params }) => ({
    meta: [
      { title: `Exhibit ${params.exhibit} — Evidence Matrix` },
      { name: "description", content: `Documentary evidence exhibit ${params.exhibit}.` },
    ],
  }),
  loader: ({ params }) => {
    const found = findExhibit(params.exhibit);
    if (!found) throw notFound();
    return found;
  },
  component: DocumentPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-900">Exhibit not found</h1>
        <Link
          to="/evidence-matrix"
          className="mt-4 inline-block text-sm text-slate-600 hover:text-slate-900"
        >
          ← Back to Evidence Matrix
        </Link>
      </div>
    </div>
  ),
});

const docIcon = (t: DocType) =>
  t === "email" ? Mail : t === "contract" ? FileText : t === "invoice" ? Receipt : Users;

const docHeading = (t: DocType) =>
  t === "email"
    ? "Email correspondence"
    : t === "contract"
    ? "Contract"
    : t === "invoice"
    ? "Invoice"
    : "Meeting minutes";

/** Convert a Google Drive share URL into an embeddable preview URL. */
function toEmbedUrl(url: string) {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
  return url;
}


function DocumentPage() {
  const { doc, claim, role } = Route.useLoaderData();
  const Icon = docIcon(doc.doc_type);
  const isSupport = role === "support";
  const [openUrl, setOpenUrl] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <Link
            to="/evidence-matrix"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Evidence Matrix
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Exhibit header */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold tracking-wider text-white ${
              isSupport ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            EXHIBIT {doc.exhibit}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ${
              isSupport
                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/30"
                : "bg-rose-50 text-rose-700 ring-rose-600/30"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            {isSupport ? "Supports claim" : "Contradicts claim"}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 capitalize">
            <Icon className="h-3.5 w-3.5" />
            {doc.doc_type}
          </span>
        </div>

        <h1
          className="mt-3 text-3xl font-semibold tracking-tight text-slate-900"
          style={{ fontFamily: "Fraunces, serif" }}
        >
          {docHeading(doc.doc_type)} — {doc.exhibit}
        </h1>

        {/* Metadata */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Meta icon={Calendar} label="Date" value={doc.date} />
          <Meta icon={MapPin} label="Location in document" value={doc.location} />
          <Meta icon={Hash} label="Confidence" value={doc.confidence} />
        </div>

        {/* Files (Drive-style grid) */}
        {(() => {
          const urls: string[] = Array.isArray(doc.pdf_url)
            ? doc.pdf_url
            : doc.pdf_url
            ? [doc.pdf_url]
            : [];
          if (urls.length === 0) return null;
          return (
            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Files ({urls.length})
                </h2>
                <span className="text-[11px] text-slate-400">Click a file to preview</span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {urls.map((url, i) => {
                  const label =
                    doc.pdf_labels?.[i] ??
                    `${doc.exhibit}${urls.length > 1 ? `-${i + 1}` : ""}.pdf`;
                  return (
                    <button
                      key={url + i}
                      type="button"
                      onClick={() => setOpenUrl(url)}
                      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:border-slate-400 hover:shadow-md"
                    >
                      <div className="flex h-32 items-center justify-center bg-slate-50 border-b border-slate-200 group-hover:bg-slate-100">
                        <FilePdf
                          className={`h-12 w-12 ${
                            isSupport ? "text-emerald-600" : "text-rose-600"
                          }`}
                          strokeWidth={1.25}
                        />
                      </div>
                      <div className="flex items-start gap-2 px-3 py-2.5">
                        <FilePdf className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <span className="text-xs font-medium text-slate-800 line-clamp-2 break-all">
                          {label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* Extracted passage */}
        <section className="mt-8 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Extracted passage
          </div>
          <div className="px-8 py-8">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
              {doc.location}
            </p>
            <blockquote
              className={`border-l-4 pl-5 text-xl leading-relaxed text-slate-900 ${
                isSupport ? "border-emerald-500" : "border-rose-500"
              }`}
              style={{ fontFamily: "Fraunces, serif" }}
            >
              "{doc.passage}"
            </blockquote>
            {!doc.pdf_url && (
              <div className="mt-8 text-[11px] text-slate-400 italic">
                [No source PDF linked yet for exhibit {doc.exhibit}.]
              </div>
            )}
          </div>
        </section>
                );
              })}
            </div>
          );
        })()}

        {/* Extracted passage */}
        <section className="mt-8 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Extracted passage
          </div>
          <div className="px-8 py-8">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
              {doc.location}
            </p>
            <blockquote
              className={`border-l-4 pl-5 text-xl leading-relaxed text-slate-900 ${
                isSupport ? "border-emerald-500" : "border-rose-500"
              }`}
              style={{ fontFamily: "Fraunces, serif" }}
            >
              "{doc.passage}"
            </blockquote>
            {!doc.pdf_url && (
              <div className="mt-8 text-[11px] text-slate-400 italic">
                [No source PDF linked yet for exhibit {doc.exhibit}.]
              </div>
            )}
          </div>
        </section>


        {/* Linked claim */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            {isSupport ? "Supports this claim" : "Contradicts this claim"}
          </div>
          <h2
            className="mt-2 text-lg font-semibold text-slate-900"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            "{claim.allegation_summary}"
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 capitalize text-slate-600">
              {claim.allegation_type}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 capitalize text-slate-600">
              {claim.topic.replace(/_/g, " ")}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
              {claim.paragraph_ref}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
              by {claim.witness_a}
            </span>
          </div>
          <Link
            to="/evidence-matrix"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="h-3 w-3" />
            View full matrix
          </Link>
        </section>
      </main>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
