import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { db, initializeDatabase } from './database.js';
import { 
  generateDynamicIntakeTurn,
  generateDynamicMediationTurn,
  fixedFirstQuestion,
  isAiEnabled,
  getAiConfig
} from './aiService.js';
import { researchRoles, researchRoadmap } from './gemini.js';
import { WAGE_BENCHMARKS } from './data/wageBenchmarks.js';
import { ITI_CLUSTERS } from './data/itiClusters.js';
import { OBJECTION_SCENARIOS } from './data/objectionScenarios.js';

// Initialize SQLite DB Schema
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ── AI-only platform: every question, match, proceeding and roadmap is
// generated on the go. No predefined content is served at runtime. ──
function aiRequired(res) {
  if (!isAiEnabled()) {
    res.status(502).json({
      error: 'AI_UNAVAILABLE',
      message: 'Live AI is not configured. Set GEMINI_API_KEY in server/.env and restart the server.'
    });
    return false;
  }
  return true;
}

/** Rebuild the locked AI-researched role from its DB row. */
function roleFromRow(row) {
  if (!row) return null;
  if (row.role_json) {
    try {
      const snap = JSON.parse(row.role_json);
      if (snap && snap.title) return snap;
    } catch { /* fall through to columns */ }
  }
  return {
    id: row.role_id,
    title: row.role_title,
    nsqfLevel: row.nsqf_level,
    entryStipend: row.entry_stipend,
    firstYearSalary: row.first_year_salary,
    fiveYearSalary: row.five_year_trajectory,
    ncrfCreditBridge: row.ncrf_degree_bridge,
    workEnvironment: row.work_environment,
    hiringPartners: []
  };
}

/** Validate a client-supplied AI role snapshot before locking it. */
function validRoleSnapshot(r) {
  return !!r
    && typeof r.id === 'string' && r.id.trim()
    && typeof r.title === 'string' && r.title.trim()
    && Number.isFinite(Number(r.entryStipend)) && Number(r.entryStipend) > 0
    && Number.isFinite(Number(r.firstYearSalary)) && Number(r.firstYearSalary) > 0;
}

function insertLock(sessionId, role) {
  db.prepare('DELETE FROM locked_goals WHERE session_id = ?').run(sessionId);
  db.prepare(`
    INSERT INTO locked_goals
    (session_id, role_id, role_title, nsqf_level, entry_stipend, first_year_salary, five_year_trajectory, ncrf_degree_bridge, work_environment, role_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    String(role.id),
    String(role.title),
    Number(role.nsqfLevel) || 4,
    Number(role.entryStipend),
    Number(role.firstYearSalary),
    Number(role.fiveYearSalary) || Number(role.firstYearSalary),
    String(role.ncrfCreditBridge || ''),
    String(role.workEnvironment || ''),
    JSON.stringify(role)
  );
  touch(sessionId);
}

function touch(sessionId) {
  try {
    db.prepare(`UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(sessionId);
  } catch { /* table without updated_at — ignore */ }
}

/** Where does this consultation resume? */
function resumePhaseOf({ accord, mediationTurns, parentProfile, lockedGoal, match }) {
  if (accord) return 'accord';
  if (mediationTurns && mediationTurns.length) return 'mediation';
  if (parentProfile) return 'mediation';
  if (lockedGoal) return 'parent';
  if (match) return 'careers';
  return 'intake';
}

// Health check & DB statistics
app.get('/api/health', (req, res) => {
  const sessionCount = db.prepare('SELECT count(*) as count FROM sessions').get()?.count || 0;
  const qaCount = db.prepare('SELECT count(*) as count FROM qa_interactions').get()?.count || 0;
  const accordCount = db.prepare('SELECT count(*) as count FROM family_accords').get()?.count || 0;

  res.json({
    status: 'ONLINE',
    service: 'Patho MSDE AI Skilling & Tripartite Mediation Gateway',
    database: 'SQLite (Node.js 22 Native node:sqlite)',
    stats: {
      activeSessions: sessionCount,
      storedQAPairs: qaCount,
      signedAccords: accordCount
    }
  });
});

// Create or retrieve session
app.post('/api/sessions', (req, res) => {
  const { studentName = 'Rahul', district = 'Pune', state = 'Maharashtra' } = req.body;
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const insertStmt = db.prepare(`
    INSERT INTO sessions (id, student_name, district, state)
    VALUES (?, ?, ?, ?)
  `);
  insertStmt.run(sessionId, studentName, district, state);

  res.json({
    sessionId,
    studentName,
    district,
    state,
    createdAt: new Date().toISOString()
  });
});

