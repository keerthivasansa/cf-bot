import { DiscordClient } from "./client";
import { getRole } from "./roles";


export class UserProcesser {
    private static readonly SERVER_ID = '1289271676001062972';

    static async processRatingChange(discordId: string, oldRating:number, newRating: number) {
        const discordClient = DiscordClient.get();
        const guild = discordClient.guilds.cache.get(this.SERVER_ID);
        const member = await guild.members.fetch(discordId);
        const roleId = getRole(newRating), oldRoleId = getRole(oldRating);
        const oldRole = guild.roles.cache.get(oldRoleId);
        const role = guild.roles.cache.get(roleId);
        if (member.roles.cache.some(role => role.id === roleId)){
            console.log("already exists");
            return;
        }
        await member.roles.add(role);
        if (oldRoleId != roleId)
            await member.roles.remove(oldRole);
        console.log({ oldRating, newRating, name: member.displayName, role: role.name })
    }
}