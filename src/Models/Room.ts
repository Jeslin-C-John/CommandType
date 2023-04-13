import { Document } from "mongoose";
import { IRoom } from "../Abstracts/IRoom";

export interface IRoomModel extends IRoom, Document {
    
}