// Recent consultations with resume state (chat-history style)
app.get('/api/sessions', (req, res) => {
  const rows = db.prepare(`SELECT * FROM sessions ORDER BY updated_at DESC, created_at DESC LIMIT 20`).all();
  res.json({
    sessions: rows.map(s => {
      const answered = db.prepare(`SELECT count(*) as c FROM qa_interactions WHERE session_id = ? AND status = 'answered'`).get(s.id)?.c || 0;
      const pendingQ = db.prepare(`SELECT id FROM qa_interactions WHERE session_id = ? AND status = 'asked' LIMIT 1`).get(s.id);
      const lockedGoal = db.prepare('SELECT role_title FROM locked_goals WHERE session_id = ?').get(s.id);
      const parentProfile = db.prepare('SELECT id FROM parent_profiles WHERE session_id = ?').get(s.id);
      const mediationCount = db.prepare('SELECT count(*) as c FROM mediation_sessions WHERE session_id = ?').get(s.id)?.c || 0;
      const accord = db.prepare('SELECT accord_code FROM family_accords WHERE session_id = ?').get(s.id);
      const matchRow = db.prepare('SELECT session_id FROM session_matches WHERE session_id = ?').get(s.id);
      return {
        sessionId: s.id,
        studentName: s.student_name,
        district: s.district,
        state: s.state,
        updatedAt: s.updated_at || s.created_at,
        answered,
        hasPending: !!pendingQ,
        hasLock: !!lockedGoal,
        lockedTitle: lockedGoal?.role_title || null,
        hasParent: !!parentProfile,
        mediationTurns: mediationCount,
        hasAccord: !!accord,
        accordCode: accord?.accord_code || null,
        resumePhase: resumePhaseOf({
          accord,
          mediationTurns: new Array(mediationCount),
          parentProfile,
          lockedGoal,
          match: matchRow
        })
      };
    })
  });
});

// Get session complete state (everything needed to resume without AI calls)
app.get('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const qaInteractions = db.prepare('SELECT * FROM qa_interactions WHERE session_id = ? ORDER BY step_number ASC').all(id);
  const lockedGoal = db.prepare('SELECT * FROM locked_goals WHERE session_id = ?').get(id);
  const parentProfile = db.prepare('SELECT * FROM parent_profiles WHERE session_id = ?').get(id);
  const mediationTurns = db.prepare('SELECT * FROM mediation_sessions WHERE session_id = ? ORDER BY turn_number ASC').all(id);
  const accord = db.prepare('SELECT * FROM family_accords WHERE session_id = ?').get(id);
  const matchRow = db.prepare('SELECT * FROM session_matches WHERE session_id = ?').get(id);

  res.json({
    session,
    qaInteractions,
    lockedGoal,
    parentProfile,
    mediationTurns,
    accord: accord ? {
      ...accord,
      micro_credentials: JSON.parse(accord.micro_credentials_json || '[]'),
      milestones: JSON.parse(accord.milestones_json || '[]'),
      degreeOptions: JSON.parse(accord.degree_options_json || '[]'),
      courses: JSON.parse(accord.courses_json || '[]'),
      sources: JSON.parse(accord.sources_json || '[]')
    } : null,
    match: matchRow ? {
      roles: JSON.parse(matchRow.roles_json || '[]'),
      grounded: matchRow.grounded === 1
    } : null,
    intakeSummary: session.intake_summary || null,
    resumePhase: resumePhaseOf({ accord, mediationTurns, parentProfile, lockedGoal, match: matchRow })
  });
});

