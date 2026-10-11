// Dedicated System Prompts for each Tripartite Mediation Phase
// (All content below is AI-generated on the go — no predefined Q&A.)
export const SYSTEM_PROMPTS = {
  STUDENT_INTAKE: `You are Aarav Sir, a senior, empathetic Vocational Career Counselor at the Ministry of Skill Development and Entrepreneurship (MSDE), Government of India.
Your mission is to uncover the student's authentic technical inclinations, hands-on mechanical/electrical/computational aptitude, and mobility limits without intimidating them with abstract theory.
Be warm, encouraging, culturally relatable (Tier-2/3 India tone), and practical.
For every turn, diagnose one dimension:
1. Academic baseline & comfort with hands-on vs book theory.
2. Practical inclination (taking apart motor gears, wiring electronic kits, writing logic, or CAD drawings).
3. Problem-solving reflex under a real mechanical/electrical scenario.
4. Mobility & relocation appetite (local district, within state, national corridor, or international).
Always provide the response as JSON:
{
  "counselor_message": "Friendly conversational message from Aarav Sir",
  "question_id": "unique_question_slug",
  "question_type": "mcq" | "scenario" | "text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "trait_vector": { "mechanical": 0-100, "electrical": 0-100, "spatial": 0-100, "computational": 0-100, "mobility": 0-100 },
  "is_intake_complete": boolean
}`,

  PARENT_BLIND_INTAKE: `You are Prerna Didi / Shri Patil, an empathetic MSDE Family Counselor conducting a blind, independent intake with an Indian parent.
The student's locked career choice is strictly confidential to eliminate stigma-driven prejudgment.
Your goal is to honor the parent's sacrifices and capture their raw expectations:
1. Minimum monthly salary the child must earn within 1-2 years to support the family.
2. Mobility limits (daily commute vs staying in hostel).
3. Prestige & social standing anxieties (fear of relatives looking down, insistence on traditional degrees).
4. Workplace safety apprehensions (factory danger, dirt, grease).
Speak with deep cultural respect and warmth in their regional language (Marathi, Hindi, or English).`,

  TRIPARTITE_MEDIATION: `You are the National Skilling Ombudsman and Senior AI Mediator appointed by the Ministry of Skill Development & Entrepreneurship (MSDE).
You are conducting a live tripartite reconciliation session between a student and their parent.
Your objective is to achieve family consensus on the student's locked vocational path by:
1. Validating parental sacrifices and deep love for their child.
2. Revealing the student's choice through the exact lens of the parent's stated priorities (clean corporate manufacturing vs roadside garage).
3. Debunking prestige stigma with verified MSDE wage datasets vs unemployed BA/B.Com graduates.
4. Mitigating economic gaps by proposing certified micro-credential wage boosters (e.g., CNC or EV battery diagnostics boosting starting packages beyond the parent's target).
5. Explaining the National Credit Framework (NCrF) degree bridge allowing the student to earn a university B.Voc degree while working full-time.`,

  ACCORD_GENERATOR: `You are the MSDE Legal & Accreditation Officer drafting the official 1-Page "Family Decision Accord" (Parivar Kaushal Samjhauta).
You synthesize the locked role, local accredited ITIs/PMKKs, NAPS stipend guarantee, milestone roadmap, and parental agreement terms into a formal, binding family pact.`
};

/**
 * AI configuration — secrets come ONLY from server/.env, never from the
 * browser. Supported variables (see server/.env.example):
 *   GEMINI_API_KEY (primary) / AI_API_KEY (fallback), AI_BASE_URL,
 *   AI_MODEL, AI_ENABLED.
 * Nothing here ever returns the raw key to callers.
 */
export function getAiConfig() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
  return {
    apiBaseUrl: process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelName: process.env.AI_MODEL || 'gemini-2.0-flash',
    useCustomApi: isAiEnabled(),
    hasApiKey: apiKey.trim().length > 0
  };
}

export function isAiEnabled() {
  const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
  const flag = String(process.env.AI_ENABLED ?? 'true').toLowerCase();
  return key.trim().length > 0 && flag !== 'false' && flag !== '0' && flag !== 'no';
}

/**
 * Universal OpenAI-Compatible API Client
 * Supports Gemini (via its OpenAI-compatible endpoint), OpenAI, Groq,
 * Ollama, Together AI, OpenRouter, vLLM.
 */
export async function callOpenAICompatibleApi({ systemPrompt, messages, temperature = 0.7, timeoutMs = 25000 }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';

  if (isAiEnabled() && apiKey.trim() !== '') {
    const { apiBaseUrl, modelName } = getAiConfig();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const fullUrl = `${apiBaseUrl.replace(/\/+$/, '')}/chat/completions`;
      const response = await fetch(fullUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('AI API returned error, falling back to static engine:', errorText);
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const parsed = extractJson(content);
        if (parsed) return parsed;
        console.warn('AI returned non-JSON content, falling back to static engine.');
      }
    } catch (err) {
      console.warn('AI endpoint unreachable, falling back to static engine:', err.message);
    } finally {
      clearTimeout(timer);
    }
  }

  return null; // Signals fallback to autonomous static responder
}

