# Pleading-to-Proof
### AI Case Theory Stress Test | LLM × Law Hackathon 2026
**CMS × Harvey Challenge | Judge Business School, Cambridge**

---

## What It Does

Pleading-to-Proof takes witness statements from the Post Office Horizon IT Inquiry and stress-tests the case theory against 8 formal legal allegations.

For each allegation it returns:
- **SUPPORTED** — witness evidence corroborates the claim, with verified source citation
- **CONTRADICTED** — witness evidence directly opposes the claim (highest litigation risk)
- **EVIDENTIAL GAP** — no witness addresses this claim, action required
- **UNVERIFIED** — AI found a passage but could not string-match it to source

Output: a trial readiness score (STRONG / MODERATE / VULNERABLE), an evidence board, a professional case risk memo, and real UK case law citations pulled automatically via Perplexity.

---

## Key Finding

**Roderick Mark Ismay** (Post Office Head of Product & Branch Accounting) directly contradicts the allegation that senior management knew Horizon was unreliable:

> *"I don't recall that there were serious concerns within POL management about the integrity of the Horizon system at that time."*

The tool surfaced this automatically by reading 133 witness statements.

---

## Stack

| Tool | Purpose |
|---|---|
| **Claude API** (Anthropic) | Evidence classification, contradiction detection, allegation extraction |
| **Perplexity API** | Real-time UK case law retrieval |
| **Neo4j Aura** | Witness-allegation relationship graph database |
| **FastAPI** | Async REST API with background job queue |
| **PyPDF2** | PDF text extraction across 133 witness statements |
| **React + Vite** | Frontend (evidence board, matrix, report) |

---

## Repository Structure

```
CMSxHarvey/
├── backend/
│   ├── main.py                        # FastAPI server — 14 endpoints
│   ├── requirements.txt
│   ├── clients/
│   │   ├── claude_client.py           # Claude API — retry logic
│   │   ├── perplexity_client.py       # Perplexity — case law search
│   │   └── neo4j_client.py            # Neo4j — graph database
│   ├── services/
│   │   ├── document_parser.py         # PDF text extraction
│   │   ├── pleading_generator.py      # Core — 8 Horizon allegations analysis
│   │   ├── evidence_classifier.py     # Witness-vs-witness classification
│   │   ├── allegation_extractor.py    # Claim extraction
│   │   ├── report_generator.py        # Matrix assembly
│   │   ├── memo_generator.py          # HTML case risk memo
│   │   ├── change_detector.py         # Snapshot diff detection
│   │   └── storage.py                 # Persistent JSON storage
│   ├── prompts/
│   │   ├── extract_allegations.txt
│   │   └── classify_evidence.txt
│   └── utils/
│       └── text_chunker.py            # Full document chunking
├── src/                               # React frontend
│   ├── routes/
│   │   ├── index.tsx                  # Upload / witness selector
│   │   ├── board.tsx                  # Evidence cork board
│   │   ├── matrix.tsx                 # Evidence matrix table
│   │   ├── report.tsx                 # Gaps + contradictions
│   │   └── graph.tsx                  # Neo4j network visualisation
│   └── lib/
│       ├── api.ts                     # All API calls
│       ├── analysis-store.ts          # Global state
│       └── transform.ts               # API response transformer
├── Dockerfile                         # Google Cloud Run deployment
├── requirements.txt
└── .env.example
```

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and bun
- API keys for: Anthropic, Perplexity, Neo4j Aura

### 1. Clone the repo

```bash
git clone https://github.com/ishaan-bhalla/CMSxHarvey.git
cd CMSxHarvey
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password-here
```

- **Anthropic API key** → console.anthropic.com
- **Perplexity API key** → perplexity.ai/settings/api
- **Neo4j Aura** → neo4j.com/cloud/aura (free tier, create instance, copy credentials)

### 3. Add witness statement data

Download the Post Office Horizon IT Inquiry witness statements and place PDFs in:
```
data/raw/
```

The dataset was provided by CMS for the hackathon. Contact CMS for access.

### 4. Start the backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`
Interactive API docs at `http://localhost:8000/docs`

### 5. Pre-compute the demo result

