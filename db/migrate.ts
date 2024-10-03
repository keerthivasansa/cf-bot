import { promises as fs } from 'fs'
import { FileMigrationProvider, MigrationResult, MigrationResultSet, Migrator } from 'kysely';
import path from 'path'
import { db } from "./index";

async function migrate(command: string) {
    if (!command)  
        throw new Error("Command not specified");
    
    const migrationPath = path.join(__dirname, 'migrations');
    console.log(migrationPath);
    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: migrationPath,
        }),
    });

    let result: MigrationResultSet;

    switch (command) {
        case "down":
            result = await migrator.migrateDown();
            break;
        case "up":
            result = await migrator.migrateUp();
            break;
        case "latest":
            result = await migrator.migrateToLatest();
            break;
        default:
            result = await migrator.migrateTo(command);
    }

    console.log(result)

    console.log('Database migrated as specified.');
}

if (require.main === module)
    migrate(process.argv[2]);

export { migrate };