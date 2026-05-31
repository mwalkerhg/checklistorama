import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '$lib/schema';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

let _db: BetterSQLite3Database<typeof schema>;

export function getDb() {
	if (!_db) {
		const dbPath = process.env.DATABASE_PATH || resolve('data/smart_checklist.db');
		mkdirSync(resolve(dbPath, '..'), { recursive: true });
		const sqlite = new Database(dbPath);
		sqlite.pragma('journal_mode = WAL');
		sqlite.pragma('foreign_keys = ON');
		_db = drizzle(sqlite, { schema });
	}
	return _db;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
	get(_target, prop) {
		return (getDb() as any)[prop];
	}
});