// Student Intake — fixed life-goal opener, then AI follow-ups in the
// learner's language. Questions are logged at creation (status='asked');
// answers flip them to 'answered'. Pending questions are re-served from
// the DB, so refreshes and resumes cost zero AI calls.
app.post('/api/chat/student-intake', async (req, res) => {
  const { sessionId, userResponse = '', questionId, lang = 'en' } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const studentName = session.student_name || 'Rahul';
  const l = ['hi', 'mr'].includes(lang) ? lang : 'en';

  const pendingRow = () => db.prepare(
    `SELECT * FROM qa_interactions WHERE session_id = ? AND status = 'asked' ORDER BY step_number DESC LIMIT 1`
  ).get(sessionId);
  const answeredCount = () => db.prepare(
    `SELECT count(*) as c FROM qa_interactions WHERE session_id = ? AND status = 'answered'`
  ).get(sessionId)?.c || 0;
  const toTurn = (row) => ({
    sessionId,
    stepNumber: row.step_number,
    counselorMessage: row.question_text,
    questionId: row.question_id,
    questionType: row.question_type,
    options: JSON.parse(row.options_json || '[]'),
    traitVector: row.extracted_traits_json ? JSON.parse(row.extracted_traits_json) : undefined,
    isIntakeComplete: false
  });
  const completeTurn = () => {
    const s = db.prepare('SELECT intake_summary FROM sessions WHERE id = ?').get(sessionId);
    return {
      sessionId,
      stepNumber: 4,
      counselorMessage: s?.intake_summary || 'Assessment complete.',
      questionId: 'q_complete',
      questionType: 'text',
      options: [],
      isIntakeComplete: true,
      summaryMessage: s?.intake_summary || undefined
    };
  };

  // 1. Log the answer against its pending question
  if (userResponse) {
    const target = (questionId
      ? db.prepare(`SELECT * FROM qa_interactions WHERE session_id = ? AND question_id = ? AND status = 'asked' ORDER BY step_number DESC LIMIT 1`).get(sessionId, questionId)
      : null) || pendingRow();
    if (!target) {
      return res.status(400).json({ error: 'No pending question — reload the consultation to continue.' });
    }
    db.prepare(`UPDATE qa_interactions SET user_response = ?, status = 'answered' WHERE id = ?`).run(userResponse, target.id);
    touch(sessionId);
  }

  // 2. Four answered questions completes the assessment
  if (answeredCount() >= 4) {
    return res.json(completeTurn());
  }

  // 3. Re-serve a pending question (cache — no AI call)
  const pending = pendingRow();
  if (pending) {
    return res.json(toTurn(pending));
  }

  // 4. Create the next question: fixed life-goal opener first, AI after
  const step = answeredCount() + 1;
  let turn;
  if (step === 1) {
    turn = fixedFirstQuestion(l);
  } else {
    if (!aiRequired(res)) return;
    const history = db.prepare(
      `SELECT question_text as question, user_response as answer FROM qa_interactions WHERE session_id = ? AND status = 'answered' ORDER BY step_number ASC`
    ).all(sessionId);
    turn = await generateDynamicIntakeTurn({
      stepNumber: step,
      userResponse: '',
      studentName,
      history,
      lang: l,
      lifeGoal: history[0]?.answer || ''
    });
    if (!turn) {
      return res.status(502).json({
        error: 'AI_GENERATION_FAILED',
        message: 'The counsellor could not compose the next question. Check the API key/quota and retry.'
      });
    }
    if (turn.summary_message && turn.is_intake_complete) {
      db.prepare(`UPDATE sessions SET intake_summary = ? WHERE id = ?`).run(turn.summary_message, sessionId);
    }
  }

  db.prepare(`
    INSERT INTO qa_interactions
    (session_id, phase, step_number, question_id, question_text, question_type, options_json, user_response, extracted_traits_json, status)
    VALUES (?, 'STUDENT_INTAKE', ?, ?, ?, ?, ?, '', ?, 'asked')
  `).run(
    sessionId,
    step,
    turn.question_id,
    turn.counselor_message,
    turn.question_type,
    JSON.stringify(turn.options || []),
    turn.trait_vector ? JSON.stringify(turn.trait_vector) : null
  );
  touch(sessionId);

  res.json({
    sessionId,
    stepNumber: step,
    counselorMessage: turn.counselor_message,
    questionId: turn.question_id,
    questionType: turn.question_type,
    options: turn.options,
    traitVector: turn.trait_vector,
    isIntakeComplete: turn.is_intake_complete,
    summaryMessage: turn.summary_message
  });
});

