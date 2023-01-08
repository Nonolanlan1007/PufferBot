import {ChatInputCommandInteraction, Message, PermissionsBitField} from "discord.js";
import Class from "../..";
import config from "../../config";
import Slash from "../../utils/Slash";
import bot from "../../models/bot";
import servers from "../../models/servers";
import users from "../../models/users";
import {deleteServer, getServer, getServerStats, getServerStatus, getUser} from "../../utils/PufferAPI";
import products from "../../models/products";
import moment from "moment/moment";

class Server extends Slash {
    constructor() {
        super({
            name: "server",
            description: "Gérer les serveurs.",
            default_member_permissions: PermissionsBitField.Flags.Administrator,
            guild_id: config.guildId,
            options: [
                {
                    name: "suspend",
                    description: "Suspendre un serveur.",
                    type: 1,
                    options: [
                        {
                            name: "id",
                            description: "L'ID du serveur.",
                            type: 3,
                            required: true,
                            autocomplete: true
                        },
                        {
                            name: "raison",
                            description: "La raison de la suspension.",
                            type: 3,
                            required: true,
                            min_length: 10,
                            max_length: 500
                        }
                    ]
                },
                {
                    name: "delete",
                    description: "Supprimer un serveur immédiatement.",
                    type: 1,
                    options: [
                        {
                            name: "id",
                            description: "L'ID du serveur.",
                            type: 3,
                            required: true,
                            autocomplete: true
                        },
                        {
                            name: "raison",
                            description: "La raison de la suppression.",
                            type: 3,
                            required: true,
                            min_length: 10,
                            max_length: 500
                        }
                    ]
                },
                {
                    name: "see",
                    description: "Voir les informations d'un serveur.",
                    type: 1,
                    options: [
                        {
                            name: "id",
                            description: "L'ID du serveur.",
                            type: 3,
                            required: true,
                            autocomplete: true
                        }
                    ]
                }
            ]
        });
    }

    async run(client: Class, interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case "suspend": {
                return interaction.reply({
                    content: "Cette commande est en cours de développement.",
                    ephemeral: true
                })
                /*
                const id = interaction.options.getString("id") as string;
                const reason = interaction.options.getString("raison");

                const server = await servers.findOne({id: id})
                if (!server) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Serveur introuvable.**`,
                    ephemeral: true
                });
                if (server.suspended) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Ce serveur est déjà suspendu.**`,
                    ephemeral: true
                })

                const suspend = await suspendServer(client, id)

                if (!suspend) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Une erreur est survenue lors de la suspension du serveur.**`,
                    ephemeral: true
                })

                await servers.updateOne({id: id}, {$set: {suspended: true}})

                const user = await users.findOne({id: server.owner})
                let fields = []

                fields.push({
                    name: "Raison :",
                    value: "```\n" + reason + "```"
                })

                if (user) {
                    const discordUser = await client.users.fetch(user.id).catch(() => null)

                    if (discordUser) {

                        await discordUser.send({
                            embeds: [
                                {
                                    title: "Serveur suspendu !",
                                    color: client.color,
                                    description: `**ID du serveur :** \`${server.id}\``,
                                    fields: fields,
                                    url: "https://github.com/Nonolanlan1007"
                                }
                            ]
                        }).catch(() => fields.push({
                            name: "⚠️ Avertissement",
                            value: `Le propriétaire du service n'a pas pu être averti par message privé.`
                        }))
                        if (!discordUser) fields.push({
                            name: "⚠️ Avertissement",
                            value: `Le propriétaire du service n'a pas pu être averti par message privé.`
                        })
                    }
                }

                const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)

                if (!webhook) {
                    new Error("Webhook introuvable.")
                    return interaction.reply({
                        content: `**${client.emotes.no} ➜ Une erreur interne est survenue.**`,
                        ephemeral: true
                    })
                }

                await webhook.send({
                    embeds: [
                        {
                            title: "Serveur suspendu !",
                            color: client.color,
                            description: `**ID Discord :** \`${interaction.user.id}\`\n**ID PufferPanel :** \`${user!.id}\`\n**ID du serveur :** \`${server.id}\`\n**Modérateur :** \`${interaction.user.tag}\``,
                            fields: fields,
                            url: "https://github.com/Nonolanlan1007"
                        }
                    ]
                })

                interaction.reply({
                    content: `**${client.emotes.yes} ➜ Le serveur \`${server.id}\` a été suspendu.**`,
                    ephemeral: true
                })

                break*/
            }
            case "delete": {
                const id = interaction.options.getString("id") as string;
                const reason = interaction.options.getString("raison") as string;

                const serverData = await getServer(client, id);
                if (!serverData) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Serveur introuvable.**`,
                    ephemeral: true
                })

                const serverDB = await servers.findOne({id: id})
                if (!serverDB) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Serveur introuvable.**`,
                    ephemeral: true
                })

