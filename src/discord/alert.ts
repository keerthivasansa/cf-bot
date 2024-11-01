import { DiscordClient } from "./client";

export async function alertNewLevel(handle: string, curr_rating: number, max_rating: number) {
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

    const discordClient = DiscordClient.get();
    const channel = await discordClient.channels.fetch('###');

    if (curr_rating > max_rating) {
        const newLevel = levels.find(level => curr_rating >= level.minRating);
        const msg = `🎉 Congratulations ${handle} ! You've reached a new level: ${newLevel.name} with a rating of ${curr_rating}! Keep up the great work! 🎉`;

        if (channel.isTextBased() && channel.isSendable())
            channel.send(msg);
    }
}
