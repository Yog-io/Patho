/**
 * Native Gemini client (v1beta) with Google Search grounding.
 * Used for everything that must be RESEARCHED, not recalled:
 * real NSQF-aligned roles, stipends, hiring corridors, ITIs,
 * degree ladders (B.Voc / NCrF) and short courses.
 *
 * Secrets come only from server/.env (GEMINI_API_KEY / AI_API_KEY).
 * Every function returns null when the AI is unreachable or returns
 * unusable data — routes turn that into an explicit error, never
 * silent dummy content.
 */
import { extractJson } from './aiService.js';

function env() {
  return {
    key: process.env.GROQ_API_KEY || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
    model: process.env.AI_MODEL || 'openai/gpt-oss-120b',
    baseUrl: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1',
    grounding: String(process.env.AI_GROUNDING ?? 'true').toLowerCase() !== 'false'
      && !['0', 'no'].includes(String(process.env.AI_GROUNDING ?? '').toLowerCase())
  };
}

export function isGroundingOn() {
  return env().grounding;
}

async function callGroqCompatible(model, key, baseUrl, system, user, temperature, maxTokens, signal) {
  const fullUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const res = await fetch(fullUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: model || 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature,
      max_tokens: Math.min(maxTokens, 8192)
    })
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.warn(`Groq API ${res.status}:`, errText.slice(0, 300));
    return null;
  }
  try {
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { text, sources: [] };
  } catch {
    return null;
  }
}

/**
 * Universal Research Generator — supports Groq (openai/gpt-oss-120b) and Gemini.
 * Returns { text, sources } or null.
 */
