import mongoose = require("mongoose");
import { IRoomModel } from "../Models/Room";

const roomSchema: mongoose.Schema = new mongoose.Schema({
    name: { type: String, required: [true, "can't be blank"], minlength: 2, maxlength: 100 },
    email: { type: String, required: true },
    avatar: String
}, { timestamps: true });

export const Room = mongoose.model<IRoomModel>("Room", roomSchema);