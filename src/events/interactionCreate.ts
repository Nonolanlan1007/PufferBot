import {
    ButtonInteraction, GuildMember,
    Interaction,
    Message,
    MessageComponentInteraction,
    SelectMenuInteraction, StringSelectMenuInteraction
} from "discord.js";
import Class from "..";
import products from "../models/products";
import users from "../models/users";
import NewAccountModal from "../modals/NewAccountModal";
import SendModal from "../utils/SendModal";
import {updatePanel} from "../functions/updatePanel";
import {join} from "path";
import {readdirSync, readFileSync} from "fs";
import generator from "generate-password";
import {
    deleteServer,
    getServer,
    getServerConsole,
    getServerStats,
    getServerStatus,
    getUser, getUsers,
    getUserServers, installServer,
    killServer,
    newServer, startServer
} from "../utils/PufferAPI";
import ms from "ms";
import serversDB from "../models/servers";
import moment from "moment";
import {isNull} from "util";

moment.locale('fr');

export = async (client: Class, interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        const slash = client.slashs.get(interaction.commandName);

        if (!slash) return;

        try {
            await slash.run(client, interaction);
        } catch (error: any) {
            interaction.reply({
                content: "Une erreur s'est produite lors de l'utilisation de cette commande.",
                ephemeral: true
            });
            console.log(error);
        }
    }

    if (interaction.isAutocomplete()) {
        if (interaction.commandName === "product") {
            if (interaction.options.getSubcommand() === "add") {

                let entry = interaction.options.getFocused()

                let files = readdirSync(join(__dirname, "../serverTemplates"));

                let models = []

                for (const file in files) {
                    const content = require(`../serverTemplates/${files[file]}`)

                    if (!content) return

                    models.push(content)
                }

                let choices = models.filter((model: any) => model.default.name.toLowerCase().includes(entry.toLowerCase()) || model.default.display.toLowerCase().includes(entry.toLowerCase()))

                await interaction.respond(entry === "" ? models.map((model: any) => ({name: model.default.display, value: model.default.name})) : choices.map((model: any) => ({name: model.default.display, value: model.default.name})))
            }
            if (interaction.options.getSubcommand() === "stock") {
                let entry = interaction.options.getFocused()

                const db = await products.find();

                let choices = db.filter((product: any) => product.title.toLowerCase().includes(entry.toLowerCase()))

                await interaction.respond(entry === "" ? db.map((product: any) => ({
                    name: product.title,
                    value: String(product.id)
                })) : choices.map((product: any) => ({name: product.title, value: String(product.id)})))
            }
        }
        if (interaction.commandName === "server") {
            let entry = interaction.options.getFocused()

            const db = await serversDB.find();

            let choices = db.filter((server: any) => server.id.toLowerCase().includes(entry.toLowerCase()))

            await interaction.respond(entry === "" ? db.map((server: any) => ({
                name: server.id,
                value: String(server.id)
            })) : choices.map((server: any) => ({name: server.id, value: String(server.id)})))
        }

        if (interaction.commandName === "user") {
            if (interaction.options.getSubcommand() === "see") {
                let entry = interaction.options.getFocused()

                let db = await users.find();

                db = db.filter((x: any) => x.id > 0)

                let choices = db.filter((user: any) => user.discordId.toLowerCase().includes(entry.toLowerCase()) || user.id.toLowerCase().includes(entry.toLowerCase()))

                await interaction.respond(entry === "" ? db.map((user: any) => ({
                    name: user.id,
                    value: String(user.id)
                })) : choices.map((user: any) => ({name: user.id, value: String(user.id)})))
            }

            if (interaction.options.getSubcommand() === "assign") {
                let entry = interaction.options.getFocused()

                let users = await getUsers(client);

                console.log(users)

                if (!users) return;

                let choices = users.filter((user: any) => String(user.id).includes(entry.toLowerCase()) || user.username.toLowerCase().includes(entry.toLowerCase()))

                await interaction.respond(entry === "" ? users.map((user: any) => ({
                    name: user.username,
                    value: String(user.id)
                })) : choices.map((user: any) => ({name: user.username, value: String(user.id)})))
            }
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "buyProduct") {
            let produits = await products.find()
            produits = produits.filter((p: any) => p.stock > 0)
            let user = await users.findOne({discordId: interaction.user.id})
            if (!user) {
                await new users({
                    id: 0,
                    discordId: interaction.user.id,
                    credits: 0
                }).save()
                user = await users.findOne({discordId: interaction.user.id})
            }

            interaction.reply({
                embeds: [
                    {
                        title: "Acheter un service",
                        color: client.color,
                        description: "Choisissez un service à acheter avec le menu ci-dessous.",
                        fields: [
                            {
                                name: "Vos crédits :",
                                value: `${user!.credits} ${client.emotes.credit}`
                            }
                        ]
                    }
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 3,
                                customId: "buyProductSelect",
                                placeholder: "Choisissez un service à acheter.",
                                options: produits.map((product: any) => ({ label: product.title, value: String(product.id) }))
                            }
                        ]
                    }
                ],
                ephemeral: true,
                fetchReply: true
            }).then(async (message: Message) => {
                const filter = (i: SelectMenuInteraction) => i.user.id === interaction.user.id && i.customId === "buyProductSelect";
                // @ts-ignore
                const collector = await message.createMessageComponentCollector({ filter, max: 1 })

                // @ts-ignore
                collector.on("collect", async (i: SelectMenuInteraction) => {
                    const product = await products.findOne({id: Number(i.values[0])})

                    if (!product || product.stock === 0) {
                        await i.deferUpdate()
                        return interaction.editReply({
                            content: `**${client.emotes.no} ➜ Zut, tu n'as pas été assez rapide ! Il n'y a plus de stock sur ce produit.**`,
                            embeds: [],
                            components: []
                        })
                    }

                    if (user!.credits! < product.price!) {
                        await i.deferUpdate()
                        return interaction.editReply({
                            content: `**${client.emotes.no} ➜ Tu n'as pas assez de crédits pour acheter ce produit.**`,
                            embeds: [],
                            components: [
                                {
                                    type: 1,
                                    components: [
                                        {
                                            type: 2,
                                            style: 1,
                                            label: "Acheter des crédits.",
                                            emoji: {
                                                name: "🛒"
                                            },
                                            customId: "buyCredits"
                                        },
                                    ]
                                }
                            ],
                        })
                    }

                    if (user!.id === 0) {
                        const modal = new NewAccountModal(product.model as string)
                        SendModal(client, i, modal);
                        modal.handleSubmit(client, i);

                        setTimeout(() => {
                            updatePanel(client, interaction.message)
                            collector.stop()
                        }, 1000)
                    } else {
                        await i.deferUpdate()

                        const template = require("../serverTemplates/" + product.model + ".js")
                        if (!template) return interaction.editReply({
                            content: `**${client.emotes.no} ➜ Le fichier de modèle est introuvable.**`,
                            embeds: [],
                            components: []
                        })
                        let servers;
                        let pufferUser = await getUser(client, user!.id)
                        if (pufferUser) servers = await getUserServers(client, pufferUser.username)

                        let count = servers && servers.servers && servers.servers.length > 0 ? servers.servers.length + 1 : 1

                        template.default.name = `[${product.model}] Serveur de ${interaction.user.username}${interaction.user.discriminator} #${count}`
                        template.default.id = generator.generate({
                            length: 6,
                            numbers: true
                        })
                        template.default.users.push(String(interaction.user.username + interaction.user.discriminator))

                        const serverData = await newServer(client, template.default)

                        user!.credits = user!.credits! - product.price!
                        product.stock = product.stock! - 1
                        await product.save()
                        user!.save()

                        const date = new Date()

                        new serversDB({
                            id: serverData.id,
                            owner: user!.id,
                            productId: product.id,
                            expirationDate: date.setMonth(date.getMonth() + 1)
                        }).save()

                        const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)

                        if (!webhook) new Error("Webhook introuvable.")

                        if (webhook) await webhook.send({
                            embeds: [
                                {
                                    title: "Nouvel achat !",
                                    color: client.color,
                                    description: `**ID Discord :** \`${interaction.user.id}\`\n**ID PufferPanel :** \`${user!.id}\`\n**Produit : **\`${product.title}\`\n**Modèle :** \`${product.model}\`\n**ID du serveur :** \`${serverData.id}\`\n**Crédits restants :** \`${user!.credits}\``,
                                    url: client.config.puffer.basePanelUrl + "/server/" + serverData.id,
                                }
                            ]
                        })

                        if (product.stock === 0 && webhook) await webhook.send({
                            embeds: [
                                {
                                    title: "Hors stock !",
                                    color: client.color,
                                    description: `\n**Produit : **\`${product.title}\`\n**ID :** \`${product.id}\``,
                                    url: "https://github.com/Nonolanlan1007"
                                }
                            ]
                        })

                        let member = await client.guilds.cache.get(client.config.guildId)!.members.fetch(interaction.user.id).catch(() => null)

                        if (member) member!.roles.add(client.config.clientRoleId).catch(() => {})

                        await interaction.editReply({
                            content: `**${client.emotes.yes} ➜ Votre serveur sera créé dans les secondes à venir.**`,
                            components: [
                                {
                                    type: 1,
                                    components: [
                                        {
                                            type: 2,
                                            style: 5,
                                            label: "Aller au PufferPanel.",
                                            emoji: {
                                                name: "🌐"
                                            },
                                            url: client.config.puffer.basePanelUrl + "/auth/login"
                                        }
                                    ]
                                }
                            ],
                            embeds: []
                        })

                        setTimeout(() => {
                            updatePanel(client, interaction.message)
                            collector.stop()
                        }, 100)
                    }
                })
            })
        }
        if (interaction.customId === "viewMyProducts") {
            const user = await users.findOne({ discordId: interaction.user.id })
            if (!user || user.id === 0) return interaction.reply({
                content: `**${client.emotes.no} ➜ Vous n'avez pas de compte PufferPanel.**`,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 1,
                                label: "Acheter des crédits.",
                                emoji: {
                                    name: "🛒"
                                },
                                customId: "buyCredits"
                            },
                        ]
                    }
                ],
                ephemeral: true
            })

            let pufferUser = await getUser(client, user.id)

            if (!pufferUser) return interaction.reply({
                content: `**${client.emotes.no} ➜ Vous n'avez pas de compte PufferPanel.**`,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 1,
                                label: "Acheter des crédits.",
                                emoji: {
                                    name: "🛒"
                                },
                                customId: "buyCredits"
                            },
                        ]
                    }
                ],
                ephemeral: true
            })

            const servers = await getUserServers(client, pufferUser.username)

            if (servers.servers.length === 0) return interaction.reply({
                content: `**${client.emotes.no} ➜ Vous n'avez aucun serveur.**`,
                ephemeral: true
            })

            let FIELDS = [] as any[]

            servers.servers.forEach(async (server: any) => {
                FIELDS.push({
                    name: `${await getServerStatus(client, server.id) ? "🟢" : "🔴"} ${server.name}`,
                    value: `**ID :** ${server.id}`
                })
            })

            setTimeout(async () => {
                interaction.reply({
                    embeds: [
                        {
                            title: "Vos serveurs",
                            color: client.color,
                            description: "Voici la liste de vos serveurs.",
                            fields: FIELDS
                        }
                    ],
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 3,
                                    customId: "seeServersSelect",
                                    placeholder: "Plus d'options",
                                    options: servers.servers.map((server: any) => ({ label: server.name, value: String(server.id) }))
                                }
                            ]
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    style: 1,
                                    label: "Acheter des crédits.",
                                    emoji: {
                                        name: "🛒"
                                    },
                                    customId: "buyCredits"
                                },
                            ]
                        }
                    ],
                    ephemeral: true,
                    fetchReply: true
                }).then(async (message: Message) => {
                    const filter = (i: SelectMenuInteraction) => i.user.id === interaction.user.id;
                    // @ts-ignore
                    const collector = await message.createMessageComponentCollector({filter, time: 60000 * 2})

                    let serverDB: any,
                        server: any,
                        status: boolean,
                        Console: string | undefined,
                        stats,
                        stopUpdate = false,
                        pauseUpdate = false

                    // @ts-ignore
                    collector.on("collect", async (i: SelectMenuInteraction | ButtonInteraction) => {
                        if (i.isStringSelectMenu() && i.customId === "seeServersSelect") {
                            await i.deferUpdate()
                            async function updateMsg () {
                                // @ts-ignore
                                serverDB = await serversDB.findOne({ id: i.values[0] })
                                // @ts-ignore
                                server = await getServer(client, i.values[0])
                                // @ts-ignore
                                status = await getServerStatus(client, i.values[0])
                                // @ts-ignore
                                Console = await getServerConsole(client, i.values[0])
                                // @ts-ignore
                                stats = status ? await getServerStats(client, i.values[0]) : null

                                // @ts-ignore
                                await interaction.editReply({
                                    embeds: [
                                        {
                                            title: `${status ? "🟢" : "🔴"} ${server.server.name}`,
                                            description: `Cette interface est mise à jour toutes les 10 secondes. Attention, elle expire automatiquement au bout de 2 minutes !\n\`\`\`js\n${Console ? Console!.slice((Console.length - 3950), Console.length) : "Serveur arrêté."}\`\`\``,
                                            color: client.color,
                                            footer: {
                                                text: "Pour éviter de potentiels bugs, il est recommendé de démarrer/arrêter votre service depuis cette interface."
                                            },
                                            fields: [
                                                {
                                                    name: "Expire le :",
                                                    value: moment(serverDB.expirationDate).format("Do MMMM YYYY"),
                                                },
                                                {
                                                    name: "CPU :",
                                                    value: `\`${stats ? stats.cpu.toFixed(2) : "0"}%\``,
                                                    inline: true
                                                },
                                                {
                                                    name: "RAM :",
                                                    value: `\`${stats ? Math.trunc((stats.memory) / 1000 / 1000) : "0"}MB\``,
                                                    inline: true
                                                }
                                            ]
                                        }
                                    ],
                                    components: [
                                        {
                                            type: 1,
                                            components: [
                                                {
                                                    type: 2,
                                                    style: 3,
                                                    label: status ? "Redémarrer" : "Démarrer",
                                                    emoji: {
                                                        name: status ? "🔄" : "▶️"
                                                    },
                                                    customId: status ? "restartServer" : "startServer"
                                                },
                                                {
                                                    type: 2,
                                                    style: 4,
                                                    label: "Arrêter",
                                                    emoji: {
                                                        name: "⏹️"
                                                    },
                                                    customId: "stopServer",
                                                    disabled: !status
                                                },
                                                {
                                                    type: 2,
                                                    style: 2,
                                                    label: "Installer les modules",
                                                    emoji: {
                                                        name: "📦"
                                                    },
                                                    customId: "installModules",
                                                    disabled: status
                                                },
                                                {
                                                    type: 2,
                                                    style: 1,
                                                    label: "Gérer",
                                                    emoji: {
                                                        name: "🔧"
                                                    },
                                                    customId: "manageServer"
                                                },
                                                {
                                                    type: 2,
                                                    style: 5,
                                                    label: "Voir en ligne",
                                                    emoji: {
                                                        name: "🌐"
                                                    },
                                                    // @ts-ignore
                                                    url: client.config.puffer.basePanelUrl + "/server/" + i.values[0]
                                                }
                                            ]
                                        }
                                    ]
                                })
                            }
                            await updateMsg()
                            let interaval = setInterval(async () => {
                                if (!stopUpdate && !pauseUpdate) await updateMsg()
                                if (stopUpdate) {
                                    interaction.editReply({
                                        content: "Interface expirée...",
                                        components: [],
                                        embeds: []
                                    })
                                    clearInterval(interaval)
                                }
                                if (pauseUpdate) clearInterval(interaval)
                            }, 10000)
                        }
                        if (i.isButton()) {
                            if (i.customId === "restartServer") {
                                const kill = await killServer(client, server!.server!.id!)

                                if (kill) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors de l'arrêt du serveur.**`,
                                    ephemeral: true
                                })

                                const start = await startServer(client, server!.server!.id!)

                                if (start) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors du démarrage du serveur.**`,
                                    ephemeral: true
                                })

                                i.reply({
                                    content: `**${client.emotes.yes} ➜ Le serveur a bien été redémarré.**`,
                                    ephemeral: true
                                })
                            }

                            if (i.customId === "startServer") {
                                // @ts-ignore
                                if (status === true) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors du démarrage du serveur.**`,
                                    ephemeral: true
                                })


                                const start = await startServer(client, server!.server!.id!)

                                if (start) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors du démarrage du serveur.**`,
                                    ephemeral: true
                                })

                                i.reply({
                                    content: `**${client.emotes.yes} ➜ Le serveur a bien été démarré.**`,
                                    ephemeral: true
                                })
                            }

                            if (i.customId === "stopServer") {
                                if (!status) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors de l'arrêt du serveur.**`,
                                    ephemeral: true
                                })

                                const kill = await killServer(client, server!.server!.id!)

                                if (kill) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors de l'arrêt du serveur.**`,
                                    ephemeral: true
                                })

                                i.reply({
                                    content: `**${client.emotes.yes} ➜ Le serveur a bien été arrêté.**`,
                                    ephemeral: true
                                })
                            }

                            if (i.customId === "installModules") {
                                if (status) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors de l'installation des modules.**`,
                                    ephemeral: true
                                })

                                const install = await installServer(client, server!.server!.id!)

                                // @ts-ignore
                                if (!install) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors de l'installation des modules.**`,
                                    ephemeral: true
                                })

                                i.reply({
                                    content: `**${client.emotes.loading} ➜ Les modules sont en cours d'installation...**`,
                                    ephemeral: true
                                })
                            }

                            if (i.customId === "manageServer") {
                                pauseUpdate = true;

                                await i.deferUpdate()

                                const product = await products.findOne({ id: serverDB.productId })

                                if (!product) return console.log("Product not found");

                                interaction.editReply({
                                    embeds: [
                                        {
                                            title: "Gestion du serveur",
                                            fields: [
                                                {
                                                    name: "Expire le :",
                                                    value: moment(serverDB.expirationDate).format("Do MMMM YYYY"),
                                                    inline: true
                                                },
                                                {
                                                    name: "Coût de renouvellement :",
                                                    value: `${product.price} ${client.emotes.credit}`,
                                                    inline: true
                                                },
                                                {
                                                    name: "Produit :",
                                                    value: `\`[${product.model}] ${product.title} (${product.id})\``,
                                                }
                                            ],
                                            footer: {
                                                text: "Le coût de renouvellement indiqué ci-dessus est le prix actuel de votre service. En cas de changement, vous serez averti par message privé."
                                            }
                                        }
                                    ],
                                    components: [
                                        {
                                            type: 1,
                                            components: [
                                                {
                                                    type: 2,
                                                    style: 1,
                                                    label: "Modifier mon service",
                                                    emoji: {
                                                        name: "🛠️"
                                                    },
                                                    customId: "editServer"
                                                },
                                                {
                                                    type: 2,
                                                    style: 2,
                                                    label: serverDB && serverDB.cancelled ? "Annuler la résiliation" : "Résilier",
                                                    emoji: {
                                                        name: serverDB && serverDB.cancelled ? "🔙" : "🚫"
                                                    },
                                                    customId: serverDB && serverDB.cancelled ? "cancelCancelServer" : "cancelServer"
                                                },
                                                {
                                                    type: 2,
                                                    style: 1,
                                                    label: "Acheter des crédits.",
                                                    emoji: {
                                                        name: "🛒"
                                                    },
                                                    customId: "buyCredits"
                                                },
                                            ]
                                        }
                                    ]
                                })
                            }

                            if (i.customId === "cancelServer") {
                                if (serverDB && serverDB.cancelled) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors de la résiliation du serveur.**`,
                                    ephemeral: true
                                })

                                serverDB!.cancelled = true;

                                await serverDB!.save()

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
                                            title: "Résiliation !",
                                            color: client.color,
                                            description: `**ID Discord :** \`${interaction.user.id}\`\n**ID PufferPanel :** \`${pufferUser.id}\`\n**ID Serveur :** \`${server!.server!.id!}\`\n**Nom du serveur :** \`${server!.server!.name!}\`\n**Date de résiliation :** \`${moment(serverDB.expirationDate).format("Do MMMM YYYY")}\``,
                                            url: client.config.puffer.basePanelUrl + "/server/" + server.server.id
                                        }
                                    ]
                                })

                                await i.reply({
                                    content: `**${client.emotes.yes} ➜ Votre service sera automatiquement supprimé lorsqu'il arrivera à expiration.**`,
                                    ephemeral: true
                                })

                                const product = await products.findOne({ id: serverDB.productId })

                                if (!product) return console.log("Product not found");

                                interaction.editReply({
                                    embeds: [
                                        {
                                            title: "Gestion du serveur",
                                            fields: [
                                                {
                                                    name: "Expire le :",
                                                    value: moment(serverDB.expirationDate).format("Do MMMM YYYY"),
                                                    inline: true
                                                },
                                                {
                                                    name: "Coût de renouvellement :",
                                                    value: `${product.price} ${client.emotes.credit}`,
                                                    inline: true
                                                },
                                                {
                                                    name: "Produit :",
                                                    value: `\`[${product.model}] ${product.title} (${product.id})\``,
                                                }
                                            ],
                                            footer: {
                                                text: "Le coût de renouvellement indiqué ci-dessus est le prix actuel de votre service. En cas de changement, vous serez averti par message privé."
                                            }
                                        }
                                    ],
                                    components: [
                                        {
                                            type: 1,
                                            components: [
                                                {
                                                    type: 2,
                                                    style: 1,
                                                    label: "Modifier mon service",
                                                    emoji: {
                                                        name: "🛠️"
                                                    },
                                                    customId: "editServer"
                                                },
                                                {
                                                    type: 2,
                                                    style: 2,
                                                    label: serverDB && serverDB.cancelled ? "Annuler la résiliation" : "Résilier",
                                                    emoji: {
                                                        name: serverDB && serverDB.cancelled ? "🔙" : "🚫"
                                                    },
                                                    customId: serverDB && serverDB.cancelled ? "cancelCancelServer" : "cancelServer"
                                                },
                                                {
                                                    type: 2,
                                                    style: 1,
                                                    label: "Acheter des crédits.",
                                                    emoji: {
                                                        name: "🛒"
                                                    },
                                                    customId: "buyCredits"
                                                },
                                            ]
                                        }
                                    ]
                                })
                            }

                            if (i.customId === "cancelCancelServer") {
                                if (serverDB && !serverDB.cancelled) return i.reply({
                                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors de l'annulation de la résiliation du serveur.**`,
                                    ephemeral: true
                                })

                                serverDB!.cancelled = false;

                                await serverDB!.save()

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
                                            title: "Annulation de la résiliation !",
                                            color: client.color,
                                            description: `**ID Discord :** \`${interaction.user.id}\`\n**ID PufferPanel :** \`${pufferUser.id}\`\n**ID Serveur :** \`${server!.server!.id!}\`\n**Nom du serveur :** \`${server!.server!.name!}\`\n**Date de résiliation :** \`${moment(serverDB.expirationDate).format("Do MMMM YYYY")}\``,
                                            url: client.config.puffer.basePanelUrl + "/server/" + server.server.id
                                        }
                                    ]
                                })

                                await i.reply({
                                    content: `**${client.emotes.yes} ➜ La résiliation de votre service a bien été annulée.**`,
                                    ephemeral: true
                                })

                                const product = await products.findOne({ id: serverDB.productId })

                                if (!product) return console.log("Product not found");

                                interaction.editReply({
                                    embeds: [
                                        {
                                            title: "Gestion du serveur",
                                            fields: [
                                                {
                                                    name: "Expire le :",
                                                    value: moment(serverDB.expirationDate).format("Do MMMM YYYY"),
                                                    inline: true
                                                },
                                                {
                                                    name: "Coût de renouvellement :",
                                                    value: `${product.price} ${client.emotes.credit}`,
                                                    inline: true
                                                },
                                                {
                                                    name: "Produit :",
                                                    value: `\`[${product.model}] ${product.title} (${product.id})\``,
                                                }
                                            ],
                                            footer: {
                                                text: "Le coût de renouvellement indiqué ci-dessus est le prix actuel de votre service. En cas de changement, vous serez averti par message privé."
                                            }
                                        }
                                    ],
                                    components: [
                                        {
                                            type: 1,
                                            components: [
                                                {
                                                    type: 2,
                                                    style: 1,
                                                    label: "Modifier mon service",
                                                    emoji: {
                                                        name: "🛠️"
                                                    },
                                                    customId: "editServer"
                                                },
                                                {
                                                    type: 2,
                                                    style: 2,
                                                    label: serverDB && serverDB.cancelled ? "Annuler la résiliation" : "Résilier",
                                                    emoji: {
                                                        name: serverDB && serverDB.cancelled ? "🔙" : "🚫"
                                                    },
                                                    customId: serverDB && serverDB.cancelled ? "cancelCancelServer" : "cancelServer"
                                                },
                                                {
                                                    type: 2,
                                                    style: 1,
                                                    label: "Acheter des crédits.",
                                                    emoji: {
                                                        name: "🛒"
                                                    },
                                                    customId: "buyCredits"
                                                },
                                            ]
                                        }
                                    ]
                                })
                            }

                            if (i.customId === "editServer") {
                                const product = await products.findOne({ id: serverDB!.productId })

                                if (!product) return console.log("Product not found");

                                let productss = await products.find({ price: product.price })

                                productss = productss.filter(p => p.id !== product.id)

                                if (!productss || productss.length === 0) return i.reply({
                                    content: `**${client.emotes.no} ➜ Aucun service n'est disponible pour le même prix que le votre.**`,
                                    ephemeral: true
                                })

                                productss = productss.filter(p => p.stock! > 0)

                                if (!productss || productss.length === 0) return i.reply({
                                    content: `**${client.emotes.no} ➜ Aucun service n'est actuellement en stock.**`,
                                    ephemeral: true
                                })

                                await i.deferUpdate()

                                interaction.editReply({
                                    embeds: [
                                        {
                                            title: "Modification du serveur",
                                            color: client.color,
                                            description: "Veuillez sélectionner un nouveau service pour votre serveur.",
                                            footer: {
                                                text: "La modification de votre service entraînera la perte des données actuelles."
                                            }
                                        }
                                    ],
                                    components: [
                                        {
                                            type: 1,
                                            components: [
                                                {
                                                    type: 3,
                                                    customId: "editServerSelect",
                                                    options: productss.map((p: any) => {
                                                        return {
                                                            label: p.title,
                                                            value: String(p.id),
                                                        }
                                                    }),
                                                    placeholder: "Sélectionnez un service",
                                                }
                                            ]
                                        }
                                    ]
                                }).then(async () => {
                                    const filter = (i: StringSelectMenuInteraction) => i.user.id === interaction.user.id;

                                    // @ts-ignore
                                    const collector2 = await i.message.createMessageComponentCollector(filter);
                                    // @ts-ignore
                                    collector2.on("collect", async (i: StringSelectMenuInteraction) => {
                                        if (i.customId === "editServerSelect") {
                                            // @ts-ignore
                                            const product = await products.findOne({ id: i.values[0] })

                                            if (!product) return console.log("Product not found");

                                            const serverDb = await serversDB.findOne({ id: server!.server!.id! })
                                            serverDb!.productId = product.id;

                                            const deleted = await deleteServer(client, server!.server!.id!)

                                            if (!deleted) return i.reply({
                                                content: `**${client.emotes.no} ➜ Une erreur interne est survenue lors de la suppression du serveur.**`,
                                                ephemeral: true
                                            })


                                            const template = require("../serverTemplates/" + product.model + ".js")
                                            if (!template) return i.reply({
                                                content: `**${client.emotes.no} ➜ Le fichier de modèle est introuvable.**`,
                                                ephemeral: true
                                            })

                                            template.default.name = `[${product.model}]${server.server.name.split("]")[1]}`
                                            template.default.id = generator.generate({
                                                length: 6,
                                                numbers: true
                                            })
                                            template.default.users.push(String(i.user.username + i.user.discriminator))

                                            let serveur = await newServer(client, template.default)

                                            serverDb!.id = serveur.id

                                            await serverDb!.save()
                                            // @ts-ignore
                                            await interaction.editReply({
                                                embeds: [],
                                                components: [],
                                                content: `**${client.emotes.yes} ➜ Votre serveur a été modifié avec succès. Il devrait être disponible d'ici quelques secondes.**`
                                            })
                                        }
                                    })
                                })
                            }
                        }
                    })
                    collector.on("end", async (collected, reason) => {
                        stopUpdate = true
                    })
                })
            }, 300)
        }
        if (interaction.customId === "viewMyAccount") {
            const userDb = await users.findOne({ discordId: interaction.user.id })

            if (!userDb) return interaction.reply({
                content: `**${client.emotes.no} ➜ Vous n'avez pas de compte PufferPanel.**`,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 1,
                                label: "Acheter des crédits.",
                                emoji: {
                                    name: "🛒"
                                },
                                customId: "buyCredits"
                            },
                        ]
                    }
                ],
                ephemeral: true
            })

            let pufferUser;
            let servers;
            if (userDb!.id !== 0) pufferUser = await getUser(client, userDb!.id)
            if (pufferUser) servers = await getUserServers(client, pufferUser.username)

            await interaction.reply({
                embeds: [
                    {
                        title: "Mon compte",
                        color: client.color,
                        description: `**ID Discord :** \`${interaction.user.id}\`\n**Crédits :** ${userDb.credits} ${client.emotes.credit}\n${pufferUser ? `**ID PufferPanel :** \`${pufferUser.id}\`\n**Nom d'utilisateur :** \`${pufferUser.username}\`\n**Adresse e-mail :** \`${pufferUser.email}\`${servers && servers.servers && servers.servers.length > 0 ? `\n**Nombre de services actifs :** \`${servers.servers.length}\`` : ""}` : ""}`,
                        footer: {
                            text: "Pour éviter tout problème, nous vous demandons de ne pas modifier votre nom d'utilisateur PufferPanel."
                        }
                    }
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 4,
                                label: "Mot de passe oublié",
                                emoji: {
                                    name: "🔑"
                                },
                                customId: "passwordLost",
                                disabled: !pufferUser
                            },
                            {
                                type: 2,
                                style: 1,
                                label: "Acheter des crédits.",
                                emoji: {
                                    name: "🛒"
                                },
                                customId: "buyCredits"
                            },
                        ]
                    }
                ],
                ephemeral: true
            })
        }
        if (interaction.customId === "passwordLost") {
            const userDb = await users.findOne({ discordId: interaction.user.id });

            if (!userDb || !userDb.id) return interaction.reply({
                content: `**${client.emotes.no} ➜ Vous n'avez pas de compte PufferPanel.**`,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 1,
                                label: "Acheter des crédits.",
                                emoji: {
                                    name: "🛒"
                                },
                                customId: "buyCredits"
                            },
                        ]
                    }
                ],
                ephemeral: true
            })

            const pufferUser = await getUser(client, userDb.id)

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
                        title: "Mot de passe oublié !",
                        color: client.color,
                        description: `**ID Discord :** \`${interaction.user.id}\`\n**ID PufferPanel :** \`${pufferUser.id}\`\n**Nom d'utilisateur :** \`${pufferUser.username}\`\n**Adresse e-mail :** \`${pufferUser.email}\``,
                        url: client.config.puffer.basePanelUrl + "/user/" + pufferUser.id
                    }
                ]
            })

            interaction.reply({
                content: `**${client.emotes.yes} ➜ Votre demande a bien été envoyée.**`,
                components: [],
                embeds: [],
                ephemeral: true
            })
        }
        if (interaction.customId === "buyCredits") {
            interaction.reply({
                embeds: [
                    {
                        title: "Acheter des crédits",
                        color: client.color,
                        description: client.config.howToBuyCredits !== "" ? client.config.howToBuyCredits : "Vous n'allez pas le croire, mais je ne sais pas comment vous pouvez acheter des crédits ! Contactez un administrateur peut-être qu'il saura."
                    }
                ],
                ephemeral: true
            })
        }
    }
}
