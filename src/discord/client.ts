import { Client, GatewayIntentBits, Guild } from "discord.js";

export class DiscordClient {
    private static GUILD_ID = '1289271676001062972';
    private static client: Client;
    private static guild: Guild;
    private static ready = false;

    private static init() {
        const client = new Client({
            intents: [
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
            ]
        });

        client.login(Bun.env.DISCORD_TOKEN);

        this.client = client;
    }

    static async waitForReady() {
        if (this.ready)
            return true;
        return new Promise((res, rej) => {
            this.client.on("ready", () => {
                this.ready = true;
                res(true);
            });
        })
    }

    static async get() {
        if (!this.client)
            this.init();
        await this.waitForReady();
        return this.client;
    }

    static getUser(discordId: string) {
        const user = this.client.users.cache.get(discordId);
        if (user)
            return user;
        return this.client.users.fetch(discordId);
    }

    static async getGuild() {
        if (this.guild)
            return this.guild;
        this.guild = await this.client.guilds.fetch(this.GUILD_ID);
        return this.guild;
    }
}