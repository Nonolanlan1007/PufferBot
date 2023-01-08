import {ModalSubmitInteraction, SelectMenuInteraction, TextChannel} from "discord.js";
import Class from "..";
import Modal from "../utils/Modal";
import TextInput from "../utils/TextInput";
import users from "../models/users";
import {getUserServers, newServer, newUser} from "../utils/PufferAPI";
import generator from "generate-password";
import checkMail from "../functions/checkMail";
import products from "../models/products";
import serversDB from "../models/servers";
import ms from "ms";
import moment from "moment";
import bot from "../models/bot";
import {updatePanel} from "../functions/updatePanel";

export default class NewAccountModal extends Modal {
    model: string
    constructor(model: string) {
        super({
            title: "Nouveau compte",
            customId: "newaccountmodal",
            components: [
                {
                    type: 1,
                    components: [
                        new TextInput({
                            customId: "mail",
                            placeholder: "jeanpatrick@gmail.com",
                            required: true,
                            label: "Adresse mail :",
                            style: 1
                        })
                    ]
                }
            ]
        });
        this.model = model
    }

    async handleSubmit(client: Class, interaction: SelectMenuInteraction) {
        await interaction.awaitModalSubmit({
            time: 120000,
            filter: (modal: ModalSubmitInteraction) => modal.customId === "newaccountmodal"
        }).then(async (modal: ModalSubmitInteraction) => {
            let mail = modal.fields.getTextInputValue("mail");

            if (!checkMail(mail)) return modal.reply({
                content: `**${client.emotes.no} ➜ L'adresse mail que vous avez entrée n'est pas valide.**`,
                ephemeral: true
            })

            const user = await users.findOne({discordId: interaction.user.id})

            let password = generator.generate({
                length: 10,
                numbers: true
            })

            const userData = await newUser(client, { email: mail, id: 0, password: password, username: interaction.user.username + interaction.user.discriminator, newPassword: password }).catch((err: any) => console.log(err))

            if (userData === undefined) return modal.reply({
                content: `**${client.emotes.no} ➜ Cette adresse mail est peut-être déjà utilisée.**`,
                ephemeral: true
            })

            const template = require("../serverTemplates/" + this.model + ".js")
            if (!template) return modal.reply({
                content: `**${client.emotes.no} ➜ Le fichier de modèle est introuvable.**`,
                ephemeral: true
            })

            template.default.name = `[${this.model}] Serveur de ${interaction.user.username}${interaction.user.discriminator} #1`
            template.default.id = generator.generate({
                length: 6,
                numbers: true
            })
            template.default.users.push(String(interaction.user.username + interaction.user.discriminator))

            const serverData = await newServer(client, template.default)

            const product = await products.findOne({ model: this.model })
            if (!product) return;

            user!.credits = user!.credits! - product.price!
            product.stock = product.stock! - 1
            await product.save()
            user!.id = userData.id
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
            if (webhook) await webhook.send({
                embeds: [
                    {
                        title: "Nouveau compte !",
                        color: client.color,
                        description: `**ID Discord :** \`${interaction.user.id}\`\n**ID PufferPanel :** \`${user!.id}\`\n**Crédits :** \`${user!.credits}\`\n**Mot de passe temporaire :** \`${password}\``,
                        url: client.config.puffer.basePanelUrl + "/user/" + user!.id,
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

            const botData = await bot.findOne()

            if (botData) {
                const channel = client.channels.cache.get(botData.channelID as string) as TextChannel
                if (!channel) return;
                const message = await channel.messages!.fetch(botData.msgID as string).catch(() => undefined)
                if (!message) return;
                await updatePanel(client, message)
            }

            await modal.reply({
                content: `**${client.emotes.yes} ➜ Votre compte a bien été créé. Votre serveur sera créé dans les secondes à venir.**\nMot de passe temporaire __à changer immédiatement__ : \`${password}\``,
                ephemeral: true,
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
                ]
            })
        })
    }
}