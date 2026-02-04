import pg from 'pg';
import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database wrapper that supports both SQLite (local) and PostgreSQL (Supabase)
class DatabaseWrapper {
  constructor() {
    this.isPostgres = !!process.env.DATABASE_URL;
    this.pool = null;
    this.sqlite = null;
  }

  async connect() {
    if (this.isPostgres) {
      console.log('Connecting to PostgreSQL (Supabase)...');
      this.pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      // Test connection
      const client = await this.pool.connect();
      console.log('Connected to PostgreSQL');
      client.release();
    } else {
      console.log('Using SQLite (local development)...');
      const dbPath = join(__dirname, '../../database.db');
      this.sqlite = new Database(dbPath);
      this.sqlite.pragma('journal_mode = WAL');
      console.log('Connected to SQLite:', dbPath);
    }
    return this;
  }

  // SQLite-compatible prepare() method for sync usage in routes
  prepare(sql) {
    if (this.isPostgres) {
      // Return async-compatible object for PostgreSQL
      const wrapper = this;
      return {
        get: (...params) => wrapper.get(sql, params),
        all: (...params) => wrapper.all(sql, params),
        run: (...params) => wrapper.run(sql, params)
      };
    } else {
      // Return native SQLite prepared statement
      return this.sqlite.prepare(sql);
    }
  }

  // Get single row
  async get(sql, params = []) {
    if (this.isPostgres) {
      const pgSql = this.convertToPostgres(sql);
      const result = await this.pool.query(pgSql, params);
      return result.rows[0];
    } else {
      return this.sqlite.prepare(sql).get(...params);
    }
  }

  // Get all rows
  async all(sql, params = []) {
    if (this.isPostgres) {
      const pgSql = this.convertToPostgres(sql);
      const result = await this.pool.query(pgSql, params);
      return result.rows;
    } else {
      return this.sqlite.prepare(sql).all(...params);
    }
  }

  // Run insert/update/delete
  async run(sql, params = []) {
    if (this.isPostgres) {
      let pgSql = this.convertToPostgres(sql);
      // Add RETURNING id for INSERT statements
      if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql = pgSql.replace(/;?\s*$/, ' RETURNING id');
      }
      const result = await this.pool.query(pgSql, params);
      return { 
        changes: result.rowCount,
        lastInsertRowid: result.rows?.[0]?.id 
      };
    } else {
      const stmt = this.sqlite.prepare(sql);
      const result = stmt.run(...params);
      return {
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid
      };
    }
  }

  // Execute raw SQL (for schema creation)
  async exec(sql) {
    if (this.isPostgres) {
      const pgSql = this.convertSchemaToPostgres(sql);
      try {
        await this.pool.query(pgSql);
      } catch (e) {
        // Ignore "already exists" errors for ALTER TABLE
        if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
          console.error('SQL Error:', e.message);
        }
      }
    } else {
      this.sqlite.exec(sql);
    }
  }

  // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc)
  convertToPostgres(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  }

  // Convert SQLite schema to PostgreSQL
  convertSchemaToPostgres(sql) {
    return sql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/AUTOINCREMENT/gi, '')
      .replace(/INTEGER PRIMARY KEY/gi, 'SERIAL PRIMARY KEY')
      .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT NOW()')
      .replace(/DATETIME/gi, 'TIMESTAMP')
      .replace(/\bREAL\b/gi, 'DECIMAL')
      .replace(/\bINTEGER\b(?!\s+PRIMARY)/gi, 'INTEGER');
  }
}

export const db = new DatabaseWrapper();
export default db;
