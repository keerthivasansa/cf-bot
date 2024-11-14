import CliTable3, { Table, TableConstructorOptions } from "cli-table3";

const DISCORD_CHAR_LIMIT = 2000;

export function createDynamicSizedTable(data: string[][], config: TableConstructorOptions) {
    const slicedTables: string[] = [];
    let table = new CliTable3(config);

    for (let i = 0; i < data.length; i++) {
        table.push(data[i]);
        if (table.toString().length > DISCORD_CHAR_LIMIT) {
            console.log(i - 1);
            table.pop()
            slicedTables.push(table.toString());
            table = new CliTable3(config);
            table.push(data[i]);
        }
    }

    slicedTables.push(table.toString());

    return slicedTables;
}