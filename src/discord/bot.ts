import { Client, GatewayIntentBits, Events, Routes, Collection, ActivityType, PresenceUpdateStatus, Interaction } from 'discord.js';
import { registeredCommands } from './commands';
import { randomInt } from 'crypto';

export class Bot {
    private readonly client: Client;
    private readonly CLIENT_ID: string;
    private readonly TOKEN: string;
    private readonly PRESENCE_INTERVAL = 120_000; // 2 minutes
    private readonly PRESENCES: string[] = [
        'Upsolving E and F',
        'Doing a virtual contest, brb',
        'Avoiding penalties',
        'Reading editorials',
    ];

    constructor() {
        this.CLIENT_ID = process.env.DISCORD_CLIENT!;
        this.TOKEN = process.env.DISCORD_TOKEN!;

        if (!this.CLIENT_ID || !this.TOKEN) {
            throw new Error('Missing environment variables: DISCORD_CLIENT or DISCORD_TOKEN.');
        }

        this.client = new Client({
            intents: [
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.Guilds
            ]
        });

        this.init();
    }

    private async init() {
        try {
            this.registerEvents();
            await this.client.login(this.TOKEN);
            await this.registerCommands();
            this.startPresenceCycling();
        } catch (error) {
            console.error('Error initializing the bot:', error);
        }
    }

    private registerEvents() {
        this.client.on(Events.ClientReady, () => {
            console.log(`${this.client.user?.tag} is now online!`);
        });

        this.client.on(Events.InteractionCreate, (interaction) => this.handleInteraction(interaction));
    }

    private async registerCommands() {
        try {
            await this.client.rest.put(
                Routes.applicationCommands(this.CLIENT_ID),
                { body: registeredCommands.map(cmd => cmd.info.toJSON()) }
            );

            this.client.commands = new Collection();

            registeredCommands.forEach(cmd => {
                this.client.commands.set(cmd.info.name, cmd.execute);
            });
        } catch (error) {
            console.error('Error registering commands:', error);
        }
    }

    private async handleInteraction(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = this.client.commands.get(interaction.commandName);
        if (!command) {
            console.error('No command found for', interaction.commandName);
            return;
        }

        try {
            command(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
        }
    }

    private startPresenceCycling() {
        this.cyclePresence();
        setInterval(() => this.cyclePresence(), this.PRESENCE_INTERVAL);
    }

    private cyclePresence() {
        const randomIndex = randomInt(0, this.PRESENCES.length);
        const presenceMessage = this.PRESENCES[randomIndex];

        try {
            this.client.user?.setPresence({
                activities: [{ name: presenceMessage, type: ActivityType.Custom }],
                status: PresenceUpdateStatus.Idle,
            });
        } catch (error) {
            console.error('Error updating presence:', error);
        }
    }
}
