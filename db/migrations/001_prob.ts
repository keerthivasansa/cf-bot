import { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
    await db.schema.createTable("problems")
        .addColumn("index", "varchar(3)", c => c.notNull())
        .addColumn("contestId", "int4", c => c.notNull())
        .addColumn("predicted_rating", "int4")
        .addColumn("official_rating", "int4")
        .addPrimaryKeyConstraint("contset_index", ["contestId", "index"])
        .execute();

}

export async function down(db: Kysely<any>) {
    await db.schema.dropTable("problems").execute();
}