/**
 * SkillSarthi AI — functional app overlay.
 * Editorial workspace layout (rail + fluid main) in the landing's
 * visual language. The intake is a counselling assessment sheet —
 * numbered ledger, examiner-style option rows — not a messenger.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccordSigned,
  CareerRole,
  ConsultationSummary,
  IntakeTurn,
  ItiDistrict,
  MediationTurn,
  api,
  inr,
} from './lib/api';

type Lang = 'en' | 'hi' | 'mr';
type Phase = 'history' | 'profile' | 'intake' | 'careers' | 'parent' | 'mediation' | 'accord';

const STR: Record<Lang, Record<string, string>> = {
  en: {
    appTitle: 'SkillSarthi AI',
    appSub: 'Choose a career. Decide together.',
    close: 'Back to stories',
    demo: 'Load Rahul (Pune) demo',
    db: 'SQLite DB',
    online: 'Backend online',
    offline: 'Backend offline — start it on :5001',
    stepper1: 'Student',
    stepper2: 'Careers',
    stepper3: 'Family',
    stepper4: 'Mediation',
    stepper5: 'Accord',
    journey: 'Journey',
    record: 'Session record',
    recordNote: 'Every answer is written to the SQLite vault as it happens.',
    lockedGoal: 'Locked goal',
    baseline: 'Family baseline',
    evidence: 'Evidence rail',
    aptitude: 'Aptitude snapshot',
    profileH: 'Start with the student',
    profileP: 'A 30-second profile. Aarav Sir then conducts a short aptitude assessment — practical, no textbook fear.',
    name: 'Student name',
    district: 'District',
    state: 'State',
    begin: 'Begin assessment →',
    intakeH: 'Aptitude assessment with Aarav Sir',
    intakeP: 'Four short questions. Pick the closest answer — each one is filed into the official counsellor record.',
    qOf: 'Question',
    tapHint: 'Select the closest answer',
    writeOwn: 'Or write your own answer',
    typeAnswer: 'Write it in your own words…',
    send: 'File answer',
    intakeDone: 'Aptitude mapped — see NSQF matches →',
    careersH: 'NSQF career matches',
    careersP: 'Matched to Levels 3–6 with stipends, 5-year growth and the NCrF degree ladder. Lock one — it stays sealed from the parent intake.',
    lock: 'Lock this goal',
    locked: 'Locked ✓ sealed from family intake',
    toParent: 'Continue to blind family intake →',
    parentH: 'Blind family intake',
    parentP: 'Parent answers WITHOUT seeing the locked choice. Raw salary needs, commute limits and prestige fears only.',
    parentName: 'Parent name',
    relation: 'Relation',
    language: 'Preferred language',
    minSalary: 'Minimum salary needed (₹/month)',
    commute: 'Max daily commute (km)',
    stigma: 'Prestige concerns (comma separated)',
    safety: 'Safety concerns (comma separated)',
    voiceNote: 'Voice note / raw words (Marathi, Hindi, English)',
    saveParent: 'Save family baseline →',
    medH: 'Tripartite mediation',
    medP: 'The AI Ombudsman honours the parent, reveals the choice inside a clean-room corporate reality, and answers every doubt with MSDE wage proof.',
    nextTurn: 'Next proceeding →',
    doubtsPh: 'Note a parent doubt (e.g. “salary too low?”)…',
    askDoubt: 'Raise doubt',
    readyAccord: 'Both sides aligned — build the accord →',
    accordH: 'Roadmap & Family Decision Accord',
    accordP: 'Milestones, NAPS stipend guarantee, institute and micro-credentials — signed, printable, WhatsApp-ready.',
    institute: 'Training institute',
    sign: 'Sign Family Accord',
    print: 'Print / PDF',
    whatsapp: 'Share on WhatsApp',
    copy: 'Copy accord code',
    copied: 'Copied!',
    sealed: 'Sealed — parent cannot see this until the reveal.',
    loading: 'Working…',
    enterChamber: 'Open the proceedings — Step 1: Validation →',
    histH: 'Consultations',
    histP: 'Recent guidance sessions. Continue exactly where you left off — nothing is asked twice, nothing researched twice.',
    newConsult: '+ Start new consultation',
    continueBtn: 'Continue →',
    consults: 'Consultations',
    researchAgain: '↻ Research again with live search',
    emptyHist: 'No consultations yet. Start the first one — the life-goal question takes 10 seconds.',
    settings: 'AI key',
    aiTitle: 'Live AI configuration',
    aiLive: 'Live AI active — turns generate on the go',
    aiOff: 'Static engine — no key on server',
    aiP: 'Keys live in server/.env (never in the browser). Edit the file on the machine running the backend, then restart the server.',
    aiEnvSample: 'GEMINI_API_KEY=AIza…\nAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai\nAI_MODEL=gemini-2.0-flash\nAI_ENABLED=true',
    aiBase: 'API base URL',
    aiKey: 'API key',
    aiModel: 'Model',
    aiEnable: 'Use live AI for new turns',
    aiSave: 'Save configuration',
    aiSaved: 'Saved ✓ live AI will drive new turns',
    aiKeyHint: 'For Gemini use https://generativelanguage.googleapis.com/v1beta/openai as the base URL.',
    aiPersonalized: 'AI-personalized for this student',
    aiStatic: 'Static registry (no key)',
    aiMatch: 'match',
  },
  hi: {
    appTitle: 'स्किलसारथी AI',
    appSub: 'करियर चुनें। साथ मिलकर तय करें।',
    close: 'कहानियों पर वापस',
    demo: 'राहुल (पुणे) डेमो लोड करें',
    db: 'SQLite DB',
    online: 'बैकएंड ऑनलाइन',
    offline: 'बैकएंड ऑफ़लाइन — :5001 पर शुरू करें',
    stepper1: 'विद्यार्थी',
    stepper2: 'करियर',
    stepper3: 'परिवार',
    stepper4: 'मध्यस्थता',
    stepper5: 'समझौता',
    journey: 'यात्रा',
    record: 'सत्र रिकॉर्ड',
    recordNote: 'हर उत्तर तुरंत SQLite रिकॉर्ड में दर्ज होता है।',
    lockedGoal: 'चुना लक्ष्य',
    baseline: 'पारिवारिक आधार',
    evidence: 'प्रमाण पटल',
    aptitude: 'रुझान झलक',
    profileH: 'विद्यार्थी से शुरुआत करें',
    profileP: '30 सेकंड का परिचय। फिर आरव सर संक्षिप्त योग्यता मूल्यांकन करते हैं।',
    name: 'विद्यार्थी का नाम',
    district: 'ज़िला',
    state: 'राज्य',
    begin: 'मूल्यांकन शुरू करें →',
    intakeH: 'आरव सर के साथ योग्यता मूल्यांकन',
    intakeP: 'चार छोटे प्रश्न। निकटतम उत्तर चुनें — हर उत्तर आधिकारिक रिकॉर्ड में दर्ज होता है।',
    qOf: 'प्रश्न',
    tapHint: 'निकटतम उत्तर चुनें',
    writeOwn: 'या अपने शब्दों में लिखें',
    typeAnswer: 'अपने शब्दों में लिखें…',
    send: 'उत्तर दर्ज करें',
    intakeDone: 'रुझान तैयार — NSQF विकल्प देखें →',
    careersH: 'NSQF करियर विकल्प',
    careersP: 'लेवल 3–6, वजीफा, 5-साल की वृद्धि और NCrF डिग्री सीढ़ी सहित। एक चुनें — यह परिवार से गुप्त रहेगा।',
    lock: 'यह लक्ष्य चुनें',
    locked: 'चुना गया ✓ परिवार से गुप्त',
    toParent: 'पारिवारिक राय दर्ज करें →',
    parentH: 'परिवार की स्वतंत्र राय',
    parentP: 'माता-पिता चुना हुआ विकल्प देखे बिना अपनी उम्मीदें बताते हैं।',
    parentName: 'अभिभावक का नाम',
    relation: 'संबंध',
    language: 'पसंदीदा भाषा',
    minSalary: 'न्यूनतम आवश्यक वेतन (₹/माह)',
    commute: 'अधिकतम दैनिक दूरी (किमी)',
    stigma: 'सामाजिक चिंताएँ (अल्पविराम से अलग करें)',
    safety: 'सुरक्षा चिंताएँ (अल्पविराम से अलग करें)',
    voiceNote: 'मौखिक बात / मूल शब्द',
    saveParent: 'पारिवारिक आधार सहेजें →',
    medH: 'त्रिपक्षीय मध्यस्थता',
    medP: 'AI मध्यस्थ माता-पिता का सम्मान करता है, साफ-सुथरे कॉर्पोरेट सच के साथ विकल्प बताता है।',
    nextTurn: 'अगली कार्यवाही →',
    doubtsPh: 'माता-पिता की शंका लिखें…',
    askDoubt: 'शंका उठाएँ',
    readyAccord: 'दोनों सहमत — समझौता बनाएँ →',
    accordH: 'रोडमैप और पारिवारिक समझौता',
    accordP: 'चरण, NAPS वजीफा, संस्थान और माइक्रो-प्रमाणन — हस्ताक्षरित, प्रिंट योग्य।',
    institute: 'प्रशिक्षण संस्थान',
    sign: 'पारिवारिक समझौते पर हस्ताक्षर',
    print: 'प्रिंट / PDF',
    whatsapp: 'WhatsApp पर भेजें',
    copy: 'समझौता कोड कॉपी करें',
    copied: 'कॉपी हुआ!',
    sealed: 'गुप्त — खुलासे तक परिवार यह नहीं देख सकता।',
    loading: 'काम चल रहा…',
    enterChamber: 'कार्यवाही खोलें — चरण 1: स्वीकृति →',
    histH: 'परामर्श सूची',
    histP: 'हाल के मार्गदर्शन सत्र। जहाँ छोड़ा था वहीं से जारी रखें — कुछ दोबारा नहीं पूछा या खोजा जाएगा।',
    newConsult: '+ नया परामर्श शुरू करें',
    continueBtn: 'जारी रखें →',
    consults: 'परामर्श',
    researchAgain: '↻ लाइव खोज से पुनः अनुसंधान',
    emptyHist: 'अभी कोई परामर्श नहीं। पहला शुरू करें — जीवन-लक्ष्य प्रश्न में 10 सेकंड लगते हैं।',
    settings: 'AI कुंजी',
    aiTitle: 'लाइव AI सेटिंग',
    aiLive: 'लाइव AI सक्रिय — चरण तुरंत बनते हैं',
    aiOff: 'स्थिर इंजन — सर्वर पर कोई कुंजी नहीं',
    aiP: 'कुंजियाँ server/.env में रहती हैं (ब्राउज़र में कभी नहीं)। बैकएंड वाली मशीन पर फ़ाइल संपादित करें, फिर सर्वर पुनः शुरू करें।',
    aiEnvSample: 'GEMINI_API_KEY=AIza…\nAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai\nAI_MODEL=gemini-2.0-flash\nAI_ENABLED=true',
    aiBase: 'API बेस URL',
    aiKey: 'API कुंजी',
    aiModel: 'मॉडल',
    aiEnable: 'नए चरणों के लिए लाइव AI',
    aiSave: 'सेटिंग सहेजें',
    aiSaved: 'सहेजा गया ✓ नए चरण लाइव AI से बनेंगे',
    aiKeyHint: 'Gemini के लिए बेस URL: https://generativelanguage.googleapis.com/v1beta/openai',
    aiPersonalized: 'इस विद्यार्थी हेतु AI-निर्मित',
    aiStatic: 'स्थिर सूची (कोई कुंजी नहीं)',
    aiMatch: 'मेल',
  },
  mr: {
    appTitle: 'स्किलसारथी AI',
    appSub: 'करिअर निवडा. एकत्र ठरवा.',
    close: 'गोष्टींकडे परत',
    demo: 'राहुल (पुणे) डेमो भरा',
    db: 'SQLite DB',
    online: 'बॅकएंड ऑनलाइन',
    offline: 'बॅकएंड ऑफलाइन — :5001 वर सुरू करा',
    stepper1: 'विद्यार्थी',
    stepper2: 'करिअर',
    stepper3: 'कुटुंब',
    stepper4: 'मध्यस्थी',
    stepper5: 'करार',
    journey: 'प्रवास',
    record: 'सत्र नोंद',
    recordNote: 'प्रत्येक उत्तर त्वरित SQLite नोंदीत जमा होते.',
    lockedGoal: 'निवडलेले ध्येय',
    baseline: 'कुटुंबाचा आधार',
    evidence: 'पुरावा पटल',
    aptitude: 'कल झलक',
    profileH: 'विद्यार्थ्यापासून सुरुवात',
    profileP: '३० सेकंदांची ओळख. मग आरव सर संक्षिप्त कलमापन घेतात.',
    name: 'विद्यार्थ्याचे नाव',
    district: 'जिल्हा',
    state: 'राज्य',
    begin: 'मूल्यमापन सुरू करा →',
    intakeH: 'आरव सरांसोबत कलमापन',
    intakeP: 'चार छोटे प्रश्न. जवळचे उत्तर निवडा — प्रत्येक उत्तर अधिकृत नोंदीत जमा होते.',
    qOf: 'प्रश्न',
    tapHint: 'जवळचे उत्तर निवडा',
    writeOwn: 'किंवा स्वतःच्या शब्दांत लिहा',
    typeAnswer: 'स्वतःच्या शब्दांत लिहा…',
    send: 'उत्तर नोंदवा',
    intakeDone: 'कल तयार — NSQF पर्याय पाहा →',
    careersH: 'NSQF करिअर पर्याय',
    careersP: 'लेव्हल ३–६, विद्यावेतन, ५ वर्षांची वाढ आणि NCrF पदवी शिडीसह. एक निवडा — कुटुंबापासून गुप्त राहील.',
    lock: 'हे ध्येय निवडा',
    locked: 'निवडले ✓ कुटुंबापासून गुप्त',
    toParent: 'कुटुंबाची स्वतंत्र माहिती भरा →',
    parentH: 'कुटुंबाची स्वतंत्र माहिती',
    parentP: 'पालक निवडलेला पर्याय न पाहता अपेक्षा सांगतात.',
    parentName: 'पालकाचे नाव',
    relation: 'नाते',
    language: 'पसंतीची भाषा',
    minSalary: 'किमान आवश्यक पगार (₹/महिना)',
    commute: 'जास्तीत जास्त दैनिक प्रवास (किमी)',
    stigma: 'प्रतिष्ठेच्या चिंता (स्वल्पविरामाने)',
    safety: 'सुरक्षिततेच्या चिंता (स्वल्पविरामाने)',
    voiceNote: 'तोंडी मत / मूळ शब्द',
    saveParent: 'कुटुंबाचा आधार जतन करा →',
    medH: 'त्रिपक्षीय मध्यस्थी',
    medP: 'AI मध्यस्थ पालकांचा सन्मान करतो, स्वच्छ कॉर्पोरेट वास्तवात निवड उघड करतो.',
    nextTurn: 'पुढील कामकाज →',
    doubtsPh: 'पालकांची शंका लिहा…',
    askDoubt: 'शंका विचारा',
    readyAccord: 'दोन्ही सहमत — करार तयार करा →',
    accordH: 'रोडमॅप आणि कुटुंब करार',
    accordP: 'टप्पे, NAPS विद्यावेतन हमी, संस्था आणि सूक्ष्म-प्रमाणपत्रे — स्वाक्षरीसह, प्रिंटयोग्य.',
    institute: 'प्रशिक्षण संस्था',
    sign: 'कुटुंब करारावर सही करा',
    print: 'प्रिंट / PDF',
    whatsapp: 'WhatsApp वर पाठवा',
    copy: 'करार कोड कॉपी करा',
    copied: 'कॉपी झाले!',
    sealed: 'गुप्त — खुलाशापर्यंत कुटुंब हे पाहू शकत नाही.',
    loading: 'काम सुरू…',
    enterChamber: 'कामकाज उघडा — पाऊल १: स्वीकृती →',
    histH: 'सल्लामसलत यादी',
    histP: 'अलीकडील मार्गदर्शन सत्रे. जिथे थांबला होतात तिथूनच पुढे जा — काहीही पुन्हा विचारले वा शोधले जाणार नाही.',
    newConsult: '+ नवीन सल्लामसलत सुरू करा',
    continueBtn: 'पुढे जा →',
    consults: 'सल्लामसलती',
    researchAgain: '↻ लाइव्ह शोधाने पुन्हा संशोधन',
    emptyHist: 'अजून सल्लामसलत नाही. पहिली सुरू करा — जीवन-ध्येय प्रश्नाला १० सेकंद लागतात.',
    settings: 'AI की',
    aiTitle: 'लाइव्ह AI सेटिंग',
    aiLive: 'लाइव्ह AI सक्रिय — पावले लगेच तयार होतात',
    aiOff: 'स्थिर इंजिन — सर्व्हरवर की नाही',
    aiP: 'की server/.env मध्ये असतात (ब्राउझरमध्ये कधीही नाहीत). बॅकएंड चालणाऱ्या मशीनवर फाइल संपादित करा, मग सर्व्हर पुन्हा सुरू करा.',
    aiEnvSample: 'GEMINI_API_KEY=AIza…\nAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai\nAI_MODEL=gemini-2.0-flash\nAI_ENABLED=true',
    aiBase: 'API बेस URL',
    aiKey: 'API की',
    aiModel: 'मॉडेल',
    aiEnable: 'नवीन पावलांसाठी लाइव्ह AI',
    aiSave: 'सेटिंग जतन करा',
    aiSaved: 'जतन झाले ✓ नवीन पावले लाइव्ह AI मधून येतील',
    aiKeyHint: 'Gemini साठी बेस URL: https://generativelanguage.googleapis.com/v1beta/openai',
    aiPersonalized: 'या विद्यार्थ्यासाठी AI-निर्मित',
    aiStatic: 'स्थिर यादी (की नाही)',
    aiMatch: 'जुळणी',
  },
};

const PHASES: Phase[] = ['history', 'profile', 'intake', 'careers', 'parent', 'mediation', 'accord'];
const STEP_LABEL = [-1, 0, 0, 1, 2, 3, 4];

function useHashOpen(): [boolean, () => void, () => void] {
  const [open, setOpen] = useState(() => window.location.hash === '#app');
  useEffect(() => {
    const onHash = () => setOpen(window.location.hash === '#app');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const show = useCallback(() => {
    window.location.hash = '#app';
    setOpen(true);
  }, []);
  const hide = useCallback(() => {
    history.pushState(null, '', window.location.pathname);
    setOpen(false);
  }, []);
  return [open, show, hide];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
function stripLead(s: string): string {
  return s.replace(/^[A-D][).]\s*/, '');
}

