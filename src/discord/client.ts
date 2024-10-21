import { Client, GatewayIntentBits } from "discord.js";

export class DiscordClient {
    private static client: Client;
    
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
}