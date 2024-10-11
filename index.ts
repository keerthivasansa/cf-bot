import 'reflect-metadata';
import { Bot } from "$src/discord/bot";
import { CFCacher } from '$src/codeforces/cacher';
import { generateTableSVG } from '$src/common/svg';

const application = {
    entry: [Bot, CFCacher],
}

async function main() {
    application.entry.forEach(cls => new cls());
}

main();
