import {Message} from "discord.js";
import products from "../models/products";
import Class from "..";

export async function updatePanel (client: Class, message: Message) {
    let produits = await products.find()
    produits = produits.filter((p: any) => p.stock > 0)

    let map = produits.length > 0 ? produits.map((p: any) => `**${p.title}**\n> - Prix : ${p.price} ${client.emotes.credit}\n> - Stock restant : ${p.stock}`).join('\n\n') : `*Il n'y a actuellement au produit en vente.*${message.guild && message.guild.commands.cache.find(x => x.name === "product") ? ` *Ajoutez-en un avec la commande </product add:${message.guild.commands.cache.find(x => x.name === "product")?.id}> ou ajoutez du stock avec la commande </product stock:${message.guild.commands.cache.find(x => x.name === "product")?.id}>*` : ""}`

    await message.edit({
        content: null,
        embeds: [
            {
                title: "Panneau de gestion",
                color: client.color,
                description: map,
                footer: {
                    text: `Tous les services proposé ont un une durée de un mois et ne sont pas remboursables.`
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
                        label: "Acheter un service",
                        emoji: {
                            name: "🛒"
                        },
                        customId: "buyProduct",
                        disabled: produits.length === 0
                    },
                    {
                        type: 2,
                        style: 2,
                        label: "Mes services",
                        emoji: {
                            name: "📡"
                        },
                        customId: "viewMyProducts"
                    },
                    {
                        type: 2,
                        style: 2,
                        label: "Mon compte",
                        emoji: {
                            name: "👤"
                        },
                        customId: "viewMyAccount"
                    },
                    {
                        type: 2,
                        style: 5,
                        label: "Aller au PufferPanel",
                        emoji: {
                            name: "🌐"
                        },
                        url: client.config.puffer.basePanelUrl + "/auth/login"
                    }
                ]
            }
        ]
    })
}