/** Lenient JSON extraction — tolerates fences / prose around the object. */
export function extractJson(content) {
  if (!content || typeof content !== 'string') return null;
  try {
    return JSON.parse(content);
  } catch { /* try to salvage */ }
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1);
  if (!candidate || !candidate.includes('{')) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

/* Static predefined engines removed — every question and response is AI-generated on the go. */

/**
 * The ONE fixed opening question: what the learner really wants in life.
 * Everything after it is composed by the AI from this anchor.
 */
export const FIXED_Q1 = {
  id: 'q0_life_goal',
  type: 'mcq',
  text: {
    en: 'What do you really want in life? There is no wrong answer — pick what pulls you most.',
    hi: 'आप जीवन में वास्तव में क्या चाहते हैं? कोई गलत उत्तर नहीं है — जो सबसे ज़्यादा खींचता है वही चुनें।',
    mr: 'तुम्हाला आयुष्यात खरोखर काय हवे आहे? कोणतेही उत्तर चुकीचे नाही — जे सर्वाधिक ओढते तेच निवडा.'
  },
  options: {
    en: [
      'A secure job — private company or government service',
      'My own business — shop, trade or startup',
      'Farming or agriculture-allied work',
      'Uniformed services — police, army, railways, paramilitary',
      'Something else — I want to explore options first'
    ],
    hi: [
      'सुरक्षित नौकरी — प्राइवेट कंपनी या सरकारी सेवा',
      'अपना खुद का व्यवसाय — दुकान, व्यापार या स्टार्टअप',
      'खेती या कृषि-संबद्ध कार्य',
      'वर्दीधारी सेवाएँ — पुलिस, सेना, रेलवे, अर्धसैनिक बल',
      'कुछ और — पहले विकल्प देखना चाहता/चाहती हूँ'
    ],
    mr: [
      'सुरक्षित नोकरी — खासगी कंपनी किंवा शासकीय सेवा',
      'स्वतःचा व्यवसाय — दुकान, व्यापार किंवा स्टार्टअप',
      'शेती किंवा शेतीपूरक काम',
      'गणवेशधारी सेवा — पोलीस, सैन्य, रेल्वे, निमलष्करी दल',
      'काहीतरी वेगळे — आधी पर्याय पाहायचे आहेत'
    ]
  }
};

export function fixedFirstQuestion(lang = 'en') {
  const l = ['hi', 'mr'].includes(lang) ? lang : 'en';
  return {
    counselor_message: FIXED_Q1.text[l],
    question_id: FIXED_Q1.id,
    question_type: FIXED_Q1.type,
    options: FIXED_Q1.options[l],
    trait_vector: undefined,
    is_intake_complete: false
  };
}

const INTAKE_LANG = { hi: 'Hindi (Devanagari script)', mr: 'Marathi (Devanagari script)', en: 'simple English' };

/* Static mediation engine removed — every proceeding is AI-generated on the go. */

/* ── Dynamic (API-key) generators — each returns null on any failure ── */

const INTAKE_SCHEMA_HINT = `Return ONLY a JSON object with exactly these keys:
{
  "counselor_message": "warm 1-2 line reaction + the next question, addressed by name",
  "question_id": "short_unique_slug",
  "question_type": "one of mcq | scenario | text",
  "options": ["4 concrete answer options" ],
  "trait_vector": { "mechanical": 0-100, "electrical": 0-100, "spatial": 0-100, "computational": 0-100, "mobility": 0-100 },
  "is_intake_complete": false (true ONLY on the 4th and final question),
  "summary_message": "present only when is_intake_complete is true: 1-line aptitude synthesis"
}`;

function validIntakeTurn(t) {
  if (!t || typeof t.counselor_message !== 'string' || !t.counselor_message.trim()) return false;
  if (typeof t.question_id !== 'string' || !t.question_id.trim()) return false;
  if (!['mcq', 'scenario', 'text'].includes(t.question_type)) return false;
  if (!Array.isArray(t.options)) return false;
  if (t.question_type !== 'text' && t.options.length < 2) return false;
  return true;
}

/**
 * Dynamic student-intake turn. History = prior [{question, answer}] pairs.
 * Diagnoses ONE dimension per turn across a 4-question arc.
 */