// Career matching — researched live with Google Search grounding from the
// student's own intake digest. No role registry; every card is generated.
// Results are cached per session: refreshes and resumes never re-research
// unless { force: true } is sent.
app.post('/api/careers/match', async (req, res) => {
  const { sessionId, force } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }
  if (!aiRequired(res)) return;

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!force) {
    const cached = db.prepare('SELECT * FROM session_matches WHERE session_id = ?').get(sessionId);
    if (cached) {
      return res.json({
        roles: JSON.parse(cached.roles_json || '[]'),
        personalized: true,
        grounded: cached.grounded === 1,
        cached: true,
        nationalFramework: 'National Skills Qualifications Framework (NSQF)',
        creditBridgeStandard: 'National Credit Framework (NCrF) UGC & NCVET'
      });
    }
  }

  const qa = db.prepare(
    'SELECT question_text, user_response FROM qa_interactions WHERE session_id = ? AND status = ? ORDER BY step_number ASC'
  ).all(sessionId, 'answered');
  if (!qa.length) {
    return res.status(400).json({ error: 'Complete the aptitude assessment first.' });
  }

  const found = await researchRoles({
    studentName: session.student_name || 'Learner',
    district: session.district || 'Pune',
    state: session.state || 'Maharashtra',
    intakeDigest: qa.map(q => `Q: ${q.question_text}\nA: ${q.user_response}`).join('\n\n').slice(0, 2000)
  });
  if (!found) {
    return res.status(502).json({
      error: 'AI_GENERATION_FAILED',
      message: 'Career research failed. Check the API key/quota and retry.'
    });
  }

  db.prepare(`
    INSERT OR REPLACE INTO session_matches (session_id, roles_json, grounded)
    VALUES (?, ?, ?)
  `).run(sessionId, JSON.stringify(found.roles), found.grounded ? 1 : 0);
  touch(sessionId);

  res.json({
    roles: found.roles,
    personalized: true,
    grounded: found.grounded,
    cached: false,
    nationalFramework: 'National Skills Qualifications Framework (NSQF)',
    creditBridgeStandard: 'National Credit Framework (NCrF) UGC & NCVET'
  });
});

// Student locks an AI-researched role (full snapshot sealed from parent intake)
app.post('/api/careers/lock', (req, res) => {
  const { sessionId, role } = req.body;
  if (!sessionId || !role) {
    return res.status(400).json({ error: 'Missing sessionId or role' });
  }
  if (!validRoleSnapshot(role)) {
    return res.status(400).json({ error: 'Invalid role snapshot' });
  }

  insertLock(sessionId, role);

  res.json({
    success: true,
    message: 'Career goal locked securely. Status is sealed from parental intake.',
    lockedGoal: role
  });
});

