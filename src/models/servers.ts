import { Schema, model } from "mongoose";

export default model("servers", new Schema({
    id: { type: String, required: false },
    owner: { type: Number, required: false },
    productId: { type: Number, required: false },
    expirationDate: { type: Number, required: false },
    suspended: { type: Boolean, required: false },
    cancelled: { type: Boolean, required: false },
}));