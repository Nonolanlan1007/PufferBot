import { green, red } from "colors";
import mongoose from "mongoose";
import config from '../config';

export default {
    init: (): void => {
        const mongoOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: false,
            family: 4
        }

        mongoose.connect(config.mongooseConnectionString, mongoOptions)
            .then(() => {
                setTimeout(() => {
                    console.log(green("[DB]") + " Connecté à MongoDB !");
                }, 1500);
            }).catch(err => {
                console.log(red(`[DB]`) + ` Echec de la connexion à MongoDB : ${err}`);
            })
    },
}