# SkillSarthi AI (कौशलसारथी)
### AI-Enabled Career Counselling & Family Decision-Support Platform
**Problem Statement ID: 26241** | **Organization: Ministry of Skill Development and Entrepreneurship (MSDE)**  
**Category: Software** | **Theme: Smart Education**

---

## 1. Executive Summary & Core Philosophy

The primary reason vocational training (ITI, polytechnic, skilling) experiences low enrolment and high dropout rates across India is **parental veto power**. In Indian households (especially Tier-2, Tier-3, and rural communities), career decisions are negotiated collectively, with parents prioritizing social prestige, immediate earning security, and workplace safety.

Most guidance tools fail because they cater exclusively to the learner. **Patho** is engineered as a **Tripartite Mediation System**:
1. **Uncovers Authentic Technical Aptitude**: An adaptive AI chat evaluates hands-on mechanical, electrical, and spatial inclinations without intimidating students with abstract classroom theory.
2. **Isolates Parental Anxieties (Blind Intake)**: Captures baseline salary expectations (e.g., ₹18,000/mo), commute limits, and prestige anxieties in complete isolation, eliminating stigma-driven prejudgment.
3. **AI Tripartite Mediation Engine**: Brings student and parent together, reframing the student's choice through clean-room corporate manufacturing realities, systematically resolving objections using verified MSDE wage datasets, and bridging economic gaps with micro-credential boosters.
4. **Actionable Roadmap & Family Decision Accord**: Delivers a multi-year milestone roadmap and an exportable 1-page **"Family Decision Accord" (Parivar Kaushal Samjhauta)** with digital signature seals, print-ready PDF export, and WhatsApp sharing.

---

## 2. End-to-End 5-Phase Architecture

```
[ PHASE 1: Student Dynamic Intake ]
  ↳ Adaptive AI Chat with Counselor persona 'Aarav Sir'
  ↳ Evaluates hands-on inclination, spatial problem-solving, and mobility
  ↳ Every question is permanently paired with user response in SQLite DB
                 │
                 ▼
[ PHASE 2: Student Decision Guide ]
  ↳ 4 Detailed NSQF Career Match Cards (Level 3–6)
  ↳ Day-to-day clean-room realities, entry stipends, 5-yr growth, and NCrF degree ladders
  ↳ Student locks in chosen goal (sealed from parent intake)
                 │
                 ▼
[ PHASE 3: Blind Family Concern Intake ]
  ↳ Multilingual voice & text interface (Marathi, Hindi, English)
  ↳ Parent answers dynamic prompts WITHOUT knowing student's locked choice
  ↳ Captures raw priorities: min. salary (₹18,000+), prestige fears, safety, location
                 │
                 ▼
[ PHASE 4: AI Reconciliation & Live Mediation ]
  ↳ Merges student's locked choice with parent's raw constraints
  ↳ AI reveals choice framed around clean-room corporate plants (Tata Motors / Bajaj)
  ↳ Line-by-line objection handling (MSDE wage comparison vs BA graduates + Micro-credential boosters)
                 │
                 ▼
[ PHASE 5: Actionable Roadmap & Consensus Output ]
  ↳ Multi-year milestone timeline: Training ➔ Stipend ➔ Junior Tech ➔ Supervisor/B.Voc
  ↳ Real-world grounding: Local ITIs (ITI Aundh, PMKK Chakan), industrial clusters, NAPS stipends
  ↳ Exportable 1-page "Family Agreement Accord" (WhatsApp share / PDF print)
```

---

## 3. Persistent Database Architecture (`node:sqlite`)

Every conversational interaction is permanently captured in the SQLite database (`server/patho_platform.sqlite`):

* `sessions`: Student profile, district, state, mobility preferences.
* `qa_interactions`: **Permanently pairs every single Counselor question with the user's response**, question type (`mcq`/`scenario`), and computed domain trait vector.
* `locked_goals`: Encrypted vault storing the student's chosen NSQF career role until the mediation reveal.
* `parent_profiles`: Independent record of parental salary thresholds, commute boundaries, and prestige concerns.
* `mediation_sessions`: Step-by-step transcript of the live tripartite reconciliation dialogue.
* `family_accords`: Ratified agreement accords with unique government codes (e.g., `MSDE-ACCORD-916336`) and milestone commitments.

*Evaluators can click the **"🗄️ SQLite DB"** button in the top navbar at any time to inspect live database tables.*

---

## 4. Universal OpenAI-Compatible AI Engine

The platform features a universal OpenAI-compatible client supporting any provider (OpenAI, Groq, Ollama, OpenRouter, Together AI). System prompts dynamically adapt per task:

1. **Student Intake**: `Aarav Sir` (MSDE Senior Vocational Counselor) diagnosing practical hands-on traits without book-theory intimidation.
2. **Career Matcher**: Computes NSQF Level 3–6 Qualification Pack vectors and wage trajectories.
3. **Parent Intake**: Respectful vernacular family counselor capturing raw economic constraints.
4. **Tripartite Mediator**: MSDE Skilling Ombudsman resolving objections with hard labor market evidence and NCrF policy.
5. **Accord Generator**: Formalizes the binding 1-page Family Agreement.

---

## 5. Quickstart & How to Run

### Prerequisites
- Node.js (v18+ or v22+)
- npm (v9+)

### Installation & Execution
```bash
# Clone or navigate to the workspace
cd /Users/yogesh/Desktop/Patho

# Start both Backend API (Port 5001) and Frontend Client (Port 3000)
node dev.js
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
   - Logs his father's raw constraints: **Min. ₹18,000/mo**, clean corporate workplace, local commute (<35 km).
   - Enters the **Phase 4 Tripartite Mediation Chamber**, presenting the side-by-side MSDE wage proof, the 6-month High-Voltage EV Safety Micro-Credential booster (+₹4,000/mo), and the NCrF B.Voc lateral degree bridge.
4. Advance to Phase 5 to view and print the official **1-Page Family Decision Accord**.
