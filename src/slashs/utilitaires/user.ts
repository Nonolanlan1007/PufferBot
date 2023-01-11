import {ChatInputCommandInteraction, PermissionsBitField, User} from "discord.js";
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
            description: "Voir les informations sur un utilisateur.",
            default_member_permissions: PermissionsBitField.Flags.Administrator,
            guild_id: config.guildId,
            options: [
                {
                    type: 1,
                    name: "see",
                    description: "Voir les informations d'un utilisateur.",
                    options: [
                        {
                            type: 10,
                            name: "id",
                            description: "L'ID de l'utilisateur.",
                            required: true,
                            autocomplete: true
                        }
                    ]
                },
                {
                    type: 1,
                    name: "assign",
                    description: "Relier un utilisateur PufferPanel à un utilisateur Discord.",
                    options: [
                        {
                            type: 3,
                            name: "puffer_id",
                            description: "Identifiant du compte PufferPanel.",
                            required: true,
                            autocomplete: true
                        },
                        {
                            type: 6,
                            name: "discord_user",
                            description: "Utilisateur Discord.",
                            required: true
                        }
                    ]
                }
            ]
        });
    }

    async run(client: Class, interaction: ChatInputCommandInteraction) {
        switch(interaction.options.getSubcommand()) {
            case "see": {
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

                break;
            }
            case "assign": {
                const pufferId = interaction.options.getString("puffer_id") as string;
                const discordUser = interaction.options.getUser("discord_user") as User;

                const user = await users.findOne({discordId:discordUser.id})

                if (user && user.id !== 0) return interaction.reply({
                    content: `**${client.emotes.no} ➜ L'utilisateur ${discordUser.tag} est déjà relié à un compte PufferPanel.**`,
                    ephemeral: true
                })

                const pufferUser = await getUser(client, Number(pufferId))

                if (!pufferUser) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue !**`,
                    ephemeral: true
                })

                if (user) {
                    await users.updateOne({discordId: discordUser.id}, {id: Number(pufferId)})
                }
                else {
                    new users({
                        id: Number(pufferId),
                        discordId: discordUser.id,
                        credits: 0
                    }).save()
                }

                const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)

                if (!webhook) new Error("Webhook introuvable.")

                if (webhook) await webhook.send({
                    embeds: [
                        {
                            title: "Compte relié !",
                            color: client.color,
                            description: `**ID Discord :** \`${discordUser.id}\`\n**ID PufferPanel :** \`${pufferUser!.id}\`\n**Modérateur :** \`${interaction.user.id}\``,
                            url: client.config.puffer.basePanelUrl + "/user/" + pufferUser.id,
                        }
                    ]
                })

                interaction.reply({
                    content: `**${client.emotes.yes} ➜ L'utilisateur ${discordUser.tag} a bien été relié à l'utilisateur ${pufferId} !**`,
                    ephemeral: true
                })
            }
        }
    }
}

export = new UserCmd();