export async function geminiGenerate({ system, user, temperature = 0.5, maxTokens = 8192, useSearch = true, timeoutMs = 90000 }) {
  const { key, model, baseUrl, grounding } = env();
  if (!key.trim()) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // If using Groq key or Groq endpoint
    if (key.startsWith('gsk_') || baseUrl.includes('groq.com') || process.env.GROQ_API_KEY) {
      return await callGroqCompatible(model, key, baseUrl, system, user, temperature, maxTokens, controller.signal);
    }

    const withTools = useSearch && grounding;
    const body = {
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature, responseMimeType: 'application/json', maxOutputTokens: maxTokens }
    };
    if (withTools) body.tools = [{ google_search: {} }];

    // Pass 1: with search grounding (when enabled)
    let data = await callGemini(model, key, body, controller.signal);
    // Pass 2: model rejected the search tool → retry plain so the
    // session still completes (sources will be empty = ungrounded).
    if (!data && withTools) {
      const plain = { ...body };
      delete plain.tools;
      console.warn('Search grounding rejected, retrying without tools.');
      data = await callGemini(model, key, plain, controller.signal);
    }
    if (!data) return null;

    const cand = (data.candidates || [])[0];
    if (!cand) return null;
    const text = ((cand.content || {}).parts || []).map(p => p.text || '').join('');
    const chunks = (((cand.groundingMetadata || {}).groundingChunks) || []);
    const sources = [];
    for (const c of chunks) {
      const web = c.web || {};
      if (web.uri && !sources.some(s => s.url === web.uri)) {
        sources.push({ title: web.title || web.uri, url: web.uri });
      }
    }
    return { text, sources: sources.slice(0, 8) };
  } catch (err) {
    console.warn('AI generation call failed:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(model, key, body, signal) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.warn(`Gemini ${res.status}:`, errText.slice(0, 300));
    return null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

const num = v => (Number.isFinite(Number(v)) ? Number(v) : null);

/**
 * Research 4 real vocational roles for THIS student, grounded in live
 * search (NSQF QP codes, NAPS stipends, salaries, hiring corridors,
 * nearby ITIs, NCrF degree ladders). Returns { roles, grounded }.
 */
export async function researchRoles({ studentName, district, state, intakeDigest }) {
  const out = await geminiGenerate({
    system: `You are an MSDE research analyst with live Google Search. Recommend ONLY real, verifiable Indian vocational careers (NSQF Qualification Packs, ITI trades, apprenticeship-linked roles). Every fact — QP code, stipend, salary, hiring company, institute — must reflect current Indian skilling reality. Return ONLY the JSON specified. Never invent QP codes.`,
    user: `Student: ${studentName} (${district}, ${state}). Intake digest:\n${intakeDigest}\n\nResearch and return ONLY this JSON:\n{\n  "roles": [\n    {\n      "id": "url-safe-slug",\n      "title": "exact trade/role title",\n      "nsqfLevel": 3-6,\n      "sector": "sector name",\n      "qpCode": "real QP code like ASC/Q1411 or UNKNOWN",\n      "description": "2-line role summary",\n      "dayToDay": "concrete daily work + tools + workplace",\n      "workEnvironment": "factory/lab reality in one line",\n      "academicPrerequisite": "entry qualification",\n      "entryStipend": monthly NAPS stipend number (INR),\n      "firstYearSalary": monthly Year-1 salary number (INR),\n      "threeYearSalary": monthly Year-3 salary number (INR),\n      "fiveYearSalary": monthly Year-5 salary number (INR),\n      "ncrfCreditBridge": "one line on the NCrF/B.Voc/diploma ladder for THIS trade",\n      "accreditedTrades": ["ITI trades that feed this role"],\n      "hiringPartners": ["real companies hiring near ${district}]"],\n      "topClusters": ["industrial corridors near the student"],\n      "badge": "short highlight like 'High Growth (EV 38% YoY)'",\n      "matchScore": 0-100 fit for THIS student,\n      "aiPitch": "one line why THIS student fits"\n    }\n  ]\n}\nExactly 4 roles, best match first.`,
    temperature: 0.4,
    maxTokens: 8192
  });
  if (!out) return null;
  const parsed = extractJson(out.text);
  const list = parsed?.roles;
  if (!Array.isArray(list)) return null;

  const roles = [];
  for (const r of list) {
    const entryStipend = num(r.entryStipend);
    const firstYearSalary = num(r.firstYearSalary);
    if (!r || typeof r.title !== 'string' || !r.title.trim() || !entryStipend || !firstYearSalary) continue;
    roles.push({
      id: typeof r.id === 'string' && r.id.trim() ? r.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : `role-${roles.length + 1}`,
      title: r.title.trim(),
      nsqfLevel: [3, 4, 5, 6].includes(Number(r.nsqfLevel)) ? Number(r.nsqfLevel) : 4,
      sector: String(r.sector || 'Vocational & Skilling'),
      qpCode: String(r.qpCode || 'UNKNOWN'),
      description: String(r.description || ''),
      dayToDay: String(r.dayToDay || ''),
      workEnvironment: String(r.workEnvironment || ''),
      academicPrerequisite: String(r.academicPrerequisite || ''),
      entryStipend,
      firstYearSalary,
      threeYearSalary: num(r.threeYearSalary) || Math.round(firstYearSalary * 1.6),
      fiveYearSalary: num(r.fiveYearSalary) || Math.round(firstYearSalary * 2.4),
      ncrfCreditBridge: String(r.ncrfCreditBridge || ''),
      accreditedTrades: Array.isArray(r.accreditedTrades) ? r.accreditedTrades.map(String).slice(0, 6) : [],
      hiringPartners: Array.isArray(r.hiringPartners) ? r.hiringPartners.map(String).slice(0, 6) : [],
      topClusters: Array.isArray(r.topClusters) ? r.topClusters.map(String).slice(0, 5) : [],
      badge: String(r.badge || 'AI-researched match'),
      matchScore: Math.max(0, Math.min(100, num(r.matchScore) ?? 70)),
      aiPitch: typeof r.aiPitch === 'string' ? r.aiPitch : '',
      sources: out.sources
    });
  }
  if (roles.length < 3) return null;
  roles.sort((a, b) => b.matchScore - a.matchScore);
  return { roles: roles.slice(0, 4), grounded: out.sources.length > 0 };
}

/**
 * Research a deep 3-phase roadmap + degree/course ladder for the locked
 * role, answering EACH parent constraint with evidence. Returns
 * { milestones, degreeOptions, courses, grounded }.
 */
export async function researchRoadmap({ studentName, role, instituteSelected, parentProfile }) {
  const parent = parentProfile || {};
  const out = await geminiGenerate({
    system: `You are an MSDE research analyst with live Google Search. Build roadmaps from REAL schemes (NAPS, PMKVY, STRIVE), REAL institutes, REAL degree ladders (B.Voc lateral entry, NCrF credits, diplomas) and REAL short courses — all verifiable for India 2024-2026. Return ONLY the JSON specified.`,
    user: `Student ${studentName} locked: ${role.title} (NSQF ${role.nsqfLevel}, stipend ₹${role.entryStipend}/mo, Year-1 ₹${role.firstYearSalary}/mo, Year-5 ₹${role.fiveYearSalary}/mo; bridge: ${role.ncrfCreditBridge}). Training at: ${instituteSelected}.\nParent (${parent.parent_name || 'Parent'}, ${parent.relation || 'Father'}, lang ${parent.language || 'mr-IN'}): needs ≥₹${parent.min_salary_monthly || 18000}/mo, commute ≤${parent.max_commute_km || 35} km, prestige fears: ${parent.stigma || 'social respect'}, safety fears: ${parent.safety || 'workplace safety'}.\n\nResearch and return ONLY this JSON:\n{\n  "milestones": [\n    { "period": "Month 0 - 12 (…)", "goal": "concrete step with real institute/scheme names", "financialCommitment": "₹…/mo with scheme source", "parentWhy": "2 lines: which parent fear this answers and how, with the hard figure", "evidence": "scheme/fact cited, e.g. NAPS DBT stipend" },\n    { "period": "Month 12 - 24 (…)", "goal": "…", "financialCommitment": "…", "parentWhy": "…", "evidence": "…" },\n    { "period": "Year 3 - 5 (…)", "goal": "…", "financialCommitment": "…", "parentWhy": "…", "evidence": "…" }\n  ],\n  "degreeOptions": [\n    { "title": "real degree/diploma, e.g. B.Voc Automotive Mechatronics", "provider": "who offers it / entry route", "mode": "e.g. Work-integrated / lateral entry", "duration": "e.g. 2 years via lateral entry", "entryRoute": "how THIS student enters from ${role.title}" }\n  ],\n  "courses": [\n    { "title": "real short course/micro-credential", "provider": "e.g. PMKVY / Sector Skill Council / OEM academy", "duration": "e.g. 6 months", "detail": "wage effect or skill gained" }\n  ]\n}\nExactly 3 milestones; 3-4 degreeOptions; 3-4 courses. Ground salary/scheme/institute facts with search.`,
    temperature: 0.5,
    maxTokens: 8192
  });
  if (!out) return null;
  const parsed = extractJson(out.text);
  const ms = parsed?.milestones;
  if (!Array.isArray(ms) || ms.length < 3) return null;
  const milestones = ms.slice(0, 3).map(m => ({
    period: String(m.period || ''),
    goal: String(m.goal || ''),
    financialCommitment: String(m.financialCommitment || ''),
    parentWhy: String(m.parentWhy || ''),
    evidence: String(m.evidence || '')
  }));
  if (milestones.some(m => !m.period || !m.goal || !m.financialCommitment || !m.parentWhy)) return null;
  const pick = (arr, keys) =>
    (Array.isArray(arr) ? arr : []).slice(0, 4)
      .map(o => Object.fromEntries(keys.map(k => [k, String(o?.[k] || '')])))
      .filter(o => o.title);
  return {
    milestones,
    degreeOptions: pick(parsed?.degreeOptions, ['title', 'provider', 'mode', 'duration', 'entryRoute']),
    courses: pick(parsed?.courses, ['title', 'provider', 'duration', 'detail']),
    grounded: out.sources.length > 0,
    sources: out.sources
  };
}
