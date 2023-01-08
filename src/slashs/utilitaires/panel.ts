import {ChatInputCommandInteraction, Message, PermissionsBitField} from "discord.js";
import Class from "../..";
import config from "../../config";
import Slash from "../../utils/Slash";
import {updatePanel} from "../../functions/updatePanel";
import bot from "../../models/bot";

class Panel extends Slash {
    constructor() {
        super({
            name: "panel",
            description: "Afficher le panneau de gestion.",
            default_member_permissions: PermissionsBitField.Flags.Administrator,
            guild_id: config.guildId
        });
    }

    async run(client: Class, interaction: ChatInputCommandInteraction) {
        interaction.channel?.send("Initialisation du panneau de gestion en cours...").then(async (message: Message) => {
            await interaction.reply({
                content: `**${client.emotes.yes} ➜ Le panneau de gestion a bien été envoyé.**`,
                ephemeral: true
            })
            await updatePanel(client, message)

            const data = await bot.findOne()
            if (data) {
                data.msgID = message.id
                data.channelID = message.channel.id
                await data.save()
            }
        })
    }
}

export = new Panel;