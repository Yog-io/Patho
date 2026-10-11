# Pathora / SkillSarthi AI (कौशलसारथी)
### AI-Enabled Career Counselling & Family Decision-Support Platform
**Problem Statement ID: 26241** | **Organization: Ministry of Skill Development and Entrepreneurship (MSDE)**  
**Category: Software** | **Theme: Smart Education**

---

## 1. Executive Summary & Core Philosophy

The primary reason vocational training (ITI, polytechnic, skilling) experiences low enrolment and high dropout rates across India is **parental veto power**. In Indian households (especially Tier-2, Tier-3, and rural communities), career decisions are negotiated collectively, with parents prioritizing social prestige, immediate earning security, and workplace safety.

Most guidance tools fail because they cater exclusively to the learner. **Pathora / SkillSarthi** is engineered as a **Tripartite Mediation System**:
1. **Uncovers Authentic Technical Aptitude**: An adaptive, 4-question AI dialogue evaluates hands-on mechanical, electrical, and spatial inclinations without intimidating students with abstract classroom theory.
2. **Isolates Parental Anxieties (Blind Intake)**: Captures baseline salary expectations (e.g., ₹18,000/mo), commute limits, workplace safety fears, and prestige anxieties in complete isolation, eliminating stigma-driven prejudgment.
3. **AI Tripartite Mediation Engine**: Brings student and parent together, reframing the student's choice through clean-room corporate manufacturing realities, systematically resolving objections using verified MSDE wage datasets, and bridging economic gaps with micro-credential boosters.
4. **Actionable Roadmap & Family Decision Accord**: Delivers a multi-year milestone roadmap and an exportable 1-page **"Family Decision Accord" (Parivar Kaushal Samjhauta)** with digital signature seals, print-ready layout, and WhatsApp sharing.

---

## 2. End-to-End 5-Phase Architecture

```
[ PHASE 1: Student Dynamic Intake ]
  ↳ Adaptive AI dialogue with Counselor persona 'Aarav Sir'
  ↳ 4-stage sequential diagnostic arc: Life-Goal Anchor ➔ Hands-on Inclination ➔ Problem-Solving Reflex ➔ Mobility
  ↳ Every question-answer pair permanently persisted in SQLite DB
                 │
                 ▼
[ PHASE 2: Student Decision Guide ]
  ↳ 4 Detailed NSQF Career Match Cards (Level 3–6) researched live
  ↳ Day-to-day clean-room realities, entry stipends, 5-yr growth, and NCrF degree ladders
  ↳ Student locks in chosen goal (sealed from parent intake)
                 │
                 ▼
[ PHASE 3: Blind Family Concern Intake ]
  ↳ Multilingual voice & text interface (Marathi, Hindi, English)
  ↳ Parent answers dynamic prompts WITHOUT knowing student's locked choice
  ↳ Captures raw non-negotiables: min. salary (₹18,000+), prestige fears, safety doubts, commute radius
                 │
                 ▼
[ PHASE 4: AI Reconciliation & Live Mediation ]
  ↳ Reconciles student's locked choice and authentic aptitude with parent's raw constraints
  ↳ Mediator addresses prestige fears, clean corporate plants, and calculates salary deficits
  ↳ Line-by-line objection handling (MSDE wage comparison vs unemployed BA graduates + wage boosters)
                 │
                 ▼
[ PHASE 5: Actionable Roadmap & Consensus Output ]
  ↳ Multi-year milestone timeline: Training ➔ NAPS Stipend ➔ Junior Tech ➔ Supervisor / B.Voc Ladder
  ↳ Real-world grounding: Local ITIs (e.g., ITI Aundh), industrial clusters (e.g., Chakan), NAPS stipends
  ↳ Exportable 1-page "Family Agreement Accord" (WhatsApp share / PDF print)
```

---

## 3. Persistent Database Architecture (`node:sqlite`)

Every conversational interaction is permanently captured in the SQLite database (`server/patho_platform.sqlite`) using Node.js native `DatabaseSync`:

