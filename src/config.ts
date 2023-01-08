import emotes from './emotes';

export default {
    puffer: {
        token: "token",
        clientId: "clientId",
        basePanelUrl: "pufferUrl"
    },
    guildId: "guildId",
    mongooseConnectionString: "mongoUrl",
    owners: [],
    discordToken: "token",
    color: 0x2f3136,
    webhook: {
        url: "webhookUrl",
        token: "webhookToken",
        id: "webhookId"
    },
    howToBuyCredits: `Pour acheter des crédits, nous vous invitons à envoyer un message privé à <@782667133716791316> en sélectionnant la raison "Contacter YopHeberg".\n\n> Tarif : 1€ = 1 ${emotes.credit}\n⚠️ Paiement PayPal en "Amis & Proches" uniquement` // Expliquez ici comment vos utilisateurs peuvent acheter des crédits.
}