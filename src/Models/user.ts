import { Document } from "mongoose";
import { IUser } from "../Abstracts/IUser";
export interface IUserModel extends IUser, Document {    
    //_id:String;
    sessionID:string;
}
