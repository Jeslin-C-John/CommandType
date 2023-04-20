import mongoose = require("mongoose");
import { IUserModel } from "../Models/user";

const userSchema: mongoose.Schema = new mongoose.Schema({
    email: { type: String, lowercase: true, required: [true, "can't be blank"] },
    clientID: { type: String, required: [true, "can't be blank"] },
    groupName: { type: String },
    password: { type: String },
    isPasswordRequired: { type: Boolean, default: true },
    name: { type: String, required: [true, "can't be blank"], minlength: 2, maxlength: 100 },
    profile: {
        imagUrl: { type: String },
        thumbNailUrl: { type: String },
    },
    allowMultiple: { type: Boolean, default: false },
    sessionID: { type: String },
    sessions: [{
        validAt: { type: Date }
    }]
}, { timestamps: true });

export const User = mongoose.model<IUserModel>("User", userSchema);