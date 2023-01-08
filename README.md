# PufferBot

PufferBot est un robot Discord qui vous permet de proposer aux utilisateurs de votre serveur des services d’hébergements 100% automatisés ! Relié avec le panneau de jeu PufferPanel (https://pufferpanel.com), il sera votre meilleur atout pour gagner du temps ! Créer vos articles, définissez-leur un prix, ajoutez un peu de stock et c’est tout ! 
Vos utilisateurs pourrons ensuite les acheter avec des crédits (à vous d’automatiser cela car pour l’instant, vous pouvez juste ajouter des crédits à vos membres avec un commande). Une fois leur service livré (dans les 5 secondes), ils n’auront qu’à se connecter au PufferPanel une fois pour importer leurs fichier ! Tout le reste fonctionne directement depuis Discord.

Voici quelques fonctionnalités supplémentaires de PufferBot :
* Commandes administratives pour voir des informations sur les utilisateurs et leurs serveurs.
* Allumage/Installation/Arrêt des serveurs depuis Discord.
* Récupération de la console sur Discord. 
* Possibilité de modifier son service en passant à un autre (à prix égal).
* Renouvellement automatique si la solde de crédits est suffisante.
* Possibilités de résiliation (avec possibilité d’annulation jusqu’à la date d’expiration).
* Entièreté des actions importantes envoyées dans un salon configuré !

Ce projet m’a pris 2 semaines à réaliser. Il a été entièrement fait en TypeScript avec DiscordJS et l’API de PufferPanel. 

# Installation

```
git clone https://github.com/Nonolanlan1007/PufferBot.git
cd PufferBot
npm install
npm install ts-node -g
ts-node src/index.ts
```

## ⚠️ Pour éviter les problèmes
> - Pour fonctionner correctement, veuillez générer les identifiants du PufferPanel depuis un compte administrateur. 
> - Installez le bot en le reliant à un PufferPanel **vide** (un seul utilisateur (vous) & aucuns serveurs).

### Rappel
PufferBot n'est pas affilié avec PufferPanel. PufferPanel est un projet open-source que vous pouvez retrouver à l'adresse suivante : https://github.com/PufferPanel/PufferPanel.
