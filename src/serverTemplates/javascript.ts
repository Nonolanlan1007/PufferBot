/*
    Créer mon propre modèle de serveur :

    1. Créer un nouveau fichier dans le dossier serverTemplates portant l'extension .ts.
    2. Rendez-vous sur votre PufferPanel et allez dans la section "Modèles".
    3. Cliquez sur "+" et remplissez les champs comme vous le souhaitez.
    4. Une fois que c'est terminé, cliquez sur le bouton "JSON" dans le coin supérieur droit.
    5. Copiez le contenu du JSON.
    6. Dans le fichier .ts que vous avez créé, collez le contenu du modèle et rajoutez "export default" devant (voir exemple ci-dessous).
    7. Rajoutez les lignes 44 à 46 de ce fichier à l'avant dernière ligne du votre.
    8. Dans votre fichier, remplacez la valeur de "name" par le nom de votre fichier (sans l'extention).
    9. Et voilà, votre modèle est prêt à être utilisé !
 */

export default {
    "data": {
        "mainFile": {
            "type": "string",
                "desc": "Le fichier sur lequel votre programme doit démarrer.",
                "display": "Fichier de démarrage",
                "required": true,
                "value": "index.js",
                "userEdit": true
        }
    },
    "display": "NodeJS (Javascript)",
    "environment": {
        "type": "standard"
    },
    "install": [
        {
            "commands": [
                "npm install"
            ],
            "type": "command"
        }
    ],
    "node": 1,
    "requirements": {},
    "run": {
        "autostart": true,
        "stop": "stop",
        "command": "node ${mainFile}"
    },
    "type": "nodejs",
    "users": [],
    "name": "javascript",
    "id": undefined
}