                const user = await users.findOne({id: serverDB.owner})



                const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)
                const discordUser = await client.users.fetch(user!.discordId!).catch(() => null)

                if (!webhook) {
                    new Error("Webhook introuvable.")
                    return interaction.reply({
                        content: `**${client.emotes.no} ➜ Une erreur interne est survenue.**`,
                        ephemeral: true
                    })
                }

                await deleteServer(client, id)

                await servers.deleteOne({id: id})

                let fields = [
                    {
                        name: "Raison :",
                        value: "```\n" + reason + "```"
                    }
                ]

                if (discordUser) discordUser.send({
                    embeds: [
                        {
                            title: "Serveur supprimé !",
                            color: client.color,
                            description: `**ID Discord :** \`${interaction.user.id}\`\n**ID PufferPanel :** \`${user!.id}\`\n**ID du serveur :** \`${serverDB.id}\``,
                            fields: fields,
                            url: "https://github.com/Nonolanlan1007",
                            footer: {
                                text: "Cette action est irréversible, et aucun remboursement ne sera effectué."
                            }
                        }
                    ]
                }).catch(() => fields.push({
                    name: "⚠️ Avertissement",
                    value: `Le propriétaire du service n'a pas pu être averti par message privé.`
                }))
                if (!discordUser) fields.push({
                    name: "⚠️ Avertissement",
                    value: `Le propriétaire du service n'a pas pu être averti par message privé.`
                })

                await webhook.send({
                    embeds: [
                        {
                            title: "Serveur supprimé !",
                            color: client.color,
                            description: `**ID Discord :** \`${interaction.user.id}\`\n**ID PufferPanel :** \`${user!.id}\`\n**ID du serveur :** \`${serverDB.id}\`\n**Modérateur :** \`${interaction.user.tag}\``,
                            fields: fields,
                            url: "https://github.com/Nonolanlan1007"
                        }
                    ]
                })

                await interaction.reply({
                    content: `**${client.emotes.yes} ➜ Le serveur \`${serverDB.id}\` a été supprimé.**`,
                    ephemeral: true
                })
                break
            }
            case "see": {
                const id = interaction.options.getString("id") as string;

                const serverData = await getServer(client, id);
                if (!serverData) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Serveur introuvable.**`,
                    ephemeral: true
                })

                const serverDB = await servers.findOne({id: id})
                if (!serverDB) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Serveur introuvable.**`,
                    ephemeral: true
                })

                const user = await users.findOne({id: serverDB.owner})


                const product = await products.findOne({id: serverDB.productId})

                const status = await getServerStatus(client, serverData.server.id)

                const stats = status ? await getServerStats(client, serverData.server.id) : null

                let fields = [
                    {
                        name: "Nom :",
                        value: "`" + serverData.server.name + "`"
                    },
                    {
                        name: "Expire le :",
                        value: "`" + moment(serverDB.expirationDate).format("Do MMMM YYYY") + "`",
                        inline: true
                    },
                    {
                        name: "Résiliation en attente :",
                        value: "`" + (serverDB.cancelled ? "✅" : "❌") + "`",
                        inline: true
                    },
                    {
                        name: "Statut :",
                        value: "`" + (status ? "🟢" : "🔴") + "`",
                    }
                ]

                if (status && stats) fields.push({
                    name: "Ressources utilisées :",
                    value: `**CPU :** \`${stats.cpu}%\`\n**RAM :** \`${stats.memory}MB\``,
                    inline: true
                })

                if (user) fields.push({
                    name: "Propriétaire :",
                    value: `**ID Discord :** \`${user.discordId}\`\n**ID PufferPanel :** \`${user.id}\``,
                    inline: false
                })

                if (product) fields.push({
                    name: "Produit :",
                    value: `\`[${product.model}] [${product.id}] ${product.title}\``,
                    inline: true
                })
                if (product) fields.push({
                    name: "Coût de renouvellement :",
                    value: `${product.price} ${client.emotes.credit}`,
                    inline: false
                })


                await interaction.reply({
                    embeds: [
                        {
                            title: "Informations sur le serveur " + id,
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
                                    url: client.config.puffer.basePanelUrl + "/server/" + id,
                                    emoji: {
                                        name: "🌐"
                                    }
                                }
                            ]
                        }
                    ],
                    ephemeral: true
                })

                break
            }
        }
    }
}

export = new Server;