export default function App() {
  const [open, , closeOverlay] = useHashOpen();
  const [lang, setLang] = useState<Lang>('en');
  const t = STR[lang];

  const [phase, setPhase] = useState<Phase>('history');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [consults, setConsults] = useState<ConsultationSummary[]>([]);
  const [consultsLoading, setConsultsLoading] = useState(false);

  const [studentName, setStudentName] = useState('Rahul');
  const [district, setDistrict] = useState('Pune');
  const [stateName, setStateName] = useState('Maharashtra');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('ss_session') || '');

  const [ledger, setLedger] = useState<{ q: string; a: string }[]>([]);
  const [turn, setTurn] = useState<IntakeTurn | null>(null);
  const [draft, setDraft] = useState('');
  const currentRef = useRef<HTMLDivElement>(null);

  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [lockedId, setLockedId] = useState('');
  const [rolesPersonalized, setRolesPersonalized] = useState(false);
  const [rolesGrounded, setRolesGrounded] = useState(false);

  const [parentName, setParentName] = useState("Rahul's Father");
  const [relation, setRelation] = useState('Father');
  const [plang, setPlang] = useState('mr-IN');
  const [minSalary, setMinSalary] = useState(18000);
  const [commute, setCommute] = useState(35);
  const [stigma, setStigma] = useState('Social prestige, need government recognition');
  const [safety, setSafety] = useState('Physical safety in factory, job security');
  const [voice, setVoice] = useState('');
  const [parentSaved, setParentSaved] = useState(false);

  const [mediation, setMediation] = useState<MediationTurn[]>([]);
  const [turnNo, setTurnNo] = useState(1);
  const [doubt, setDoubt] = useState('');

  const [itis, setItis] = useState<ItiDistrict[]>([]);
  const [institute, setInstitute] = useState('Government ITI Aundh (Pune)');
  const [accord, setAccord] = useState<AccordSigned | null>(null);
  const [copied, setCopied] = useState(false);

  const lockedRole = useMemo(() => roles.find((r) => r.id === lockedId), [roles, lockedId]);
  const activeStep = STEP_LABEL[PHASES.indexOf(phase)];

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [turn?.questionId]);

  useEffect(() => {
    if (open) refreshConsults();
  }, [open]);

  useEffect(() => {
    if (open && sessionId) localStorage.setItem('ss_session', sessionId);
  }, [open, sessionId]);

  if (!open) return null;

  const fail = (e: unknown) =>
    setError(e instanceof Error ? e.message : 'Something went wrong. Is the backend on :5001?');

  const uiLang = lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en';

  async function refreshConsults() {
    setConsultsLoading(true);
    try {
      setConsults((await api.consultations()).sessions);
    } catch (e) {
      fail(e);
    } finally {
      setConsultsLoading(false);
    }
  }

  function resetWorkspace() {
    setLedger([]);
    setTurn(null);
    setDraft('');
    setRoles([]);
    setLockedId('');
    setRolesPersonalized(false);
    setRolesGrounded(false);
    setParentSaved(false);
    setMediation([]);
    setTurnNo(1);
    setDoubt('');
    setAccord(null);
    setError('');
  }

  function startNew() {
    resetWorkspace();
    setSessionId('');
    localStorage.removeItem('ss_session');
    setPhase('profile');
  }

  /** Open a past consultation exactly where it left off — DB only, zero AI calls. */
  async function openConsultation(id: string) {
    setBusy(true);
    setError('');
    try {
      const d = await api.sessionDetail(id);
      resetWorkspace();
      setSessionId(id);
      localStorage.setItem('ss_session', id);
      setStudentName(String(d.session.student_name || 'Learner'));
      setDistrict(String(d.session.district || 'Pune'));
      setStateName(String(d.session.state || 'Maharashtra'));

      const answered = d.qaInteractions.filter((q) => q.status === 'answered');
      setLedger(answered.map((q) => ({ q: q.question_text, a: q.user_response })));
      const asked = d.qaInteractions.filter((q) => q.status === 'asked');
      if (asked.length) {
        const r = asked[asked.length - 1];
        setTurn({
          sessionId: id,
          stepNumber: r.step_number,
          counselorMessage: r.question_text,
          questionId: r.question_id,
          questionType: (r.question_type === 'scenario' ? 'scenario' : r.question_type === 'text' ? 'text' : 'mcq'),
          options: JSON.parse(r.options_json || '[]'),
          traitVector: r.extracted_traits_json ? JSON.parse(r.extracted_traits_json) : undefined,
          isIntakeComplete: false,
        });
      } else if (answered.length >= 4) {
        setTurn({
          sessionId: id,
          stepNumber: 4,
          counselorMessage: d.intakeSummary || 'Assessment complete.',
          questionId: 'q_complete',
          questionType: 'text',
          options: [],
          isIntakeComplete: true,
          summaryMessage: d.intakeSummary || undefined,
        });
      }

      if (d.match) {
        setRoles(d.match.roles);
        setRolesPersonalized(true);
        setRolesGrounded(!!d.match.grounded);
      }

      let snap: CareerRole | null = null;
      if (d.lockedGoal) {
        const row = d.lockedGoal as unknown as Record<string, string>;
        try {
          snap = JSON.parse(row.role_json || 'null');
        } catch { snap = null; }
        if (!snap || !snap.title) {
          snap = {
            id: row.role_id, title: row.role_title, nsqfLevel: Number(row.nsqf_level) || 4,
            sector: '', qpCode: '', description: '', dayToDay: '', workEnvironment: row.work_environment,
            academicPrerequisite: '', entryStipend: Number(row.entry_stipend) || 0,
            firstYearSalary: Number(row.first_year_salary) || 0,
            threeYearSalary: Number(row.five_year_trajectory) || 0,
            fiveYearSalary: Number(row.five_year_trajectory) || 0,
            ncrfCreditBridge: row.ncrf_degree_bridge, accreditedTrades: [],
            hiringPartners: [], topClusters: [], badge: '',
          };
        }
        setLockedId(snap.id);
        if (!d.match) {
          setRoles([snap]);
          setRolesPersonalized(true);
        }
      }

      if (d.parentProfile) {
        const p = d.parentProfile as unknown as Record<string, string | number>;
        setParentName(String(p.parent_name || ''));
        setRelation(String(p.relation || 'Father'));
        setPlang(String(p.language || 'mr-IN'));
        setMinSalary(Number(p.min_salary_monthly) || 18000);
        setCommute(Number(p.max_commute_km) || 35);
        try { setStigma((JSON.parse(String(p.stigma_concerns_json || '[]')) as string[]).join(', ')); } catch { /* keep */ }
        try { setSafety((JSON.parse(String(p.safety_concerns_json || '[]')) as string[]).join(', ')); } catch { /* keep */ }
        setVoice(String(p.raw_voice_transcript || ''));
        setParentSaved(true);
      }

      if (d.mediationTurns.length) {
        setMediation(d.mediationTurns.map((row) => {
          const r = row as unknown as Record<string, string>;
          try {
            return JSON.parse(r.turn_json || 'null') as MediationTurn;
          } catch {
            return { speaker: 'ai_mediator', stage: r.objection_type, title: r.policy_proof_cited, message: r.message } as MediationTurn;
          }
        }));
        setTurnNo(d.mediationTurns.length + 1);
      }

      if (d.accord) {
        const a = d.accord;
        const created = String((a as unknown as Record<string, string>).created_at || '').slice(0, 10);
        setAccord({
          success: true,
          accordCode: a.accord_code,
          personalized: true,
          accord: {
            accordCode: a.accord_code,
            studentName: a.student_name,
            parentName: a.parent_name,
            careerTitle: a.career_title,
            nsqfLevel: snap?.nsqfLevel ?? 4,
            instituteSelected: String((a as unknown as Record<string, string>).training_institute || ''),
            napsStipendCommitted: Number((a as unknown as Record<string, string>).naps_stipend_committed) || 0,
            targetYr1Salary: Number((a as unknown as Record<string, string>).target_yr1_salary) || 0,
            workEnvironment: snap?.workEnvironment ?? '',
            ncrfBridge: snap?.ncrfCreditBridge ?? '',
            milestones: a.milestones,
            degreeOptions: a.degreeOptions,
            courses: a.courses,
            sources: a.sources,
            signedDate: created,
          },
        });
      }

      if (d.resumePhase === 'accord') ensureItis();
      setPhase(d.resumePhase);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function beginProfile() {
    setBusy(true);
    setError('');
    try {
      const s = await api.createSession({ studentName: studentName || 'Rahul', district, state: stateName });
      setSessionId(s.sessionId);
      localStorage.setItem('ss_session', s.sessionId);
      const first = await api.studentIntake({ sessionId: s.sessionId, lang: uiLang });
      setTurn(first);
      setLedger([]);
      setPhase('intake');
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function answerIntake(text: string) {
    if (!turn || !sessionId || busy) return;
    const clean = text.trim();
    if (!clean) return;
    const asked = turn.counselorMessage;
    setBusy(true);
    setError('');
    setDraft('');
    try {
      const next = await api.studentIntake({
        sessionId,
        lang: uiLang,
        userResponse: clean,
        questionId: turn.questionId,
      });
      setLedger((prev) => [...prev, { q: asked, a: clean }]);
      setTurn(next);
      if (next.isIntakeComplete) {
        const rec = await api.matchRoles(sessionId);
        setRoles(rec.roles);
        setRolesPersonalized(!!rec.personalized);
        setRolesGrounded(!!rec.grounded);
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function lockRole(id: string) {
    if (!sessionId) return;
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    setBusy(true);
    setError('');
    try {
      await api.lockCareer({ sessionId, role });
      setLockedId(id);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function saveParent() {
    if (!sessionId) return;
    setBusy(true);
    setError('');
    try {
      const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
      await api.parentIntake({
        sessionId,
        parentName,
        relation,
        language: plang,
        minSalaryMonthly: Number(minSalary),
        maxCommuteKm: Number(commute),
        stigmaConcerns: split(stigma),
        safetyConcerns: split(safety),
        rawVoiceTranscript: voice,
      });
      setParentSaved(true);
      setMediation([]);
      setTurnNo(1);
      setPhase('mediation');
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function nextMediation(customDoubt?: string) {
    if (!sessionId) return;
    setBusy(true);
    setError('');
    try {
      const m = await api.mediationTurn({ sessionId, turnNumber: turnNo, parentDoubts: customDoubt ?? doubt });
      setMediation((prev) => [...prev, m]);
      setTurnNo((n) => n + 1);
      setDoubt('');
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function sign() {
    if (!sessionId) return;
    setBusy(true);
    setError('');
    try {
      const a = await api.signAccord({ sessionId, instituteSelected: institute });
      setAccord(a);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function loadDemo() {
    setBusy(true);
    setError('');
    try {
      const d = await api.loadRahul();
      setSessionId(d.sessionId);
      localStorage.setItem('ss_session', d.sessionId);
      setRoles(d.roles);
      setRolesPersonalized(true);
      setRolesGrounded(!!d.grounded);
      setLockedId(d.lockedRoleId);
      const clusters = await api.itis();
      setItis(clusters);
      setLedger([{ q: 'Evaluator persona', a: d.personaNote }]);
      setParentSaved(true);
      setMediation([]);
      setTurnNo(1);
      setAccord(null);
      setPhase('mediation');
      const m1 = await api.mediationTurn({ sessionId: d.sessionId, turnNumber: 1 });
      setMediation([m1]);
      setTurnNo(2);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function ensureItis() {
    if (itis.length) return;
    try {
      setItis(await api.itis());
    } catch {
      /* institutes stay manual-entry */
    }
  }

  const waLink = accord
    ? `https://wa.me/?text=${encodeURIComponent(
        `SkillSarthi Family Accord ${accord.accordCode} — ${accord.accord.studentName} + ${accord.accord.parentName} agree on ${accord.accord.careerTitle} (NSQF ${accord.accord.nsqfLevel}) at ${accord.accord.instituteSelected}. NAPS stipend ${inr(accord.accord.napsStipendCommitted)}/mo, Year-1 target ${inr(accord.accord.targetYr1Salary)}/mo.`,
      )}`
    : '#';

  const traits = turn?.traitVector ? Object.entries(turn.traitVector).slice(0, 5) : [];
  const intakeProgress = turn ? Math.min(turn.stepNumber, 4) / 4 : ledger.length / 4;

  const steps = [t.stepper1, t.stepper2, t.stepper3, t.stepper4, t.stepper5];
  const stepPhase: Phase[] = ['intake', 'careers', 'parent', 'mediation', 'accord'];

  return (
    <div id="app-overlay">
      <div className="mx-auto min-h-full max-w-[1440px] px-3 pb-16 pt-3 sm:px-6 sm:pt-4">
        {/* Header — landing language: wordmark left, quiet actions right */}
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-black/10 pb-3">
          <div className="mr-auto">
            <div className="text-[16px] font-medium tracking-tight">{t.appTitle}</div>
            <div className="text-xs text-black/50">{t.appSub}</div>
          </div>
          <div className="flex items-center gap-0.5 text-[13px]" role="group" aria-label="Language">
            {(['en', 'hi', 'mr'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`min-h-[32px] min-w-[36px] rounded-md px-1.5 ${lang === l ? 'font-semibold text-black' : 'text-black/45 hover:text-black'}`}
              >
                {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'मरा'}
              </button>
            ))}
          </div>
          <button onClick={loadDemo} disabled={busy} className="min-h-[38px] rounded-full bg-[#0a0908] px-4 text-[13px] font-medium text-white disabled:opacity-50">
            ⭐ {t.demo}
          </button>
          <button onClick={closeOverlay} className="min-h-[38px] rounded-full border border-black/15 px-4 text-[13px]">
            ← {t.close}
          </button>
        </header>

        {error && (
          <div className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {error}
          </div>
        )}

        {/* Workspace: narrow rail + fluid main — uses the full width */}
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* ── Rail ─────────────────────────────────────────── */}
          <aside className="flex flex-col gap-3 lg:sticky lg:top-3">
            <button
              onClick={() => { refreshConsults(); setPhase('history'); }}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-[14px] ${phase === 'history' ? 'border-[#185FA5] bg-[#185FA5]/5 font-medium' : 'border-black/10 bg-white hover:border-black/25'}`}
            >
              <span aria-hidden>🗂️</span> {t.consults}
              <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 font-mono text-[11px] text-black/60">{consults.length}</span>
            </button>
            <nav className="rounded-2xl border border-black/10 bg-white p-4" aria-label={t.journey}>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#185FA5]">{t.journey}</p>
              <ol className="mt-2">
                {steps.map((label, i) => {
                  const done = i < activeStep;
                  const now = i === activeStep;
                  return (
                    <li key={label} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < steps.length - 1 && (
                        <span className={`absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px ${done ? 'bg-black' : 'bg-black/15'}`} aria-hidden />
                      )}
                      <span
                        className={`z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                          now ? 'bg-[#185FA5] text-white' : done ? 'bg-black text-white' : 'border border-black/20 text-black/50'
                        }`}
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      <span className="pt-1">
                        <span className={`block text-[14px] ${now ? 'font-semibold' : done ? '' : 'text-black/55'}`}>{label}</span>
                        {now && <span className="block text-[12px] text-[#185FA5]">●</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-black/10 pt-3">
                {stepPhase.map((p, i) => (
                  <button
                    key={p}
                    onClick={() => i <= activeStep && setPhase(p)}
                    disabled={i > activeStep}
                    className={`rounded-full px-2.5 py-1 text-[11px] ${i > activeStep ? 'text-black/30' : 'text-black/60 underline decoration-black/20 underline-offset-2 hover:text-black'}`}
                  >
                    {steps[i]}
                  </button>
                ))}
              </div>
            </nav>

            <section className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#185FA5]">{t.record}</p>
              <dl className="mt-2 space-y-1.5 text-[13px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-black/50">Student</dt>
                  <dd className="font-medium">{studentName} · {district}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-black/50">Filed Q&A</dt>
                  <dd className="font-medium">{ledger.length} / 4</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-black/50">{t.lockedGoal}</dt>
                  <dd className="text-right font-medium">{lockedRole ? lockedRole.title : '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-black/50">{t.baseline}</dt>
                  <dd className="font-medium">{parentSaved ? `${inr(Number(minSalary))}/mo · ${commute} km` : '—'}</dd>
                </div>
                {accord && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-black/50">Accord</dt>
                    <dd className="font-mono text-[12px] font-semibold">{accord.accordCode}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-2 border-t border-black/10 pt-2 text-[12px] leading-relaxed text-black/50">{t.recordNote}</p>
              {traits.length > 0 && (
                <div className="mt-2 border-t border-black/10 pt-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/45">{t.aptitude}</p>
                  <div className="mt-1.5 space-y-1.5">
                    {traits.map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-[12px]">
                        <span className="w-24 shrink-0 capitalize text-black/55">{k}</span>
                        <span className="h-1 flex-1 overflow-hidden rounded-full bg-black/10">
                          <span className="block h-full rounded-full bg-[#185FA5]" style={{ width: `${Math.min(100, Number(v))}%` }} />
                        </span>
                        <span className="w-7 text-right font-mono text-black/60">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </aside>

          {/* ── Main ─────────────────────────────────────────── */}
          <main className="min-w-0">
            {/* PHASE: history — recent consultations, resume where you left off */}
            {phase === 'history' && (
              <section>
                <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#185FA5]">{t.consults}</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">{t.histH}</h2>
                  <p className="mt-2 max-w-3xl text-[14px] text-black/60">{t.histP}</p>
                  <button onClick={startNew} className="mt-4 min-h-[48px] rounded-full bg-[#0a0908] px-8 text-sm font-medium text-white">
                    {t.newConsult}
                  </button>
                </div>
                <div className="mt-3 grid gap-2.5">
                  {consultsLoading && <p className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/55">{t.loading}</p>}
                  {!consultsLoading && consults.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-6 text-[14px] text-black/55">{t.emptyHist}</p>
                  )}
                  {consults.map((c) => {
                    const pct = c.hasAccord ? 100 : c.mediationTurns ? Math.min(95, 55 + c.mediationTurns * 8) : c.hasParent ? 55 : c.hasLock ? 40 : Math.round((c.answered / 4) * 30);
                    const status = c.resumePhase === 'accord' ? `✒️ Accord ${c.accordCode}`
                      : c.resumePhase === 'mediation' ? (c.mediationTurns ? `Mediation ${c.mediationTurns}/4` : 'Family baseline saved')
                      : c.resumePhase === 'parent' ? `🔒 ${c.lockedTitle}`
                      : c.resumePhase === 'careers' ? 'Roles researched'
                      : `Assessment ${c.answered}/4`;
                    return (
                      <article key={c.sessionId} className={`flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4 sm:px-5 ${c.sessionId === sessionId ? 'border-[#185FA5] ring-1 ring-[#185FA5]/30' : 'border-black/10'}`}>
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0a0908] text-[13px] font-semibold text-white" aria-hidden>
                          {c.studentName.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1 basis-48">
                          <div className="truncate text-[15px] font-medium">{c.studentName} <span className="font-normal text-black/50">· {c.district}</span></div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/10">
                            <span className="block h-full rounded-full bg-[#185FA5]" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-1 text-[12px] text-black/55">{status} · {c.updatedAt.slice(0, 16).replace('T', ' ')}</div>
                        </div>
                        <button onClick={() => openConsultation(c.sessionId)} disabled={busy} className="min-h-[42px] rounded-full bg-[#0a0908] px-5 text-[13px] font-medium text-white disabled:opacity-50">
                          {t.continueBtn}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* PHASE: profile */}
            {phase === 'profile' && (
              <section className="rounded-2xl border border-black/10 bg-white p-6 sm:p-10">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#185FA5]">Phase 1 · Student</p>
                <h2 className="mt-2 max-w-xl text-3xl font-medium leading-[1.05] tracking-tight sm:text-[44px]">{t.profileH}</h2>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/60 sm:text-[17px]">{t.profileP}</p>
                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-[13px] text-black/60">{t.name}</span>
                    <input value={studentName} onChange={(e) => setStudentName(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/15 bg-[#f2f0ec]/50 px-3.5 text-[15px] outline-none focus:border-[#185FA5] focus:bg-white" />
                  </label>
                  <label className="block">
                    <span className="text-[13px] text-black/60">{t.district}</span>
                    <input value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/15 bg-[#f2f0ec]/50 px-3.5 text-[15px] outline-none focus:border-[#185FA5] focus:bg-white" />
                  </label>
                  <label className="block">
                    <span className="text-[13px] text-black/60">{t.state}</span>
                    <input value={stateName} onChange={(e) => setStateName(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/15 bg-[#f2f0ec]/50 px-3.5 text-[15px] outline-none focus:border-[#185FA5] focus:bg-white" />
                  </label>
                </div>
                <button onClick={beginProfile} disabled={busy} className="mt-7 min-h-[48px] rounded-full bg-[#0a0908] px-8 text-sm font-medium text-white disabled:opacity-50">
                  {busy ? t.loading : t.begin}
                </button>
              </section>
            )}

            {/* PHASE: intake — assessment sheet, not a messenger */}
            {phase === 'intake' && (
              <section>
                <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#185FA5]">Phase 1 · Assessment</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">{t.intakeH}</h2>
                  <p className="mt-2 max-w-3xl text-[14px] text-black/60">{t.intakeP}</p>
                  {/* progress hairline, like the landing */}
                  <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-black/10" aria-hidden>
                    <div className="h-full rounded-full bg-[#185FA5] transition-all" style={{ width: `${Math.round(intakeProgress * 100)}%` }} />
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-black/45">{ledger.length} / 4 filed</p>
                </div>

                {/* filed answers — official ledger rows */}
                {ledger.length > 0 && (
                  <ol className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-white">
                    {ledger.map((row, i) => (
                      <li key={i} className="flex gap-4 border-b border-black/10 p-4 last:border-0 sm:px-6">
                        <span className="font-mono text-[13px] font-semibold text-[#185FA5]">{String(i + 1).padStart(2, '0')}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] text-black/45">{row.q}</span>
                          <span className="mt-0.5 block text-[14px] leading-snug">✓ {row.a}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                {turn && !turn.isIntakeComplete ? (
                  <div ref={currentRef} className="mt-3 rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0a0908] text-[14px] font-semibold text-white" aria-hidden>
                        AS
                      </span>
                      <div>
                        <div className="text-[14px] font-medium">Aarav Sir</div>
                        <div className="text-[12px] text-black/50">MSDE Senior Vocational Counsellor</div>
                      </div>
                      <span className="ml-auto rounded-full bg-[#185FA5]/10 px-3 py-1 text-[12px] font-medium text-[#185FA5]">
                        {t.qOf} {turn.stepNumber} / 4 · {turn.questionType}
                      </span>
                    </div>
                    <p className="mt-4 max-w-4xl text-[19px] font-medium leading-snug tracking-tight sm:text-[24px]">
                      {turn.counselorMessage}
                    </p>
                    <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-black/45">{t.tapHint}</p>
                    <div className="mt-2 overflow-hidden rounded-xl border border-black/12">
                      {turn.options.map((o, i) => (
                        <button
                          key={o}
                          onClick={() => answerIntake(o)}
                          disabled={busy}
                          className="flex w-full items-start gap-3 border-b border-black/10 bg-white px-4 py-3.5 text-left transition-colors last:border-0 hover:bg-[#185FA5]/[0.05] disabled:opacity-50"
                        >
                          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/20 text-[13px] font-semibold">
                            {LETTERS[i] ?? i + 1}
                          </span>
                          <span className="text-[14px] leading-relaxed sm:text-[15px]">{stripLead(o)}</span>
                        </button>
                      ))}
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[13px] font-medium text-[#185FA5]">{t.writeOwn}</summary>
                      <form
                        className="mt-2 flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          answerIntake(draft);
                        }}
                      >
                        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.typeAnswer} className="min-h-[48px] flex-1 rounded-xl border border-black/15 px-3.5 text-[14px] outline-none focus:border-[#185FA5]" />
                        <button disabled={busy} className="min-h-[48px] rounded-full bg-[#0a0908] px-6 text-sm font-medium text-white disabled:opacity-50">
                          {t.send}
                        </button>
                      </form>
                    </details>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                    {turn?.summaryMessage && <p className="max-w-3xl text-[15px] leading-relaxed">✓ {turn.summaryMessage}</p>}
                    <button
                      onClick={async () => {
                      if (!roles.length) {
                        setBusy(true);
                        try {
                          const rec = await api.matchRoles(sessionId);
                          setRoles(rec.roles);
                          setRolesPersonalized(!!rec.personalized);
                          setRolesGrounded(!!rec.grounded);
                        } catch (e) {
                            fail(e);
                          } finally {
                            setBusy(false);
                          }
                        }
                        setPhase('careers');
                      }}
                      disabled={busy}
                      className="mt-4 min-h-[48px] rounded-full bg-[#185FA5] px-8 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {t.intakeDone}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* PHASE: careers — full-width grid */}
            {phase === 'careers' && (
              <section>
                <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#185FA5]">Phase 2 · NSQF Matches</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">{t.careersH}</h2>
                  <p className="mt-1 max-w-3xl text-sm text-black/60">{t.careersP}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <p className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">🔒 {t.sealed}</p>
                    <p className="inline-block rounded-full bg-[#185FA5]/10 px-3 py-1 text-xs font-medium text-[#185FA5]">
                      ✨ {t.aiPersonalized}{rolesGrounded ? ' · web-researched' : ''}
                    </p>
                    <button
                      onClick={async () => {
                        if (!sessionId) return;
                        setBusy(true);
                        setError('');
                        try {
                          const rec = await api.matchRoles(sessionId, true);
                          setRoles(rec.roles);
                          setRolesGrounded(!!rec.grounded);
                        } catch (e) {
                          fail(e);
                        } finally {
                          setBusy(false);
                        }
                      }}
                      disabled={busy}
                      className="rounded-full border border-black/15 bg-white px-3 py-1 text-xs text-black/65 disabled:opacity-50"
                    >
                      {t.researchAgain}
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid items-stretch gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {roles.map((r) => (
                    <article key={r.id} className={`flex flex-col rounded-2xl border bg-white p-5 ${lockedId === r.id ? 'border-[#185FA5] ring-2 ring-[#185FA5]/20' : 'border-black/10'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#185FA5]/10 px-2.5 py-1 text-[11px] font-semibold text-[#185FA5]">NSQF {r.nsqfLevel} · {r.qpCode}</span>
                        <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] text-black/60">{r.badge}</span>
                      </div>
                      <h3 className="mt-2.5 text-[19px] font-medium leading-snug tracking-tight">{r.title}</h3>
                      {typeof r.matchScore === 'number' && rolesPersonalized && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="h-1 w-20 overflow-hidden rounded-full bg-black/10">
                            <span className="block h-full rounded-full bg-[#185FA5]" style={{ width: `${r.matchScore}%` }} />
                          </span>
                          <span className="text-[12px] font-medium text-[#185FA5]">{r.matchScore}% {t.aiMatch}</span>
                        </div>
                      )}
                      {r.aiPitch && rolesPersonalized && (
                        <p className="mt-1.5 border-l-2 border-[#185FA5] pl-2 text-[13px] italic leading-relaxed text-black/70">✨ {r.aiPitch}</p>
                      )}
                      <p className="mt-1 text-[13px] text-black/55">{r.sector}</p>
                      <p className="mt-2 text-[13px] text-black/60">{r.academicPrerequisite}</p>
                      <p className="mt-2 text-[14px] leading-relaxed">{r.description}</p>
                      <details className="mt-2 text-[13px] text-black/70">
                        <summary className="cursor-pointer font-medium text-[#185FA5]">Day-to-day reality</summary>
                        <p className="mt-1 leading-relaxed">{r.dayToDay}</p>
                        <p className="mt-1">🏭 {r.workEnvironment}</p>
                      </details>
                      {/* salary ladder */}
                      <div className="mt-3 rounded-xl bg-[#f2f0ec] p-3">
                        <div className="flex items-baseline justify-between text-[12px]">
                          <span className="text-black/55">NAPS stipend</span>
                          <span className="font-semibold">{inr(r.entryStipend)}</span>
                        </div>
                        <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-black/10" aria-hidden>
                          <span className="bg-black/35" style={{ width: '30%' }} />
                          <span className="bg-[#185FA5]/70" style={{ width: '30%' }} />
                          <span className="bg-[#185FA5]" style={{ width: '40%' }} />
                        </div>
                        <div className="mt-1.5 flex justify-between text-[12px]">
                          <span>Year 1 <strong>{inr(r.firstYearSalary)}</strong></span>
                          <span>Year 5 <strong>{inr(r.fiveYearSalary)}</strong></span>
                        </div>
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-black/60">🎓 {r.ncrfCreditBridge}</p>
                      <p className="mt-1 text-[12px] text-black/60">🤝 {r.hiringPartners.join(' · ')}</p>
                      {r.sources && r.sources.length > 0 && (
                        <details className="mt-2 text-[12px]">
                          <summary className="cursor-pointer font-medium text-[#185FA5]">Verified sources ({r.sources.length})</summary>
                          <ul className="mt-1 space-y-1">
                            {r.sources.slice(0, 4).map((s) => (
                              <li key={s.url} className="truncate">
                                <a href={s.url} target="_blank" rel="noreferrer" className="text-black/65 underline decoration-black/25 underline-offset-2 hover:text-black">
                                  {s.title || s.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      <button onClick={() => lockRole(r.id)} disabled={busy} className={`mt-4 w-full rounded-full py-3 text-sm font-medium ${lockedId === r.id ? 'bg-green-700 text-white' : 'bg-[#0a0908] text-white'} disabled:opacity-50`}>
                        {lockedId === r.id ? t.locked : t.lock}
                      </button>
                    </article>
                  ))}
                </div>
                {lockedId && (
                  <button onClick={() => setPhase('parent')} className="mt-4 min-h-[48px] rounded-full bg-[#185FA5] px-8 text-sm font-medium text-white">
                    {t.toParent}
                  </button>
                )}
              </section>
            )}

            {/* PHASE: parent — two-column dossier */}
            {phase === 'parent' && (
              <section className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#185FA5]">Phase 3 · Blind intake</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">{t.parentH}</h2>
                <p className="mt-2 max-w-4xl text-[14px] text-black/60">{t.parentP}</p>
                <div className="mt-6 grid items-start gap-x-8 gap-y-4 lg:grid-cols-2">
                  <div className="grid gap-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45">Who is answering</p>
                    <label className="block">
                      <span className="text-[13px] text-black/60">{t.parentName}</span>
                      <input value={parentName} onChange={(e) => setParentName(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/15 bg-[#f2f0ec]/50 px-3.5 text-[15px] outline-none focus:border-[#185FA5] focus:bg-white" />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-[13px] text-black/60">{t.relation}</span>
                        <select value={relation} onChange={(e) => setRelation(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/15 bg-white px-3 text-[15px]">
                          <option>Father</option>
                          <option>Mother</option>
                          <option>Guardian</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[13px] text-black/60">{t.language}</span>
                        <select value={plang} onChange={(e) => setPlang(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/15 bg-white px-3 text-[15px]">
                          <option value="mr-IN">मराठी (Marathi)</option>
                          <option value="hi-IN">हिन्दी (Hindi)</option>
                          <option value="en-IN">English</option>
                        </select>
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-[13px] text-black/60">{t.voiceNote}</span>
                      <textarea value={voice} onChange={(e) => setVoice(e.target.value)} rows={4} placeholder="आम्हाला मुलगा किमान ₹१८,००० महिना कमवायला हवा…" className="mt-1.5 w-full rounded-xl border border-black/15 bg-[#f2f0ec]/50 px-3.5 py-3 text-[14px] outline-none focus:border-[#185FA5] focus:bg-white" />
                    </label>
                  </div>
                  <div className="grid gap-5 rounded-2xl bg-[#f2f0ec] p-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45">Non-negotiables</p>
                    <label className="block">
                      <span className="flex items-baseline justify-between text-[13px] text-black/60">
                        {t.minSalary}
                        <strong className="text-[20px] tracking-tight text-black">{inr(Number(minSalary))}</strong>
                      </span>
                      <input type="range" min={8000} max={40000} step={500} value={minSalary} onChange={(e) => setMinSalary(Number(e.target.value))} className="mt-2 w-full accent-[#185FA5]" />
                    </label>
                    <label className="block">
                      <span className="flex items-baseline justify-between text-[13px] text-black/60">
                        {t.commute}
                        <strong className="text-[20px] tracking-tight text-black">{commute} km</strong>
                      </span>
                      <input type="range" min={5} max={200} step={5} value={commute} onChange={(e) => setCommute(Number(e.target.value))} className="mt-2 w-full accent-[#185FA5]" />
                    </label>
                    <label className="block">
                      <span className="text-[13px] text-black/60">{t.stigma}</span>
                      <input value={stigma} onChange={(e) => setStigma(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/15 bg-white px-3.5 text-[14px] outline-none focus:border-[#185FA5]" />
                    </label>
                    <label className="block">
                      <span className="text-[13px] text-black/60">{t.safety}</span>
                      <input value={safety} onChange={(e) => setSafety(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/15 bg-white px-3.5 text-[14px] outline-none focus:border-[#185FA5]" />
                    </label>
                  </div>
                </div>
                <button onClick={saveParent} disabled={busy} className="mt-6 min-h-[48px] rounded-full bg-[#0a0908] px-8 text-sm font-medium text-white disabled:opacity-50">
                  {busy ? t.loading : t.saveParent}
                </button>
              </section>
            )}

            {/* PHASE: mediation — proceedings + evidence rail */}
            {phase === 'mediation' && (
              <section>
                <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#185FA5]">Phase 4 · Live mediation</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">{t.medH}</h2>
                  <p className="mt-2 max-w-4xl text-[14px] text-black/60">{t.medP}</p>
                </div>
                {mediation.length === 0 ? (
                  <button onClick={() => nextMediation('')} disabled={busy} className="mt-3 min-h-[48px] rounded-full bg-[#0a0908] px-8 text-sm font-medium text-white disabled:opacity-50">
                    {busy ? t.loading : t.enterChamber}
                  </button>
                ) : (
                  <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
                    {/* proceedings timeline */}
                    <ol className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                      {mediation.map((m, i) => (
                        <li key={i} className="flex gap-4 border-b border-black/10 p-5 last:border-0 sm:px-7 sm:py-6">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a0908] font-mono text-[13px] font-semibold text-white">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#185FA5]">{m.stage}</p>
                            <h3 className="mt-1 text-[17px] font-medium tracking-tight">{m.title}</h3>
                            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-black/80">{m.message}</p>
                            {m.vernacularSummary && (
                              <blockquote className="mt-3 border-l-2 border-[#185FA5] bg-[#f2f0ec] px-4 py-2.5 text-[14px] leading-relaxed">
                                {m.vernacularSummary}
                              </blockquote>
                            )}
                          </div>
                        </li>
                      ))}
                      {turnNo <= 5 && (
                        <li className="bg-[#f2f0ec]/60 p-5 sm:px-7">
                          <form
                            className="flex gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              nextMediation();
                            }}
                          >
                            <input value={doubt} onChange={(e) => setDoubt(e.target.value)} placeholder={t.doubtsPh} className="min-h-[48px] flex-1 rounded-xl border border-black/15 bg-white px-3.5 text-[14px] outline-none focus:border-[#185FA5]" />
                            <button disabled={busy} className="min-h-[48px] rounded-full border border-black/15 bg-white px-5 text-sm disabled:opacity-50">{t.askDoubt}</button>
                          </form>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <button onClick={() => nextMediation('')} disabled={busy} className="min-h-[48px] rounded-full bg-[#0a0908] px-8 text-sm font-medium text-white disabled:opacity-50">
                              {busy ? t.loading : t.nextTurn}
                            </button>
                            {(mediation.some((m) => m.readyForAccord) || mediation.length >= 4) && (
                              <button
                                onClick={() => {
                                  ensureItis();
                                  setPhase('accord');
                                }}
                                className="min-h-[48px] rounded-full bg-[#185FA5] px-8 text-sm font-medium text-white"
                              >
                                {t.readyAccord}
                              </button>
                            )}
                          </div>
                        </li>
                      )}
                    </ol>
                    {/* evidence rail */}
                    <aside className="flex flex-col gap-3 xl:sticky xl:top-3">
                      <p className="px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-black/45">{t.evidence}</p>
                      {lockedRole && (
                        <div className="rounded-2xl border border-black/10 bg-white p-4 text-[13px]">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#185FA5]">{t.lockedGoal}</p>
                          <p className="mt-1 font-medium leading-snug">{lockedRole.title}</p>
                          <p className="mt-1 text-black/60">Year-1 {inr(lockedRole.firstYearSalary)}/mo → Year-5 {inr(lockedRole.fiveYearSalary)}/mo</p>
                        </div>
                      )}
                      {mediation.map((m, i) =>
                        m.boosterOffered ? (
                          <div key={`b${i}`} className="rounded-2xl border border-[#185FA5]/30 bg-blue-50/60 p-4 text-[13px]">
                            <p className="font-semibold text-[#185FA5]">⚡ {m.boosterOffered.title}</p>
                            <p className="mt-1 font-mono text-[12px]">{m.boosterOffered.wageBoost} → {m.boosterOffered.projectedYear1Wage}</p>
                            <p className="mt-1 leading-relaxed text-black/70">{m.boosterOffered.explanation}</p>
                          </div>
                        ) : null,
                      )}
                      {mediation.map((m, i) =>
                        m.ncrfCredits ? (
                          <div key={`n${i}`} className="rounded-2xl bg-green-50 p-4 text-[13px] text-green-900">
                            🎓 {m.ncrfCredits}
                          </div>
                        ) : null,
                      )}
                      {mediation[mediation.length - 1]?.hiringPartners && (
                        <div className="rounded-2xl border border-black/10 bg-white p-4 text-[13px]">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/45">Hiring corridor</p>
                          <p className="mt-1 leading-relaxed">{mediation[mediation.length - 1].hiringPartners!.join(' · ')}</p>
                        </div>
                      )}
                    </aside>
                  </div>
                )}
              </section>
            )}

            {/* PHASE: accord — document + signing rail */}
            {phase === 'accord' && (
              <section>
                <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#185FA5]">Phase 5 · Roadmap & Accord</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">{t.accordH}</h2>
                  <p className="mt-2 max-w-4xl text-[14px] text-black/60">{t.accordP}</p>
                </div>
                <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div id="accord-print" className="rounded-2xl border-2 border-[#185FA5]/30 bg-white p-6 sm:p-8">
                    {accord ? (
                      <>
                        <div className="flex flex-wrap items-start gap-3 border-b border-black/10 pb-4">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#185FA5]">Parivar Kaushal Samjhauta · MSDE</div>
                            <h3 className="mt-1 text-2xl font-medium tracking-tight">Family Decision Accord</h3>
                            <div className="mt-1 font-mono text-sm font-semibold">{accord.accordCode}</div>
                            <div className="mt-0.5 text-[13px] text-black/55">Signed {accord.accord.signedDate}</div>
                            {accord.personalized && (
                              <div className="mt-1.5 inline-block rounded-full bg-[#185FA5]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#185FA5]">✨ {t.aiPersonalized}</div>
                            )}
                          </div>
                          <div className="ml-auto rounded-xl bg-[#f2f0ec] px-3.5 py-2 text-[13px]">
                            ✅ {accord.accord.studentName} + {accord.accord.parentName}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2 text-[14px] sm:grid-cols-2">
                          <div className="rounded-xl bg-[#f2f0ec] p-4">🎯 <strong>{accord.accord.careerTitle}</strong> (NSQF {accord.accord.nsqfLevel})<br />🏫 {accord.accord.instituteSelected}</div>
                          <div className="rounded-xl bg-[#f2f0ec] p-4">💰 NAPS {inr(accord.accord.napsStipendCommitted)}/mo → Year-1 {inr(accord.accord.targetYr1Salary)}/mo<br />🏭 {accord.accord.workEnvironment}</div>
                        </div>
                        <ol className="mt-4">
                          {accord.accord.milestones.map((m, i) => (
                            <li key={m.period} className="relative flex gap-4 pb-5 last:pb-0">
                              {i < accord.accord.milestones.length - 1 && <span className="absolute left-[15px] top-9 h-[calc(100%-2rem)] w-px bg-black/15" aria-hidden />}
                              <span className="z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#185FA5] font-mono text-[12px] font-semibold text-white">{i + 1}</span>
                              <div className="min-w-0 text-[13px]">
                                <div className="font-semibold">{m.period}</div>
                                <div className="mt-0.5 text-[14px]">{m.goal}</div>
                                <div className="mt-0.5 font-medium text-[#185FA5]">{m.financialCommitment}</div>
                                {m.parentWhy && (
                                  <blockquote className="mt-2 border-l-2 border-[#185FA5] bg-[#f2f0ec] px-3 py-2 text-[13px] leading-relaxed">
                                    <span className="font-semibold">Why this answers your concern — </span>{m.parentWhy}
                                  </blockquote>
                                )}
                                {m.evidence && <div className="mt-1 font-mono text-[11px] text-black/50">⌛ {m.evidence}</div>}
                              </div>
                            </li>
                          ))}
                        </ol>
                        {accord.accord.degreeOptions?.length > 0 && (
                          <div className="mt-5 border-t border-black/10 pt-4">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#185FA5]">Degree ladder — study while earning</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {accord.accord.degreeOptions.map((d) => (
                                <div key={d.title} className="rounded-xl bg-[#f2f0ec] p-3.5 text-[13px]">
                                  <div className="font-semibold leading-snug">🎓 {d.title}</div>
                                  <div className="mt-1 text-black/65">{d.provider} · {d.mode} · {d.duration}</div>
                                  {d.entryRoute && <div className="mt-1 text-black/80">→ {d.entryRoute}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {accord.accord.courses?.length > 0 && (
                          <div className="mt-4 border-t border-black/10 pt-4">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#185FA5]">Courses that raise the salary</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {accord.accord.courses.map((c) => (
                                <div key={c.title} className="rounded-xl border border-black/10 bg-white p-3.5 text-[13px]">
                                  <div className="font-semibold leading-snug">⚡ {c.title}</div>
                                  <div className="mt-1 text-black/65">{c.provider} · {c.duration}</div>
                                  {c.detail && <div className="mt-1 text-[#185FA5]">{c.detail}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {accord.accord.sources && accord.accord.sources.length > 0 && (
                          <details className="mt-4 text-[12px]">
                            <summary className="cursor-pointer font-medium text-[#185FA5]">Researched sources ({accord.accord.sources.length})</summary>
                            <ul className="mt-1 space-y-1">
                              {accord.accord.sources.slice(0, 6).map((s) => (
                                <li key={s.url} className="truncate">
                                  <a href={s.url} target="_blank" rel="noreferrer" className="text-black/65 underline decoration-black/25 underline-offset-2 hover:text-black">
                                    {s.title || s.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </>
                    ) : (
                      <p className="text-[14px] text-black/60">Choose the institute in the signing panel — the accord document appears here once signed.</p>
                    )}
                  </div>
                  <aside className="flex flex-col gap-3 xl:sticky xl:top-3">
                    <div className="rounded-2xl border border-black/10 bg-white p-5">
                      <label className="block">
                        <span className="text-[13px] text-black/60">{t.institute}</span>
                        <select value={institute} onChange={(e) => setInstitute(e.target.value)} className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/15 bg-white px-3 text-[14px]">
                          <option>{institute}</option>
                          {itis.flatMap((d) => d.accreditedInstitutes).map((ins) => (
                            <option key={ins.id} value={ins.name}>{ins.name} · {ins.feesPerYear}</option>
                          ))}
                        </select>
                      </label>
                      {!accord ? (
                        <button onClick={sign} disabled={busy} className="mt-3 min-h-[48px] w-full rounded-full bg-[#0a0908] text-sm font-medium text-white disabled:opacity-50">
                          {busy ? t.loading : `✒️ ${t.sign}`}
                        </button>
                      ) : (
                        <div className="mt-3 grid gap-2 print:hidden">
                          <button onClick={() => window.print()} className="min-h-[46px] rounded-full bg-[#0a0908] text-[13px] font-medium text-white">🖨️ {t.print}</button>
                          <a href={waLink} target="_blank" rel="noreferrer" className="flex min-h-[46px] items-center justify-center rounded-full bg-[#25D366] text-[13px] font-medium text-white">💬 {t.whatsapp}</a>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(accord.accordCode).then(() => {
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1500);
                              }).catch(() => {});
                            }}
                            className="min-h-[46px] rounded-full border border-black/15 bg-white text-[13px]"
                          >
                            {copied ? t.copied : t.copy}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['profile', 'intake', 'careers', 'parent', 'mediation'] as Phase[]).map((p, i) => (
                        <button key={p} onClick={() => setPhase(p)} className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-[12px] text-black/65">
                          ← {steps[i]}
                        </button>
                      ))}
                    </div>
                  </aside>
                </div>
              </section>
            )}

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-3 text-xs text-black/40">
              <span>Prototype with demo data · Guidance, not a job guarantee</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
