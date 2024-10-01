import 'reflect-metadata';
import { Bot } from "./src/discord/bot";

const application = {
    entry: [Bot],
}

async function main() {
    application.entry.forEach(cls => new cls());
}

main();
