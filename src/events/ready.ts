import Class from '..';
import {blue, red, yellow} from 'colors';
import {deleteServer, getTempToken, killServer} from "../utils/PufferAPI";
import mongoose from "../functions/mongoose";
import bot from "../models/bot";
import ms from "ms";
import serversDB from "../models/servers";
import users from '../models/users';
import products from "../models/products";
import moment from "moment";

export = async (client: Class) => {

    await getTempToken(client, { grant_type: 'client_credentials', client_id: client.config.puffer.clientId, client_secret: client.config.puffer.token })
    mongoose.init()

    console.log(blue(`[BOT] Connecté en tant que ${client.user?.tag}`));
    await client.postSlashs(client.slashs);

    const activities = [`Version ${client.version}`, 'By Nolhan#2508'];
    await client.user!.setActivity("Démarrage en cours...", { type: 1, url: "https://twitch.tv/discord" });

    console.log(yellow("PufferBot n'est pas affilié avec PufferPanel. PufferPanel est un projet open-source, vous pouvez le retrouver ici : https://github.com/PufferPanel/PufferPanel"))

    const data = await bot.findOne()

    if (!data) await new bot({msgID: "", channelID: ""}).save()

    setInterval(async () => {
      await client.user!.setActivity(activities[Math.floor(Math.random() * activities.length)], { type: 1, url: "https://twitch.tv/discord" });
    }, 12000);

    setInterval(async () => {
        const servers = await serversDB.find()

        if (servers.length === 0) return;

        servers.forEach(async (server: any) => {
            if (server.expirationDate < Date.now()) {
                const user = await users.findOne({id: server.owner})

                if (!user) return;

                const product = await products.findOne({id: server.productId})

                if (!product) return;

                if (!server.cancelled && user.credits! < product.price!) {
                    await killServer(client, server.id)

                    const discordUser = await client.users.fetch(user.discordId!).catch(() => null)

                    let fields = []

                    if (discordUser) discordUser.send({
                        embeds: [
                            {
                                title: "Service expiré",
                                description: `Votre service **${product.title}** a expiré et vous n'avez pas assez de crédits pour le renouveler. Il a donc été arrêté.`,
                                color: client.color,
                                footer: {
                                    text: `Vous avez 72h pour renouveler votre service avant qu'il ne soit supprimé définitivement.`
                                },
                                url: "https://github.com/Nonolanlan1007"
                            }
                        ],
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
                        ]
                    }).catch(() => fields.push({
                        name: "⚠️ Avertissement",
                        value: `Le propriétaire du service n'a pas pu être averti par message privé.`
                    }))
                    if (!discordUser) fields.push({
                        name: "⚠️ Avertissement",
                        value: `Le propriétaire du service n'a pas pu être averti par message privé.`
                    })

                    const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)

                    if (!webhook) new Error("Webhook introuvable.")

                    if (webhook) await webhook.send({
                        embeds: [
                            {
                                title: "Service expiré !",
                                color: client.color,
                                description: `**ID Discord :** \`${user.discordId!}\`\n**ID PufferPanel :** \`${user!.id}\`\n**Produit : **\`${product.title}\`\n**Modèle :** \`${product.model}\`\n**ID du serveur :** \`${server.id}\``,
                                url: "https://github.com/Nonolanlan1007",
                                fields: fields,
                                footer: {
                                    text: `L'utilisateur n'ayant plus de crédits, il a 72 heures pour renouveler son service avant qu'il ne soit supprimé définitivement.`
                                }
                            }
                        ]
                    })
                }
                if (!server.cancelled && user.credits! >= product.price!) {
                    user.credits = user.credits! - product.price!

                    const discordUser = await client.users.fetch(user.discordId!).catch(() => null)

                    let fields = []

                    const date = new Date()

                    server.expirationDate = date.setMonth(date.getMonth() + 1)

                    if (discordUser) discordUser.send({
                        embeds: [
                            {
                                title: "Service renouvelé !",
                                color: client.color,
                                description: `**ID du serveur :** \`${server.id}\`\n**Nouvelle date d'expiration :** \`${moment(server.expirationDate).format("Do MMMM YYYY")}\`\n**Crédits restants :** ${user.credits} ${client.emotes.credit}`,
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

                    const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)

                    if (!webhook) new Error("Webhook introuvable.")

                    if (webhook) await webhook.send({
                        embeds: [
                            {
                                title: "Service renouvelé !",
                                color: client.color,
                                description: `**ID Discord :** \`${user.discordId!}\`\n**ID PufferPanel :** \`${user!.id}\`\n**Produit : **\`${product.title}\`\n**Modèle :** \`${product.model}\`\n**ID du serveur :** \`${server.id}\`\n**Nouvelle date d'expiration :** \`${moment(server.expirationDate).format("Do MMMM YYYY")}\`\n**Crédits restants :** ${user.credits} ${client.emotes.credit}`,
                                url: "https://github.com/Nonolanlan1007",
                                fields: fields
                            }
                        ]
                    })

                    server.save()
                    user.save()
                }

                if (server.cancelled) {
                    await killServer(client, server.id)
                    await deleteServer(client, server.id)
                    await serversDB.findByIdAndDelete(server._id)

                    const discordUser = await client.users.fetch(user.discordId!).catch(() => null)

                    let fields = []

                    if (discordUser) discordUser.send({
                        embeds: [
                            {
                                title: "Service résilié !",
                                description: `Votre service **${product.title}** a expiré et vient d'être supprimé suite à votre demande de résiliation.`,
                                color: client.color,
                                footer: {
                                    text: `Aucunes des données contenues sur votre serveur n'est récupérable.`
                                },
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

                    const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)

                    if (!webhook) new Error("Webhook introuvable.")

                    if (webhook) await webhook.send({
                        embeds: [
                            {
                                title: "Service résilié !",
                                color: client.color,
                                description: `**ID Discord :** \`${user.discordId!}\`\n**ID PufferPanel :** \`${user!.id}\`\n**Produit : **\`${product.title}\`\n**Modèle :** \`${product.model}\`\n**ID du serveur :** \`${server.id}\``,
                                url: "https://github.com/Nonolanlan1007",
                                fields: fields,
                                footer: {
                                    text: `Cette résiliation a été effectuée suite à une demande de l'utilisateur.`
                                }
                            }
                        ]
                    })

                    let member = await client.guilds.cache.get(client.config.guildId)!.members.fetch(user.discordId!).catch(() => null)

                    if (member && servers.filter((x: any) => x.owner === member!.user.id).length === 0) member!.roles.remove(client.config.clientRoleId).catch(() => {})
                }
            }
        })
    }, ms("1m"))
  }
