import { Schema, model } from "mongoose";

export default model("bot", new Schema({
    msgID: { type: String, required: false },
    channelID: { type: String, required: false }
}));