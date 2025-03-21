import * as botEnv from 'arbor-common/src/environment.mjs';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { BotSettings, GuildAnnouncementData } from "./settings.mjs";
import * as guildSettingsHelper from "arbor-common/src/guild-settings.mjs";

const BOT_NAME = 'arbor-announcer';

const globalSettings = botEnv.initialize(BOT_NAME, new BotSettings());

if (!globalSettings || !globalSettings.announceIntervalMs) {
    console.error("Please configure bot-settings.json");
    process.exit(1);
}

console.log(`Announcement interval: ${globalSettings.announceIntervalMs}ms`);
setInterval(doAnnounce, globalSettings.announceIntervalMs)

const botClient = new Client({ intents: [GatewayIntentBits.Guilds] });
let ready = false;
let guilds = new Set();

botClient.once(Events.ClientReady, _ => {
    ready = true;
    console.log("Ready");
});

botClient.on(Events.GuildAvailable, guild => {
    console.log(`GuildAvailable: ${guild.id}`);
    guilds.add(guild.id);
})

botClient.login(botEnv.getToken());

async function doAnnounce() {
    if (!ready || !guilds) {
        return;
    }

    for (const guildId of guilds.keys()) {
        await announceForGuild(guildId);
    }
}

async function announceForGuild(guildId) {
    const guildSettings = guildSettingsHelper.getForGuild(guildId, new GuildAnnouncementData());
    const channelId = guildSettings.data?.announcementChannelId;
    const messages = guildSettings.data?.messages;

    if (!(messages instanceof Array) || messages.length === 0) {
        console.warn(`Missing announcement messages for guild: ${guildId}`);
        return;
    }

    if (typeof channelId !== 'string' || channelId.trim().length === 0) {
        console.warn(`Missing announcementChannelId for guild: ${guildId}`);
        return;
    }

    const randomIndex = Math.floor(Math.random() * messages.length);
    const message = messages[randomIndex];

    const channel = await botClient.channels.fetch(channelId);
    await channel.send({
        embeds: [
            {
                color: Math.floor(Math.random() * 0xFFFFFF),
                description: message,
            }
        ]
    });
}
