import { CommandFactoryBase } from "./CommandFactoryBase";

export interface ICommandHandler{
    commandFactory:CommandFactoryBase;
    handle(command:any,connection:any):void;
}