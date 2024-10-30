import { Client, GatewayIntentBits, Guild } from "discord.js";

export class DiscordClient {
    private static GUILD_ID = '1289271676001062972';
    private static client: Client;
    private static guild: Guild;

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

    static get() {
        if (!this.client)
            this.init();
        return this.client;
    }

    static async getGuild() {
        if (this.guild)
            return this.guild;
        this.guild = await this.client.guilds.fetch(this.GUILD_ID);
        return this.guild;
    }

    static async getChannel(channelId: string): Promise<TextChannel> {
        const guild = await this.getGuild();
        return guild.channels.cache.get(channelId) as TextChannel;
    }
}