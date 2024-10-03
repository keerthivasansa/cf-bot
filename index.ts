import 'reflect-metadata';
import { Bot } from "./src/discord/bot";
import CliTable3 from 'cli-table3';

const application = {
    entry: [Bot],
}

async function main() {
    application.entry.forEach(cls => new cls());
}

main();
