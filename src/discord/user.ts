import { DiscordClient } from "./client";
import { getRole, MAIN_SERVER_ID, TEST_SERVER_ID } from "./roles";


export class UserProcesser {

    static async processRatingChange(discordId: string, oldRating: number, newRating: number) {
        const discordClient = await DiscordClient.get();
        for (const serverId of [TEST_SERVER_ID, MAIN_SERVER_ID]) {
            const guild = await discordClient.guilds.fetch(serverId);
            try {
                const member = await guild.members.fetch(discordId);
                if (!guild.members.cache.has(discordId))
                    continue;
                if (!member)
                    continue;
                const roleId = getRole(newRating, serverId), oldRoleId = getRole(oldRating, serverId);
                const oldRole = guild.roles.cache.get(oldRoleId);
                const role = guild.roles.cache.get(roleId);
                if (member.roles.cache.some(role => role.id === roleId))
                    continue;
                await member.roles.add(role);
                if (oldRoleId != roleId)
                    await member.roles.remove(oldRole);
            } catch {}
        }
    }
}