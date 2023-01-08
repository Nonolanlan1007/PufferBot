import { Schema, model } from "mongoose";

export default model("products", new Schema({
    id: { type: Number, required: false },
    model: { type: String, required: false },
    stock: { type: Number, required: false },
    title: { type: String, required: false },
    price: { type: Number, required: false },
}));