```bash
curl -X POST http://localhost:8000/demo/precompute
```

Poll until complete:
```bash
curl -s http://localhost:8000/jobs/{job_id} | python3 -m json.tool | grep status
```

### 6. Start the frontend

```bash
bun install
bun run dev
```

Frontend runs at `http://localhost:8080`

---

## API Reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Server status |
| `/documents` | GET | List all 133 witness statements |
| `/analyze/pleading` | POST | Submit analysis job — returns job_id instantly |
| `/jobs/{job_id}` | GET | Poll job status + progress % |
| `/demo` | GET | Pre-computed result — instant, for presentations |
| `/demo/precompute` | POST | Pre-compute and cache best witness combination |
| `/review` | POST | Lawyer sign-off on AI verdict |
| `/reviews/{job_id}` | GET | Audit trail for a job |
| `/snapshots` | GET | List all case snapshots |
| `/snapshots` | POST | Save case state at a point in time |
| `/snapshots/compare/{a}/{b}` | GET | Detect changes between two snapshots |
| `/snapshots/{id}` | GET | Retrieve specific snapshot |
| `/graph` | GET | Neo4j witness-allegation network data |
| `/upload` | POST | Upload new witness statement PDF |

---

## The 8 Formal Allegations

| # | Allegation | Topic |
|---|---|---|
| 1 | Horizon IT system contained bugs causing false shortfalls | horizon_system |
| 2 | Post Office knew about defects before prosecutions | knowledge |
| 3 | Fujitsu had remote access to branch transaction data | horizon_system |
| 4 | Post Office failed to disclose Horizon defects to defence | prosecutions |
| 5 | Subpostmasters were wrongly prosecuted | prosecutions |
| 6 | Senior management knew Horizon was unreliable | management |
| 7 | Known Error Log recorded defects not shared with lawyers | knowledge |
| 8 | Post Office pressured subpostmasters to cover losses | financial_losses |

---

## Demo Results

**Best witness combination:**
- Peter John Rowley (Fujitsu)
- Michael Edward Pryor Peach (Fujitsu)
- Steve Bansal (Fujitsu)
- Patrick Bourke (Post Office)
- Simon Clarke (Post Office)
- Roderick Mark Ismay (Post Office)

**Result: STRONG — 75% of allegations evidenced**
- 6 allegations supported with verified citations
- 2 contradictions found (Roderick Mark Ismay contradicts management knowledge allegations)
- 2 evidential gaps requiring further evidence

---

## What Makes This Different

**Synthetic pleadings** — Tests against 8 formal legal allegations rather than cross-referencing witnesses against each other. This mirrors how litigation actually works.

**Verified citations** — Every verdict requires the cited passage to be string-matched back into the source document. Unverifiable citations are downgraded to UNVERIFIED.

**Full document search** — Documents are split into overlapping 3,000-character chunks scored by topic keywords. Never misses content buried on page 14.

**Real UK case law** — Perplexity pulls live legal precedents. Hamilton v Post Office [2021] EWCA Civ 121 appears automatically alongside the relevant allegation.

**Human-in-the-loop** — Every AI verdict can be accepted, overruled, or rejected. All decisions are timestamped in a persistent audit trail.

**Longitudinal case management** — Snapshots save case state at any point in time. Change detection shows exactly what shifted when new evidence arrives. Designed for long-running cases where lawyers change mid-way through.

**Demo mode** — Pre-computed results load instantly. Never fails during a live presentation.

---

## Deployment

### Docker

```bash
docker build -t pleading-to-proof .
docker run -p 8080:8080 --env-file .env pleading-to-proof
```

### Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT/pleading-to-proof
gcloud run deploy pleading-to-proof \
  --image gcr.io/YOUR_PROJECT/pleading-to-proof \
  --platform managed \
  --allow-unauthenticated \
  --region europe-west2
```

---

## Acknowledgements

Dataset: Post Office Horizon IT Inquiry witness statements, provided by CMS for the LLM × Law Hackathon 2026.

Built in 24 hours at LLM × Law Hackathon 2026, Judge Business School, Cambridge.

---

*Team: Ishaan Bhalla & Tanveer Bakshi*
