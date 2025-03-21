export class BotSettings {
    announceIntervalMs;
}

export class GuildAnnouncementData {
    constructor(announcementChannelId = "", messages = []) {
        this.announcementChannelId = announcementChannelId;
        this.messages = messages;
    }
}
