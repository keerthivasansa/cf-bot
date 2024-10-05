
import { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
    await db.schema.alterTable('users')
        .addColumn('daily', 'varchar(10)')
        .execute();
}

export async function down(db: Kysely<any>) {
    await db.schema.alterTable('users')
        .dropColumn('daily')
        .execute();
}