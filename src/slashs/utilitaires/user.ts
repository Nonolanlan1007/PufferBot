import {ChatInputCommandInteraction, PermissionsBitField} from "discord.js";
import Class from "../..";
import config from "../../config";
import Slash from "../../utils/Slash";
import servers from "../../models/servers";
import users from "../../models/users";
import {
    getUser,
    getUserPerms,
    getUserServers
} from "../../utils/PufferAPI";

class UserCmd extends Slash {
    constructor() {
        super({
            name: "user",
            description: "Voir les informations usr un utilisateur.",
            default_member_permissions: PermissionsBitField.Flags.Administrator,
            guild_id: config.guildId,
            options: [
                {
                    name: "id",
                    description: "L'ID de l'utilisateur.",
                    type: 10,
                    required: true,
                    autocomplete: true
                }
            ]
        });
    }

    async run(client: Class, interaction: ChatInputCommandInteraction) {
        const id = interaction.options.getNumber("id") as number;

        const user = await users.findOne({id: id })

        if (!user) return interaction.reply({content: `**${client.emotes.no} ➜ Utilisateur introuvable.**`, ephemeral: true});

        const discordUser = await client.users.fetch(String(user.discordId)).catch(() => null);

        const pufferUser = user.id > 0 ? await getUser(client, id) : null;

        const userServers = pufferUser ? await getUserServers(client, pufferUser.username) : null;

        const userPerms = pufferUser ? await getUserPerms(client, pufferUser.id) : null;

        let fields = [
            {
                name: "ID PufferPanel :",
                value: "`" + user.id + "`",
                inline: true
            },
            {
                name: "ID Discord :",
                value: "`" + user.discordId + "`",
                inline: true
            }
        ]

        if (pufferUser) {
            fields.push({
                name: "Nom d'utilisateur PufferPanel :",
                value: "`" + pufferUser.username + "`",
                inline: true
            })
            fields.push({
                name: "Adresse mail :",
                value: "`" + pufferUser.email + "`",
                inline: true
            })
        }

        if (userPerms) {
            fields.push({
                name: "Administateur :",
                value: userPerms.admin ? "✅" : "❌",
                inline: true
            })
        }

        if (userServers && userServers.servers && userServers.servers.length > 0) {
            fields.push({
                name: "Serveurs :",
                value: "`" + userServers.servers.map((server: any) => server.id).join("`, `") + "`",
                inline: true
            })
        }

        await interaction.reply({
            embeds: [
                {
                    title: "Informations sur l'utilisateur " + id,
                    color: client.color,
                    fields: fields,
                    url: `https://gituhb.com/Nonolanlan1007`,
                    footer: {
                        text: "Pour préserver la confidentialité des données de l'utilisateur, certaines informations ne seront pas affichée ici."
                    }
                }
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: "Voir en ligne !",
                            style: 5,
                            url: client.config.puffer.basePanelUrl + "/user/" + id,
                            emoji: {
                                name: "🌐"
                            }
                        }
                    ]
                }
            ],
            ephemeral: true
        })
    }
}

export = new UserCmd();