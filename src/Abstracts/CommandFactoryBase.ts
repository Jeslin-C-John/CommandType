import { ICommand } from "./ICommand";

import {IServerManager} from '../Abstracts/IServerManager'
export abstract class  CommandFactoryBase {

    protected connectionMnager:IServerManager;

    constructor(connectionManager:IServerManager) {  
        this.connectionMnager = connectionManager;
    }    
    
    abstract getCommand(command:any,connection:any):ICommand;
}