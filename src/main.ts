import * as botEnv from 'arbor-common/src/environment';
import * as guildSettingsHelper from "arbor-common/src/guild-settings";
import {GuildSettings} from "arbor-common/src/guild-settings";
import {Channel, Client, Events, GatewayIntentBits, Guild, TextChannel} from 'discord.js';
import {BotSettings} from "./settings";

const BOT_NAME = 'arbor-announcer';

const globalSettings: BotSettings | null = botEnv.initialize<BotSettings>(BOT_NAME);

if (!globalSettings || !globalSettings.announceIntervalMs) {
    console.error("Please configure bot-settings.json");
    process.exit(1);
}

console.log(`Announcement interval: ${globalSettings.announceIntervalMs}ms`);
setInterval(doAnnounce, globalSettings.announceIntervalMs)

const botClient = new Client({ intents: [GatewayIntentBits.Guilds] });
let ready: boolean = false;
let guilds: Set<string> = new Set();

botClient.once(Events.ClientReady, _ => {
    ready = true;
    console.log("Ready");
});

botClient.on(Events.GuildAvailable, (guild: Guild): void => {
    console.log(`GuildAvailable: ${guild.id}`);
    guilds.add(guild.id);
})

botClient.login(botEnv.getToken());

async function doAnnounce(): Promise<void> {
    if (!ready || !guilds) {
        return;
    }

    for (const guildId of guilds.keys()) {
        await announceForGuild(guildId);
    }
}

async function announceForGuild(guildId: string): Promise<void> {
    const guildSettings: GuildSettings = guildSettingsHelper.getForGuild(guildId, {});
    const channelId: string | null = guildSettings.data?.announcementChannelId;
    const messages: string[] = guildSettings.data?.messages;

    if (messages.length === 0) {
        console.warn(`Missing announcement messages for guild: ${guildId}`);
        return;
    }

    if (channelId == null || channelId.trim().length === 0) {
        console.warn(`Missing announcementChannelId for guild: ${guildId}`);
        return;
    }

    const randomIndex: number = Math.floor(Math.random() * messages.length);
    const message: string = messages[randomIndex];

    const channel: Channel | null = await botClient.channels.fetch(channelId);

    if (channel instanceof TextChannel) {
        await channel.send({
            embeds: [
                {
                    color: Math.floor(Math.random() * 0xFFFFFF),
                    description: message,
                }
            ]
        });
    }
}
