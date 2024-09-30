import 'reflect-metadata';
import { CodeforcesApi } from "./src/codeforces/client";
import { Bot } from "./src/discord/bot";

const cfApi = new CodeforcesApi();

async function main() {
    // register services
    const bot = new Bot();
}

main();