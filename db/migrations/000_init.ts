import { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
    await db.schema.createTable('users')
        .addColumn('discordId', 'varchar(64)', (col) => col.primaryKey())
        .addColumn('handle', 'varchar(64)', (col) => col.unique())
        .execute();
}

export async function down(db: Kysely<any>) {
    await db.schema.dropTable('users').execute();
}