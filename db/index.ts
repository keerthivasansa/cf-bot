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
    log: ['error']
});

export { db };