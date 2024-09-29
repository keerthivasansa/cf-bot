import { ChatInputCommandInteraction, Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { commands } from './commands';
import { registeredCommands } from './commands/register';

export class Bot {
    private client: Client
    private ClIENT_ID = process.env.DISCORD_CLIENT;
    private TOKEN = process.env.DISCORD_TOKEN;

    constructor() {
        this.client = new Client({ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds] });

        this.init();
        console.log('Starting client')
    }

    async init() {
        
        this.client.on(Events.ClientReady, () => {
            console.log(this.client.user.tag)
        })
        
        await this.client.login(this.TOKEN);

        await this.client.rest.put(Routes.applicationCommands(this.ClIENT_ID), { body: registeredCommands.map(cmd => cmd.command.toJSON()) });

        this.client.commands = new Collection();

        registeredCommands.forEach(cmd => {
            this.client.commands.set(cmd.command.name, cmd.execute);
        });
        

        this.client.on(Events.InteractionCreate, (inter) => {
            if (inter.isChatInputCommand()) {
                const callback = this.client.commands.get(inter.commandName);
                if (!callback)
                    console.log('No callback registered for', inter.command);
                else
                    callback(inter);
            }
        });
    }

    async processMessage(msg: ChatInputCommandInteraction) {
        await msg.reply("Pong!");
    }
}