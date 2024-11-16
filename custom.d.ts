import { InteractionHandler } from "$src/discord/utils/msg";
import { Collection } from "discord.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, InteractionHandler>;
  }
}