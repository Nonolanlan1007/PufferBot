import { Schema, model } from "mongoose";

export default model("users", new Schema({
    id: { type: Number, required: false },
    discordId: { type: String, required: false },
    credits: { type: Number, required: false, default: 0 },
}));