// Blind Parent Concern Intake (Independent & Isolated)
app.post('/api/parent/intake', (req, res) => {
  const { 
    sessionId, 
    parentName = "Rahul's Father", 
    relation = 'Father', 
    language = 'mr-IN', 
    minSalaryMonthly = 18000, 
    maxCommuteKm = 35, 
    stigmaConcerns = [], 
    safetyConcerns = [], 
    rawVoiceTranscript = '' 
  } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  db.prepare('DELETE FROM parent_profiles WHERE session_id = ?').run(sessionId);

  const parentStmt = db.prepare(`
    INSERT INTO parent_profiles
    (session_id, parent_name, relation, language, min_salary_monthly, max_commute_km, stigma_concerns_json, safety_concerns_json, raw_voice_transcript)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  parentStmt.run(
    sessionId,
    parentName,
    relation,
    language,
    minSalaryMonthly,
    maxCommuteKm,
    JSON.stringify(stigmaConcerns),
    JSON.stringify(safetyConcerns),
    rawVoiceTranscript
  );
  touch(sessionId);

  res.json({
    success: true,
    message: 'Parental baseline constraints captured in blind isolation.',
    parentProfile: {
      parentName,
      relation,
      language,
      minSalaryMonthly,
      maxCommuteKm,
      stigmaConcerns,
      safetyConcerns
    }
  });
});

// Live AI Tripartite Mediation Turn
app.post('/api/mediation/turn', async (req, res) => {
  const { sessionId, turnNumber = 1, parentDoubts = '' } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  const lockedRow = db.prepare('SELECT * FROM locked_goals WHERE session_id = ?').get(sessionId);
  const parentProfile = db.prepare('SELECT * FROM parent_profiles WHERE session_id = ?').get(sessionId);

  const selectedRole = roleFromRow(lockedRow);
  if (!selectedRole) {
    return res.status(400).json({ error: 'Lock a career role before mediation.' });
  }
  if (!aiRequired(res)) return;

  const prior = db.prepare(
    'SELECT objection_type FROM mediation_sessions WHERE session_id = ? ORDER BY turn_number ASC'
  ).all(sessionId).map(r => r.objection_type).filter(Boolean);
  const mediationResponse = await generateDynamicMediationTurn({
    studentName: session?.student_name || 'Rahul',
    lockedRole: selectedRole,
    parentProfile,
    turnNumber,
    parentDoubts,
    priorStages: prior
  });
  if (!mediationResponse) {
    return res.status(502).json({
      error: 'AI_GENERATION_FAILED',
      message: 'The mediator could not draft this proceeding. Check the API key/quota and retry.'
    });
  }

  // Record mediation turn into DB (full snapshot for refresh-safe resume)
  db.prepare(`
    INSERT INTO mediation_sessions (session_id, turn_number, speaker, message, objection_type, policy_proof_cited, turn_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    turnNumber,
    mediationResponse.speaker,
    mediationResponse.message,
    mediationResponse.stage,
    mediationResponse.title,
    JSON.stringify(mediationResponse)
  );
  touch(sessionId);

  res.json(mediationResponse);
});

// Final Family Accord Signing & Generation
app.post('/api/accord/sign', async (req, res) => {
  const { sessionId, instituteSelected = 'Government ITI Aundh (Pune)' } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  const lockedRow = db.prepare('SELECT * FROM locked_goals WHERE session_id = ?').get(sessionId);
  const parentProfile = db.prepare('SELECT * FROM parent_profiles WHERE session_id = ?').get(sessionId);

  const role = roleFromRow(lockedRow);
  if (!role) {
    return res.status(400).json({ error: 'Lock a career role before signing the accord.' });
  }
  if (!aiRequired(res)) return;
  const accordCode = 'MSDE-ACCORD-' + Math.floor(100000 + Math.random() * 900000);

  // Deep researched roadmap: each milestone answers a parent fear with
  // evidence, plus degree and course ladders from live search.
  const plan = await researchRoadmap({
    studentName: session?.student_name || 'Learner',
    role,
    instituteSelected,
    parentProfile: parentProfile ? {
      parent_name: parentProfile.parent_name,
      relation: parentProfile.relation,
      language: parentProfile.language,
      min_salary_monthly: parentProfile.min_salary_monthly,
      max_commute_km: parentProfile.max_commute_km,
      stigma: (JSON.parse(parentProfile.stigma_concerns_json || '[]')).join(', '),
      safety: (JSON.parse(parentProfile.safety_concerns_json || '[]')).join(', ')
    } : null
  });
  if (!plan) {
    return res.status(502).json({
      error: 'AI_GENERATION_FAILED',
      message: 'The roadmap research failed. Check the API key/quota and retry.'
    });
  }
  const { milestones, degreeOptions, courses } = plan;

  db.prepare('DELETE FROM family_accords WHERE session_id = ?').run(sessionId);

  db.prepare(`
    INSERT INTO family_accords
    (session_id, accord_code, student_name, parent_name, career_title, training_institute, naps_stipend_committed, target_yr1_salary, micro_credentials_json, milestones_json, degree_options_json, courses_json, sources_json, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SIGNED')
  `).run(
    sessionId,
    accordCode,
    session?.student_name || 'Rahul',
    parentProfile?.parent_name || "Rahul's Father",
    role.title,
    instituteSelected,
    role.entryStipend,
    role.firstYearSalary,
    JSON.stringify(courses.map(c => `${c.title} (${c.provider}, ${c.duration})`)),
    JSON.stringify(milestones),
    JSON.stringify(degreeOptions),
    JSON.stringify(courses),
    JSON.stringify(plan.sources)
  );
  touch(sessionId);

  res.json({
    success: true,
    accordCode,
    personalized: true,
    grounded: plan.grounded,
    accord: {
      accordCode,
      studentName: session?.student_name || 'Rahul',
      parentName: parentProfile?.parent_name || "Rahul's Father",
      careerTitle: role.title,
      nsqfLevel: role.nsqfLevel,
      instituteSelected,
      napsStipendCommitted: role.entryStipend,
      targetYr1Salary: role.firstYearSalary,
      workEnvironment: role.workEnvironment,
      ncrfBridge: role.ncrfCreditBridge,
      milestones,
      degreeOptions,
      courses,
      sources: plan.sources,
      signedDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  });
});

// Public Accord View
app.get('/api/accords/:accordCode', (req, res) => {
  const { accordCode } = req.params;
  const accord = db.prepare('SELECT * FROM family_accords WHERE accord_code = ?').get(accordCode);
  if (!accord) {
    return res.status(404).json({ error: 'Accord not found' });
  }
  res.json({
    ...accord,
    micro_credentials: JSON.parse(accord.micro_credentials_json || '[]'),
    milestones: JSON.parse(accord.milestones_json || '[]'),
    degreeOptions: JSON.parse(accord.degree_options_json || '[]'),
    courses: JSON.parse(accord.courses_json || '[]')
  });
});

// Live Database Inspector for Evaluators
app.get('/api/db/inspector', (req, res) => {
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10').all();
  const qa = db.prepare('SELECT * FROM qa_interactions ORDER BY id DESC LIMIT 20').all();
  const goals = db.prepare('SELECT * FROM locked_goals ORDER BY id DESC LIMIT 10').all();
  const parents = db.prepare('SELECT * FROM parent_profiles ORDER BY id DESC LIMIT 10').all();
  const mediation = db.prepare('SELECT * FROM mediation_sessions ORDER BY id DESC LIMIT 20').all();
  const accords = db.prepare('SELECT * FROM family_accords ORDER BY id DESC LIMIT 10').all();

  res.json({
    sessions,
    qaInteractions: qa,
    lockedGoals: goals,
    parentProfiles: parents,
    mediationSessions: mediation,
    familyAccords: accords
  });
});

// 1-Click Evaluator Entry (Rahul - Pune): session + family baseline are the
// fixed persona; the roles and lock are researched live by the AI.
app.post('/api/demo/load-rahul', async (req, res) => {
  if (!aiRequired(res)) return;
  const sessionId = 'demo_rahul_pune_' + Date.now();

  db.prepare(`
    INSERT INTO sessions (id, student_name, education_level, district, state, mobility_preference)
    VALUES (?, 'Rahul', '10th Standard Pass', 'Pune', 'Maharashtra', 'Local (<35 km)')
  `).run(sessionId);

  db.prepare(`
    INSERT INTO parent_profiles
    (session_id, parent_name, relation, language, min_salary_monthly, max_commute_km, stigma_concerns_json, safety_concerns_json, raw_voice_transcript)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    "Shri Rameshwar (Rahul's Father)",
    "Father",
    "mr-IN",
    18000,
    35,
    JSON.stringify(['Social Prestige: Roadside mechanic work is dirty and has low respect among relatives', 'Need formal government recognition']),
    JSON.stringify(['Physical safety in factory', 'Job security']),
    'आम्हाला मुलगा किमान १८,००० रुपये महिना कमवायला हवा. रस्त्यावरच्या गॅरेजमध्ये काम नको, समाजात मान हवा.'
  );

  const found = await researchRoles({
    studentName: 'Rahul',
    district: 'Pune',
    state: 'Maharashtra',
    intakeDigest: '10th pass from Pune near the Chakan industrial corridor. Loves disassembling bike engines and mechanical tools by hand; first instinct with an EV breakdown is to test battery voltage and wiring; wants 80% hands-on shop-floor training; must stay within daily commute (<35 km).'
  });
  if (!found) {
    return res.status(502).json({
      error: 'AI_GENERATION_FAILED',
      message: 'Demo role research failed. Check the API key/quota and retry.'
    });
  }

  insertLock(sessionId, found.roles[0]);
  db.prepare(`
    INSERT OR REPLACE INTO session_matches (session_id, roles_json, grounded)
    VALUES (?, ?, ?)
  `).run(sessionId, JSON.stringify(found.roles), found.grounded ? 1 : 0);
  touch(sessionId);

  res.json({
    success: true,
    message: 'Rahul (Pune) persona ready — roles researched live.',
    sessionId,
    roles: found.roles,
    lockedRoleId: found.roles[0].id,
    grounded: found.grounded,
    personaNote: 'Rahul · 10th pass, Pune — hands-on mechanical affinity, EV curiosity, local commute (<35 km).'
  });
});

// AI status (read-only, env-based). The raw key is NEVER exposed here.
// Secrets live in server/.env — see server/.env.example.
app.get('/api/config/ai', (req, res) => {
  res.json(getAiConfig());
});

// Reference Datasets
app.get('/api/datasets/wages', (req, res) => res.json(WAGE_BENCHMARKS));
app.get('/api/datasets/itis', (req, res) => res.json(ITI_CLUSTERS));
app.get('/api/datasets/objections', (req, res) => res.json(OBJECTION_SCENARIOS));

app.listen(PORT, () => {
  console.log(`🚀 Patho MSDE Mediation Engine listening on http://localhost:${PORT}`);
});
