import { CommandType } from '../Types/CommandType';
import { CommandFactoryBase } from '../Abstracts/CommandFactoryBase'
import { IServerManager } from '../Abstracts/IServerManager'
import { ICommand } from '../Abstracts/ICommand';
import { CreateRoomCommand } from './CreateRoomCommand';
import { JoinRoomCommand } from './JoinRoomCommand';
import { getRouterRtpCapabilitiesCommand } from './getRouterRtpCapabilitiesCommand';
import { ExitRoomCommand } from './ExitRoomCommand';
import { createWebRtcTransportCommand } from './createWebRtcTransportCommand';
import { getProducersCommand } from './getProducersCommand';



export class CommandFactory extends CommandFactoryBase {
    constructor(connectionManager: IServerManager) {
        super(connectionManager);
    }

    // getCommand(command: any, connection: any): ICommand {
    //     throw new Error('Method not implemented.');
    // }
    
    getCommand(command: any,connection:any): ICommand {
        var newCommand: ICommand;
        switch (command.commandType) {

            case CommandType.CreateRoom:
                newCommand = new CreateRoomCommand(this.connectionMnager, command.Data, command.clientID);
                break;
            case CommandType.createWebRtcTransport:
                newCommand = new createWebRtcTransportCommand(this.connectionMnager, command.Data, command.clientID);
                break;
            case CommandType.JoinRoom:
                newCommand = new JoinRoomCommand(this.connectionMnager, command.Data, command.clientID);
                break;
            case CommandType.ExitRoom:
                newCommand = new ExitRoomCommand(this.connectionMnager, command.Data, command.clientID);
                break;
            case CommandType.getRouterRtpCapabilities:
                newCommand = new getRouterRtpCapabilitiesCommand(this.connectionMnager,command.Data, command.clientID)
                break;
            case CommandType.getProducers:
                newCommand = new getProducersCommand(this.connectionMnager,command.Data, command.clientID)
                break;
            default:
                break;
        }
        return newCommand;
    }
}