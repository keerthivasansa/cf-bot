
import { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
    await db.schema.createTable("cache_status")
        .addColumn("cache_key", "varchar(32)", c => c.primaryKey())
        .addColumn("last_executed", "date", c => c.notNull())
        .execute();
}

export async function down(db: Kysely<any>) {
    await db.schema.dropTable("cache_status").execute();
}