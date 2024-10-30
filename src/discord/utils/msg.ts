import { EmbedBuilder, type ChatInputCommandInteraction, type InteractionReplyOptions } from "discord.js";

export type InteractionHandler = (msg: ChatInputCommandInteraction, interaction: Interaction) => Promise<any>;

export class Interaction {
    private message: ChatInputCommandInteraction;
    private readonly DEFER_TIMEOUT = 2_000;

    constructor(message: ChatInputCommandInteraction) {
        this.message = message;
    }

    async handle(fn: InteractionHandler) {
        setTimeout(() => this.defer(), this.DEFER_TIMEOUT);

        try {
            await fn(this.message, this);
        } catch (err) {
            let msg = "";
            if (err instanceof Error)
                msg = err.message;

            this.reply(`[FAILED] Error: ${msg}`);
        }
    }

    defer() {
        if (this.message.replied)
            return;
        this.message.deferReply();
        this.message.deferred = true;
    }

    reply(options: InteractionReplyOptions | string) {
        if (this.message.deferred || this.message.replied)
            return this.message.editReply(options);
        else
            return this.message.reply(options);
    }
}
