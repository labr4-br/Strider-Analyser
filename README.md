# Strider Analyser

**AI-powered STRIDE threat modelling from architecture diagrams.**

Upload any software architecture diagram and get a structured, real-time STRIDE analysis powered by GPT-4o — complete with risk scoring, mitigation suggestions, and a downloadable PDF report.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## Demo

<video src="https://github.com/user-attachments/assets/5a663ab9-406e-4b30-b2b3-c359e83dc30a" controls width="100%"></video>

---

## Features

- **Vision-based analysis** — send any architecture diagram image; GPT-4o identifies components and maps threats
- **Structured STRIDE output** — results organized into 6 categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
- **Real-time streaming** — threats appear progressively via Server-Sent Events as the model generates them
- **Risk scoring** — each threat carries likelihood × impact scores with severity badges (Critical / High / Medium / Low)
- **Contextual chat** — ask follow-up questions about the analysis; the model responds with full STRIDE context
- **PDF report** — download a formatted report with the diagram, summary and full threat details
- **Analysis history** — previous analyses are saved locally with thumbnails and severity indicators
- **Dark / light mode** — automatic theme switching via Tailwind CSS

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| AI | GPT-4o via OpenAI API (Vercel AI SDK v6) |
| Streaming | Server-Sent Events (SSE) with `streamObject` + Zod schema |
| PDF | pdfkit (server-side, full UTF-8 support) |
| Validation | Zod (shared schema between frontend and backend) |

---

## Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API key with GPT-4o access

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/labr4-br/Strider-Analyser.git
cd Strider-Analyser
```

### 2. Install dependencies

```bash
npm install
```

This installs dependencies for both `frontend/` and `backend/` via npm workspaces.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
OPENAI_API_KEY=sk-...
PORT=3001
```

### 4. Start the development servers

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |

---

## Usage

1. Open `http://localhost:5173`
2. Drag and drop an architecture diagram (PNG, JPG, or any image format)
3. The analysis streams in real time, populating each STRIDE category
4. Use the **Chat** panel to ask follow-up questions
5. Click **Download PDF** to export the full report
6. Previous analyses are accessible in the **History** sidebar

---

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app entry
│   │   ├── routes/
│   │   │   ├── analyze.ts        # POST /api/analyze — SSE streaming
│   │   │   ├── chat.ts           # POST /api/chat — contextual chat
│   │   │   └── report.ts         # GET  /api/report — PDF download
│   │   ├── schemas/
│   │   │   └── stride.ts         # Zod schema for STRIDE output
│   │   └── services/
│   │       └── pdf.service.ts    # PDF generation
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/           # UI components
│   │   ├── hooks/                # useAnalysis, useFollowUpChat, useHistory
│   │   ├── schemas/              # Shared Zod schema (mirrored from backend)
│   │   └── types/                # TypeScript types
│   └── package.json
├── ia/
│   ├── stride_threat_modelling_poc.ipynb   # Original Colab proof of concept
│   └── STRIDE_Analyser_Desenvolvimento.docx
├── .env.example
└── package.json                  # Workspace root
```

---

## Available Scripts

Run from the project root:

```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Frontend only (port 5173)
npm run dev:backend      # Backend only (port 3001)
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key with GPT-4o access |
| `ANTHROPIC_API_KEY` | No | Reserved for future Anthropic model support |
| `PORT` | No | Backend port (default: `3001`) |

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).