export async function generateDynamicIntakeTurn({ stepNumber, userResponse, studentName, history = [], lang = 'en', lifeGoal = '' }) {
  const l = ['hi', 'mr'].includes(lang) ? lang : 'en';
  const histText = history.length
    ? history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join('\n')
    : '(no prior answers)';
  const ai = await callOpenAICompatibleApi({
    systemPrompt: SYSTEM_PROMPTS.STUDENT_INTAKE,
    temperature: 0.8,
    messages: [{
      role: 'user',
      content: `Student: ${studentName}. Write in ${INTAKE_LANG[l]}. We are on question ${Math.min(stepNumber, 4)} of a 4-question arc. Question 1 (fixed life-goal opener) was answered: "${lifeGoal || 'unknown'}". Every follow-up must be tailored to that life-goal anchor.\nConversation so far:\n${histText}\nLatest answer: ${userResponse || '(none yet)'}\n${INTAKE_SCHEMA_HINT}`
    }]
  });
  if (!validIntakeTurn(ai)) return null;
  return {
    counselor_message: ai.counselor_message,
    question_id: ai.question_id,
    question_type: ai.question_type,
    options: ai.options.map(String).slice(0, 6),
    trait_vector: ai.trait_vector && typeof ai.trait_vector === 'object' ? ai.trait_vector : undefined,
    is_intake_complete: ai.is_intake_complete === true && stepNumber >= 4,
    summary_message: typeof ai.summary_message === 'string' ? ai.summary_message : undefined
  };
}

/**
 * AI mediation turn — 4-stage arc
 * (VALIDATION → THE_REVEAL → OBJECTION_HANDLING → CONSENSUS_BRIDGE),
 * drafted fresh each call from the locked AI-researched role and the
 * family's stated constraints. Returns null when unusable.
 */
export async function generateDynamicMediationTurn({ studentName, lockedRole, parentProfile, turnNumber, parentDoubts, priorStages = [] }) {
  const role = lockedRole || {};
  const hiring = Array.isArray(role.hiringPartners) ? role.hiringPartners.join(', ') : '';
  const stage = turnNumber === 1 ? 'VALIDATION' : turnNumber === 2 ? 'THE_REVEAL' : turnNumber === 3 ? 'OBJECTION_HANDLING' : 'CONSENSUS_BRIDGE';
  const boosterHint = turnNumber === 3
    ? ` Also propose ONE concrete micro-credential wage booster (real course type + duration + monthly wage uplift figure) as "boosterOffered": { "title", "wageBoost": "+ ₹X / month", "projectedYear1Wage": "₹A - ₹B / month", "explanation" }.`
    : '';
  const ai = await callOpenAICompatibleApi({
    systemPrompt: SYSTEM_PROMPTS.TRIPARTITE_MEDIATION,
    temperature: 0.7,
    messages: [{
      role: 'user',
      content: `Write mediation proceeding #${turnNumber} (stage: ${stage}).
Student: ${studentName}. Locked role: ${role.title || 'the chosen vocational role'} (NSQF ${role.nsqfLevel || '?'}, entry stipend ₹${Number(role.entryStipend || 0).toLocaleString('en-IN')}/mo, Year-1 ₹${Number(role.firstYearSalary || 0).toLocaleString('en-IN')}/mo, 5-yr ₹${Number(role.fiveYearSalary || 0).toLocaleString('en-IN')}/mo, ${role.workEnvironment || ''}; hiring: ${hiring}; degree bridge: ${role.ncrfCreditBridge || ''}).
Parent: ${parentProfile?.parent_name || 'Parent'} (${parentProfile?.relation || 'Father'}), language ${parentProfile?.language || 'mr-IN'}, needs ≥₹${Number(parentProfile?.min_salary_monthly || 18000).toLocaleString('en-IN')}/mo, commute ≤${parentProfile?.max_commute_km || 35} km.
Prior stages covered: ${priorStages.join(', ') || 'none'}.
Latest parent doubt to answer: ${parentDoubts || '(none — advance the stage arc)'}.${boosterHint}
Return ONLY JSON: { "title": "short proceeding title", "message": "the mediator's address (respectful, evidence-led, 120-200 words)", "vernacularSummary": "2-line summary in ${parentProfile?.language === 'hi-IN' ? 'Hindi (Devanagari)' : parentProfile?.language === 'en-IN' ? 'simple English' : 'Marathi (Devanagari)'}"${turnNumber === 3 ? ', "boosterOffered": { "title": "…", "wageBoost": "+ ₹X / month", "projectedYear1Wage": "₹A - ₹B / month", "explanation": "…" }' : ''} }`
    }]
  });
  if (!ai || typeof ai.message !== 'string' || !ai.message.trim()) return null;
  const b = ai.boosterOffered;
  return {
    speaker: 'ai_mediator',
    stage,
    title: typeof ai.title === 'string' && ai.title.trim() ? ai.title : stage,
    message: ai.message,
    vernacularSummary: typeof ai.vernacularSummary === 'string' ? ai.vernacularSummary : undefined,
    workEnvironment: turnNumber === 2 ? role.workEnvironment : undefined,
    hiringPartners: turnNumber === 2 && Array.isArray(role.hiringPartners) ? role.hiringPartners : undefined,
    boosterOffered: b && typeof b.title === 'string' && typeof b.explanation === 'string' ? {
      title: b.title,
      wageBoost: String(b.wageBoost || ''),
      projectedYear1Wage: String(b.projectedYear1Wage || ''),
      explanation: b.explanation
    } : undefined,
    readyForAccord: turnNumber >= 4
  };
}

/* Role ranking and roadmap generation live in gemini.js (search-grounded research). */
