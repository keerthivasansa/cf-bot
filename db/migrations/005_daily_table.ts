

import { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
    await db.schema
        .createTable('daily_problem')
        .addColumn('problem_contest', 'int4')
        .addColumn('problem_index', 'varchar(5)')
        .addColumn('discord_id', 'varchar(128)')
        .addColumn('last_updated', 'date')
        .addColumn('solved', 'boolean')
        .addForeignKeyConstraint('problem_fk', ['problem_contest', 'problem_index'], 'problems', ['contestId', 'index'])
        .execute();

    await db.schema
        .alterTable('users')
        .addColumn('score', 'int8', c => c.defaultTo(0))
        .dropColumn('daily')
        .execute();
}

export async function down(db: Kysely<any>) {
    await db.schema
        .alterTable('users')
        .addColumn('daily', 'varchar(64)')
        .dropColumn('score')
        .execute();

    await db.schema
        .dropTable('daily_problem')
        .execute();
}