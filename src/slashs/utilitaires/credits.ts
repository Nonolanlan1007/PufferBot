import {ChatInputCommandInteraction, CommandInteraction, PermissionsBitField, User} from "discord.js";
import Class from "../..";
import config from "../../config";
import Slash from "../../utils/Slash";
import users from "../../models/users";

class Credits extends Slash {
    constructor() {
        super({
            name: "credits",
            description: "Gérer les crédits.",
            default_member_permissions: PermissionsBitField.Flags.Administrator,
            guild_id: config.guildId,
            options: [
                {
                    name: "see",
                    description: "Voir les crédits d'un membre.",
                    type: 1,
                    options: [
                        {
                            name: "membre",
                            description: "Le membre dont vous souhaitez voir les crédits.",
                            type: 6,
                            required: true
                        }
                    ]
                },
                {
                    name: "set",
                    description: "Définir les crédits d'un membre.",
                    type: 1,
                    options: [
                        {
                            name: "membre",
                            description: "Le membre dont vous souhaitez définir les crédits.",
                            type: 6,
                            required: true
                        },
                        {
                            name: "nombre",
                            description: "Le nombre de crédits que vous souhaitez définir.",
                            type: 10,
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
            case "see": {
                const member = interaction.options.getUser("membre") as User;
                const db = await users.findOne({ discordId: member.id });

                if (!db || db.credits === 0) {
                    return interaction.reply({
                        content: `**${client.emotes.no} ➜ Ce membre n'a pas de crédits.**`,
                        ephemeral: true
                    });
                }

                await interaction.reply({
                    content: `**${client.emotes.yes} ➜ Ce membre a ${db.credits} ${client.emotes.credit}.**`,
			  ephemeral: true
                })
                break
            }
            case "set": {
                const member = interaction.options.getUser("membre") as User;
                const credits = interaction.options.getNumber("nombre") as number;
                const db = await users.findOne({ discordId: member.id });

                if (!db) {
                    new users({
                        discordId: member.id,
                        credits: credits,
                        id: 0
                    }).save()
                }

                const oldCredits = db && db.credits ? db.credits : 0;

                if (db) db.credits = credits;
                if (db) await db!.save();

                let title = oldCredits < credits ? "Ajout de crédits !" : "Retrait de crédits !";

                if (oldCredits > credits && credits === 0) title = "Réinitialisation des crédits !";

                const webhook = await client.fetchWebhook(client.config.webhook.id, client.config.webhook.token)

                if (!webhook) new Error("Webhook introuvable.")

                if (webhook) await webhook.send({
                    embeds: [
                        {
                            title: title,
                            color: client.color,
                            description: `**Administrateur :** \`${interaction.user.tag}\`\n**ID Discord :** \`${member.id}\`\n**Ancienne valeur :** ${oldCredits} ${client.emotes.credit}\n**Nouvelle valeur :** ${credits} ${client.emotes.credit}`,
                            url: "https://github.com/Nonolanlan1007"
                        }
                    ]
                })

                await interaction.reply({
                    content: `**${client.emotes.yes} ➜ Vous avez défini les crédits de ce membre à ${credits} ${client.emotes.credit}.**`,
                    ephemeral: true
                })
                break
            }
        }
    }
}

export = new Credits;