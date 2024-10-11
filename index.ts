import 'reflect-metadata';
import { Bot } from "$src/discord/bot";
import { CFCacher } from '$src/codeforces/cacher';
import { generateTableSVG } from '$src/common/svg';

const application = {
    entry: [Bot, CFCacher],
}

async function main() {
    console.log(img);
}

main();
