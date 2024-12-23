import { DiscordClient } from "./client";

export async function alertNewLevel(discordId: string, handle: string, curr_rating: number, max_rating: number) {
    const levels = [
        { name: "Tourist", minRating: 4000 },
        { name: "Legendary Grandmaster", minRating: 3000 },
        { name: "International Grandmaster", minRating: 2600 },
        { name: "Grandmaster", minRating: 2400 },
        { name: "International Master", minRating: 2300 },
        { name: "Master", minRating: 2100 },
        { name: "Candidate Master", minRating: 1900 },
        { name: "Expert", minRating: 1600 },
        { name: "Specialist", minRating: 1400 },
        { name: "Pupil", minRating: 1200 },
        { name: "Newbie", minRating: 0 }
    ];

    const client = await DiscordClient.get();
    const ch = await client.channels.fetch('1288870061875925075');

    const maxlevel = levels.find(level => max_rating >= level.minRating);
    const currlevel = levels.find(level => curr_rating >= level.minRating);

    if (maxlevel.minRating < currlevel.minRating) {
        const msg = `🎉 Congratulations <@${discordId}> ! You've reached a new level: ${currlevel.name} with a rating of ${curr_rating}! Keep up the great work! 🎉\n\nCF Handle: ${handle}`;

        if (ch.isTextBased() && ch.isSendable())
            ch.send(msg);
    }
}
