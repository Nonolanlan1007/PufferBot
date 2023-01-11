import { blue, green, red } from "colors";
import { Client, Collection, Partials } from "discord.js";
import { readdirSync, writeFile } from "fs";
import { cpus, loadavg, totalmem } from "os";
import { join } from "path";
import { text } from "figlet";
import config from './config'
import moment from "moment";
import emotes from "./emotes";

class Class extends Client {
    version: string;
    slashs: Collection<string | undefined, any>;
    config: { puffer: { token: string; clientId: string; basePanelUrl: string; }; guildId: string; mongooseConnectionString: string; owners: string[]; color: number; discordToken: string; webhook: { url: string; id: string; token: string; }; howToBuyCredits: string; clientRoleId: string; };
    emotes: { yes: string; no: string; bof: string; offline: string; online: string; streaming: string; idle: string; dnd: string; boost: string; loading: string; sort: string; entre: string; alerte: string; notif: string; question: string; cadena: string; loadBar: { red: { start: string; middle: string; end: string; }; blue: { start: string; middle: string; end: string; }; }; badges: { verifieddevelopper: string; balance: string; mod: string; bravery: string; bughuntergold: string; bughunter: string; brillance: string; hypesquadevent: string; partner: string; staff: string; earlysupporter: string; verifiedbot: string; system: string; badges: string; dev: string; verificator: string; support: string; premium: string; }; discordicons: { list: string; bot: string; textchannel: string; wave: string; entre: string; game: string; id: string; hierarchie: string; key: string; man: string; img: string; tag: string; clyde: string; horloge: string; }; credit: string; };
    color: number;
    tempToken: string | undefined;

    constructor(token: string) {
        super({
            partials: [
                Partials.User,
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction
            ],
            intents: [
                "Guilds",
                "GuildMembers",
                "GuildBans",
                "GuildEmojisAndStickers",
                "GuildIntegrations",
                "GuildInvites",
                "GuildVoiceStates",
                "GuildPresences",
                "GuildMessages",
                "GuildMessageReactions",
                "GuildMessageTyping",
                "DirectMessages",
                "DirectMessageReactions",
                "DirectMessageTyping",
                "MessageContent"
            ],
        });

        this.config = config;
        this.emotes = emotes
        this.version = require("../package.json").version;
        this.slashs = new Collection()
        this.color = config.color;
        this.tempToken = undefined

        try {
            this.launch().then(() => { console.log(blue('Tout est prêt, connexion à Discord !')); })
            this.login(token);
        } catch (error: any) {
            throw new Error(error)
        }
    }

    async launch(): Promise<any> {
        console.log(green(`[BOT]`) + " Bot prêt !");
        this._slashHandler();
        this._eventsHandler();
        this._processEvent();
        this._startingMessage();
    }

    async getDiscordBio(userId: string) {
        
    }

    async postSlashs(slashsArray: any): Promise<void> {
        if (this.isReady() !== true) throw new Error("Le client n'est pas connecté");

        const guild = this.guilds.cache?.get(this.config.guildId);
        if (!guild) throw new Error("Impossible de trouver le serveur Discord.");

        const clientSlashs = slashsArray.filter((slash: any) => slash.guild_id === undefined).toJSON();
        const guildSlashs = slashsArray.filter((slash: any) => slash?.guild_id !== undefined).toJSON();

        try {
            await this?.application?.commands.set(clientSlashs);
            await guild.commands.set(guildSlashs);
        } catch (error: any) {
            throw new Error(error);
        }

        console.log(`${green("[SLASHS]")} Slashs Commands Posted\nClient Commands: ${this?.application?.commands.cache.size}\nGuild Commands: ${guild.commands.cache.size}`);
    }

    private _slashHandler(): any {
        let count = 0;
        const folders = readdirSync(join(__dirname, "slashs"));
        for (let i = 0; i < folders.length; i++) {
            const slashs = readdirSync(join(__dirname, "slashs", folders[i]));
            count = count + slashs.length;
            for (const c of slashs) {
                try {
                    const slash = require(join(__dirname, "slashs", folders[i], c));
                    this.slashs.set(slash.name, slash);
                } catch (error: any) {
                    console.log(`${red('[SLASHS]')} Une erreur est survenue lors du chargement de la commande ${c} : ${error.stack || error}`)
                }
            }
        }
        console.log(`${green('[SLASHCOMMANDS]')} ${this.slashs.size}/${count} commandes slash chargée(s)`)
    }

    private _eventsHandler(): any {
        let count = 0;
        const files = readdirSync(join(__dirname, "events"));
        files.forEach((event) => {
            try {
                count++;
                const file = require(join(__dirname, "events", event));
                this.on(event.split('.')[0], file.bind(null, this));
                delete require.cache[require.resolve(join(__dirname, "events", event))];
            } catch (error: any) {
                throw new Error(`${red('[EVENTS]')} Une erreur est survenue lors du chargement de l'évènement ${event} : ${error.stack || error}`)
            }
        });
        console.log(`${green('[EVENTS]')} ${count}/${files.length} évènements chargé(s) !`)
    }

    private _processEvent() {
        process.on('unhandledRejection', async (error: any) => {
            console.log(error.stack || error)
            this.config.owners.forEach(async (owner: string) => {
            	const o = await this.users.fetch(owner).catch(() => { });
            	if (o && o.id) {
                	o.send({
                    	embeds: [
                        	{
                            	title: 'Une erreur est survenue',
                            	description: '```js\n' + error + '```',
                            	footer: {
                                	text: moment(Date.now()).format('DD_MM_YYYY_kk_mm_ss_ms')
                            	}
                        	}
                    	]
                	}).catch(() => { });
                }
            })
        });
    }

    private _startingMessage() {
        const cpuCores = cpus().length;
        //Custom Starting Message
        text('PufferBot', {
            font: "Standard"
        }, function (err, data) {
            if (err) {
                console.log('Quelque chose ne va pas...');
                console.dir(err);
                return;
            }
            const data2 = data;
            text('PufferPanel bot', {
            }, function (err, data) {
                if (err) {
                    console.log('Quelque chose ne va pas...');
                    console.dir(err);
                    return;
                }
                console.log("================================================================================================================================" + "\n" +
                    data2 + "\n\n" + data + "\n" +
                    "================================================================================================================================" + "\n" +
                    `CPU: ${(loadavg()[0] / cpuCores).toFixed(2)}% / 100%` + "\n" +
                    `RAM: ${Math.trunc((process.memoryUsage().heapUsed) / 1000 / 1000)} MB / ${Math.trunc(totalmem() / 1000 / 1000)} MB` + "\n" +
                    //`Discord WebSocket Ping: ${this.ws.ping}` + "\n" +
                    "================================================================================================================================"
                );
            });

        });
    }
}

export = Class;

new Class(config.discordToken);