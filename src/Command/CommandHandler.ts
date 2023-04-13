import { CommandFactoryBase } from "../Abstracts/CommandFactoryBase";
import { ICommand } from "../Abstracts/ICommand";
import { ICommandHandler } from "../Abstracts/ICommandHandler";

export class CommandHandler implements ICommandHandler {
    commandFactory:CommandFactoryBase;
    constructor(commandFactory:CommandFactoryBase) {  
        this.commandFactory = commandFactory;      
    }
    handle(command:any,connection:any): void {
        const newCommand:ICommand = this.commandFactory.getCommand(command,connection);
        if(!newCommand){
            //console.log()
            return;
        }
        //console.log('Is Command Valid: ',newCommand.Valid)
        // if(!newCommand.Valid){
        //     console.log(`Command Not Valid -> `,newCommand.CommandType,newCommand.Data);
        //     return;
        // }
        //console.log('Command Executing ',newCommand);
        newCommand.execute();            
    }
}