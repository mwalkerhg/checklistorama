import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { mkdirSync, readFileSync, readdirSync } from 'fs';

export function runMigrations() {
	const dbPath = process.env.DATABASE_PATH || resolve('data/smart_checklist.db');
	mkdirSync(dirname(dbPath), { recursive: true });

	const sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');

	const migrationsDir = resolve('drizzle');
	const files = readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort();

	sqlite.exec(`CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY)`);

	for (const file of files) {
		const applied = sqlite.prepare('SELECT 1 FROM __migrations WHERE name = ?').get(file);
		if (!applied) {
			const sql = readFileSync(resolve(migrationsDir, file), 'utf-8');
			sqlite.exec(sql);
			sqlite.prepare('INSERT INTO __migrations (name) VALUES (?)').run(file);
		}
	}

	sqlite.close();
}
