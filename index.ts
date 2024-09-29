import axios from "axios";
import { CodeforcesApi } from "./src/codeforces/client";
import { Bot } from "./src/discord/bot";

const cfApi = new CodeforcesApi();

async function main() {
    const bot = new Bot();
}

main();