* `sessions`: Student profile, district, state, mobility preferences, and synthesized aptitude summary.
* `qa_interactions`: **Permanently pairs every single Counselor question with the user's response**, status (`asked`/`answered`), question type (`mcq`/`scenario`), and computed domain trait vectors.
* `locked_goals`: Sealed vault storing the student's chosen NSQF career role snapshot until the mediation reveal.
* `parent_profiles`: Independent record of parental salary thresholds, commute boundaries, prestige concerns, safety anxieties, and raw voice notes.
* `mediation_sessions`: Step-by-step transcript of the live tripartite reconciliation dialogue (idempotent, deduplicated with unique index).
* `family_accords`: Ratified agreement accords with unique government codes (e.g., `MSDE-ACCORD-916336`) and milestone commitments.
* **Auto-Session Hydration**: On browser refresh, the frontend automatically restores the active session from SQLite, preserving all answered questions, locked roles, and proceedings.

*Evaluators can inspect live database tables at any time via the `/api/db/inspector` endpoint or the database drawer.*

---

## 4. High-Performance AI Engine (Groq & OpenAI-Compatible)

The backend features an OpenAI-compatible architecture with native support for **Groq**, **Google Gemini**, and **OpenAI**:

* **Default Engine: Groq (`openai/gpt-oss-120b` or `llama-3.3-70b-versatile`)**: Sub-second response latency for instant conversational fluidity.
* **System Personas**:
  1. **Student Intake**: `Aarav Sir` (MSDE Senior Vocational Counselor) diagnosing practical hands-on traits without book-theory intimidation.
  2. **Career Matcher**: Computes NSQF Qualification Pack vectors, hiring clusters, and wage trajectories.
  3. **Parent Intake**: Respectful vernacular family counselor capturing raw economic constraints.
  4. **Tripartite Mediator**: MSDE Skilling Ombudsman resolving objections with hard labor market evidence, wage boosters, and NCrF policy.
  5. **Accord Generator**: Formalizes the binding 1-page Family Agreement.

---

## 5. Quickstart & Configuration

### Prerequisites
- Node.js (v18+ or v22+)
- npm (v9+)

### 1. Environment Setup
Create `server/.env` by copying `server/.env.example`:
```bash
# In server/ directory
cp .env.example .env
```

Configure your API key in `server/.env`:
```env
# Groq Configuration (Recommended)
GROQ_API_KEY="your_groq_api_key_here"
AI_API_KEY="your_groq_api_key_here"
AI_BASE_URL="https://api.groq.com/openai/v1"
AI_MODEL="openai/gpt-oss-120b"
AI_ENABLED="true"
```
*(Note: `.env` is ignored by `.gitignore` to prevent secret leakage.)*

### 2. Installation & Running
From the project root:
```bash
# Install dependencies
npm run install:all

# Start both Backend API (Port 5001) and Frontend Client (Port 3000)
npm run dev
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**

---

## 6. Evaluator Benchmark Test Case (Rahul & Father - Pune)

To walk evaluators through the official test scenario with 1 click:
1. Open **`http://localhost:3000`**.
2. Click **⭐ "Load Rahul (Pune) Persona"** in the top navbar.
3. The platform instantly:
   - Populates Rahul's profile (10th pass, Pune Chakan corridor, hands-on mechanical affinity).
   - Locks his choice: **EV Powertrain & Battery Assembly Technician (NSQF Level 4)**.
   - Logs his father's raw constraints: **Min. ₹18,000/mo**, clean corporate workplace, local commute (<35 km), prestige doubts.
   - Enters the **Phase 4 Tripartite Mediation Chamber**, presenting the side-by-side MSDE wage proof, the 6-month High-Voltage EV Safety Micro-Credential booster (+₹4,000/mo), and the NCrF B.Voc lateral degree bridge.
4. Advance to Phase 5 to view and print the official **1-Page Family Decision Accord**.
