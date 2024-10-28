
import { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
    await db.schema
        .createTable('problem_suggest')
        .addColumn('problem_contest', 'int4')
        .addColumn('problem_index', 'varchar(5)')
        .addColumn('discord_id', 'varchar(128)', (c) => c.primaryKey())
        .addColumn('last_added', 'date')
        .execute();
}

export async function down(db: Kysely<any>) {
    await db.schema
        .dropTable('problem_suggest')
        .execute();
}