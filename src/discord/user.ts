import { DiscordClient } from "./client";
import { getRole, MAIN_SERVER_ID, TEST_SERVER_ID } from "./roles";


export class UserProcesser {

    static async processRatingChange(discordId: string, oldRating: number, newRating: number) {
        const discordClient = DiscordClient.get();
        for (const serverId of [TEST_SERVER_ID, MAIN_SERVER_ID]) {
            const guild = discordClient.guilds.cache.get(serverId);
            const member = await guild.members.fetch(discordId);
            const roleId = getRole(newRating, serverId), oldRoleId = getRole(oldRating, serverId);
            const oldRole = guild.roles.cache.get(oldRoleId);
            const role = guild.roles.cache.get(roleId);
            if (member.roles.cache.some(role => role.id === roleId)) {
                console.log("already exists");
                return;
            }
            await member.roles.add(role);
            if (oldRoleId != roleId)
                await member.roles.remove(oldRole);
            console.log({ oldRating, newRating, name: member.displayName, role: role.name })
        }
    }
}