import {ChatInputCommandInteraction, Message, PermissionsBitField, TextChannel} from "discord.js";
import Class from "../..";
import config from "../../config";
import Slash from "../../utils/Slash";
import products from "../../models/products";
import {updatePanel} from "../../functions/updatePanel";
import {existsSync, readFileSync} from "fs";
import bot from "../../models/bot";

class Product extends Slash {
    constructor() {
        super({
            name: "product",
            description: "Gérer les produits.",
            default_member_permissions: PermissionsBitField.Flags.Administrator,
            guild_id: config.guildId,
            options: [
                {
                    type: 1,
                    name: "add",
                    description: "Ajouter un produit.",
                    options: [
                        {
                            type: 3,
                            name: "titre",
                            description: "Le titre du produit.",
                            required: true
                        },
                        {
                            type: 3,
                            name: "modèle",
                            description: "Le modèle à utiliser pour les serveurs créés après l'achat de ce produit.",
                            required: true,
                            autocomplete: true
                        },
                        {
                            type: 10,
                            name: "prix",
                            description: "Le prix du produit.",
                            required: true,
                            min_value: 0
                        }
                    ]
                },
                {
                    type: 1,
                    name: "stock",
                    description: "Modifier les stocks de produits.",
                    options: [
                        {
                            type: 3,
                            name: "produit",
                            description: "Le produit dont vous souhaitez modifier le stock.",
                            required: true,
                            autocomplete: true
                        },
                        {
                            type: 10,
                            name: "valeur",
                            description: "Le nombre de produits que vous souhaitez mettre en stock.",
                            required: true,
                            min_value: 0
                        }
                    ]
                }
            ]
        });
    }

    async run(client: Class, interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case "add": {
                const title = interaction.options.getString("titre");
                const model = interaction.options.getString("modèle");
                const price = interaction.options.getNumber("prix");

                const db = await products.findOne({title: title});
                if (db) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Un autre produit porte déjà ce nom.**`,
                    ephemeral: true
                })

                const allProducts = await products.find();

                const id = allProducts.length + 1 || 1;

                new products({
                    id: id,
                    model: model,
                    stock: 0,
                    title: title,
                    price: price
                }).save()

                const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)

                if (!webhook) new Error("Webhook introuvable.")

                if (webhook) await webhook.send({
                    embeds: [
                        {
                            title: "Nouveau produit !",
                            color: client.color,
                            description: `**Titre :** \`${title}\`\n**Identifiant :** \`${id}\`\n**Modèle associé : **\`${model}\`\n**Prix :** ${price} ${client.emotes.credit}`,
                            url: "https://github.com/Nonolanlan1007"
                        }
                    ]
                })

                await interaction.reply({
                    content: `**${client.emotes.yes} ➜ Le produit \`${title}\` a bien été ajouté !**`,
                    ephemeral: true
                })

                const data = await bot.findOne();

                if (data && data.msgID !== "" && data.channelID !== "") {
                    const channel = client.channels.cache.get(data.channelID!) as TextChannel;
                    if (!channel) return;
                    const message = await channel.messages.fetch(data.msgID!);
                    if (!message) return;
                    setTimeout(async () => await updatePanel(client, message), 100)
                }

                break;
            }
            case "stock": {
                const product = await products.findOne({ id: Number(interaction.options.getString("produit")) });

                if (!product) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Une erreur interne est survenue..**`,
                    ephemeral: true
                })

                let value = interaction.options.getNumber("valeur") as number

                if (value === product.stock) return interaction.reply({
                    content: `**${client.emotes.no} ➜ Le stock de ce produit est déjà de \`${value}\`.**`,
                    ephemeral: true
                })

                let oldStock = product.stock as number;

                product.stock = value;

                await product.save();

                let title = oldStock < value ? "Stock augmenté !" : "Stock diminué !";

                if (oldStock < value && oldStock === 0) title = "Remise en stock !";

                if (oldStock > value && value === 0) title = "Retrait de la vente !";

                const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)

                if (!webhook) new Error("Webhook introuvable.")

                if (webhook) await webhook.send({
                    embeds: [
                        {
                            title: title,
                            color: client.color,
                            description: `**Administrateur :** \`${interaction.user.tag}\`\n**Produit : **\`${product.title}\`\n**ID :** \`${product.id}\`\n**Nouveau stock :** \`${value}\``,
                            url: "https://github.com/Nonolanlan1007"
                        }
                    ]
                })

                await interaction.reply({
                    content: `**${client.emotes.yes} ➜ Le stock du produit \`${product.title}\` a bien été mis à jour !**`,
                    ephemeral: true
                })

                const data = await bot.findOne();

                if (data && data.msgID !== "" && data.channelID !== "") {
                    const channel = client.channels.cache.get(data.channelID!) as TextChannel;
                    if (!channel) return;
                    const message = await channel.messages.fetch(data.msgID!);
                    if (!message) return;
                    setTimeout(async () => await updatePanel(client, message), 1000)
                }
            }
        }
    }
}

export = new Product;