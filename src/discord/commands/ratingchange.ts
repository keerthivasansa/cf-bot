import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Command } from "../type";
import { CFApiFactory } from "$src/codeforces/client";
import { db } from "$db/index";

function getEmbedColor(rating: number): number {
		if (rating >= 3000) return 0xFF0000; // Legendary Grandmaster
		if (rating >= 2600) return 0xFF0000; // International Grandmaster
		if (rating >= 2400) return 0xFF0000; // Grandmaster
		if (rating >= 2300) return 0xFFA500; // International Master
		if (rating >= 2100) return 0xFFA500; // Master
		if (rating >= 1900) return 0xAA00AA; // Candidate Master
		if (rating >= 1600) return 0x0000FF; // Expert
		if (rating >= 1400) return 0x03A89E; // Specialist
		if (rating >= 1200) return 0x00FF00; // Pupil
		return 0xA9A9A9; // Newbie
}

export const ratingChangeCmd: Command = {
	info: new SlashCommandBuilder()
		.setName("ratingchange")
		.setDescription("Get rating change for a contest and user")
		.addIntegerOption(option => option
			.setName("contest")
			.setDescription("Contest ID")
			.setRequired(true)
		)
		.addStringOption(option => option
			.setName("handle")
			.setDescription("Codeforces handle (optional)")
		),
	async execute(msg, interaction) {
		const contestId = msg.options.getInteger("contest");
		let handle = msg.options.getString("handle");

		if (!handle) {
			// Get handle from DB for the user
			const user = await db.selectFrom('users').select(['handle'])
				.where('discordId', '=', msg.user.id).executeTakeFirst();
			if (!user) {
				return interaction.reply("You have not registered your handle yet!");
			}
			handle = user.handle;
		}

		const cfApi = CFApiFactory.get();
		let ratingChanges;
		try {
			ratingChanges = await cfApi.getContestRatingChanges(contestId);
		} catch (err) {
			return interaction.reply("Failed to fetch rating changes for this contest.");
		}

		const userChange = ratingChanges.find(rc => rc.handle.toLowerCase() === handle.toLowerCase());
		if (!userChange) {
			return interaction.reply(`No rating change found for handle \`${handle}\` in contest \`${contestId}\`.`);
		}

		// Get contest name
		let contestName = `Contest ${contestId}`;
		try {
			const contest = await cfApi.getContestInfo(contestId);
			contestName = contest.name;
		} catch {}

		const embed = new EmbedBuilder()
			.setTitle(`Rating Change: ${contestName}`)
			.setColor(getEmbedColor(userChange.newRating))
			.addFields(
				{ name: "Handle", value: userChange.handle, inline: true },
				{ name: "Old Rating", value: userChange.oldRating.toString(), inline: true },
				{ name: "New Rating", value: userChange.newRating.toString(), inline: true },
				{ name: "Rank", value: `#${userChange.rank}`, inline: true }
			)
			.setFooter({ text: `Contest ID: ${contestId}` });

		return interaction.reply({ embeds: [embed] });
	}
};
