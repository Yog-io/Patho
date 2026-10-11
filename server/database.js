import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'patho_platform.sqlite');

// Ensure db exists and connect
const db = new DatabaseSync(dbPath);

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      student_name TEXT NOT NULL DEFAULT 'Learner',
      education_level TEXT,
      district TEXT DEFAULT 'Pune',
      state TEXT DEFAULT 'Maharashtra',
      mobility_preference TEXT DEFAULT 'local',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS qa_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      phase TEXT NOT NULL DEFAULT 'STUDENT_INTAKE',
      step_number INTEGER NOT NULL,
      question_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT DEFAULT 'text',
      options_json TEXT,
      user_response TEXT NOT NULL,
      extracted_traits_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS locked_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      role_id TEXT NOT NULL,
      role_title TEXT NOT NULL,
      nsqf_level INTEGER NOT NULL,
      entry_stipend INTEGER NOT NULL,
      first_year_salary INTEGER NOT NULL,
      five_year_trajectory INTEGER NOT NULL,
      ncrf_degree_bridge TEXT,
      work_environment TEXT,
      locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS parent_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      parent_name TEXT DEFAULT 'Parent',
      relation TEXT DEFAULT 'Father',
      language TEXT DEFAULT 'mr-IN',
      min_salary_monthly INTEGER NOT NULL DEFAULT 18000,
      max_commute_km INTEGER NOT NULL DEFAULT 35,
      stigma_concerns_json TEXT,
      safety_concerns_json TEXT,
      raw_voice_transcript TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS mediation_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      turn_number INTEGER NOT NULL,
      speaker TEXT NOT NULL,
      message TEXT NOT NULL,
      objection_type TEXT,
      policy_proof_cited TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS family_accords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      accord_code TEXT UNIQUE NOT NULL,
      student_name TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      career_title TEXT NOT NULL,
      training_institute TEXT NOT NULL,
      naps_stipend_committed INTEGER NOT NULL,
      target_yr1_salary INTEGER NOT NULL,
      micro_credentials_json TEXT,
      milestones_json TEXT,
      status TEXT DEFAULT 'SIGNED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS system_ai_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      api_base_url TEXT DEFAULT 'https://api.openai.com/v1',
      api_key TEXT DEFAULT '',
      model_name TEXT DEFAULT 'gpt-4o-mini',
      use_custom_api INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initialize default config if not exists
  const existingConfig = db.prepare('SELECT id FROM system_ai_config WHERE id = 1').get();
  if (!existingConfig) {
    db.prepare(`
      INSERT INTO system_ai_config (id, api_base_url, api_key, model_name, use_custom_api)
      VALUES (1, 'https://api.openai.com/v1', '', 'gpt-4o-mini', 0)
    `).run();
  }

  // AI-research columns (added for live-generated roles & roadmaps)
  // Consultation lifecycle + caching columns (questions logged at
  // creation as 'asked', answers flip them to 'answered')
  for (const ddl of [
    `ALTER TABLE locked_goals ADD COLUMN role_json TEXT`,
    `ALTER TABLE family_accords ADD COLUMN degree_options_json TEXT`,
    `ALTER TABLE family_accords ADD COLUMN courses_json TEXT`,
    `ALTER TABLE family_accords ADD COLUMN sources_json TEXT`,
    `ALTER TABLE qa_interactions ADD COLUMN status TEXT DEFAULT 'answered'`,
    `ALTER TABLE sessions ADD COLUMN intake_summary TEXT`,
    `ALTER TABLE mediation_sessions ADD COLUMN turn_json TEXT`
  ]) {
    try {
      db.exec(ddl);
    } catch {
      // Column already exists — safe to ignore
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS session_matches (
      session_id TEXT PRIMARY KEY,
      roles_json TEXT NOT NULL,
      grounded INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);

  console.log('✅ SQLite Database successfully initialized with all persistent tables');
}

export { db };
