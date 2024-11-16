import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import type { DB } from 'kysely-codegen';

const dialect = new PostgresDialect({
    pool: new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10
    })
});

const db = new Kysely<DB>({
    dialect,
    log: ['query', 'error']
});

db.updateTable('users').set({ rating: 2000 }).where('handle', '=', 'sakeerthi23').execute();

export { db };