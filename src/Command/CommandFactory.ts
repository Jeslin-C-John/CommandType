import { CommandType } from '../Types/CommandType';
import { CommandFactoryBase } from '../Abstracts/CommandFactoryBase'
import { IServerManager } from '../Abstracts/IServerManager'
import { ICommand } from '../Abstracts/ICommand';
import { CreateRoomCommand } from './CreateRoomCommand';
import { JoinRoomCommand } from './JoinRoomCommand';
import { getRouterRtpCapabilitiesCommand } from './getRouterRtpCapabilitiesCommand';
import { ExitRoomCommand } from './ExitRoomCommand';



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
            // case CommandType.UserListRequest:
            //     newCommand = new UserListCommand(this.connectionMnager, command.Data, command.clientID);
            //     break;
            // case CommandType.Login:
            //     newCommand = new LoginCommand(this.connectionMnager, command.Data, command.clientID);
            //     break;
            // case CommandType.CreateRoom:
            //     newCommand = new CreateRoomCommand(this.connectionMnager, command.Data, command.clientID);
            //     break;
            case CommandType.JoinRoom:
                newCommand = new JoinRoomCommand(this.connectionMnager, command.Data, command.clientID);
                break;
            case CommandType.ExitRoom:
                newCommand = new ExitRoomCommand(this.connectionMnager, command.Data, command.clientID);
                break;
            // case CommandType.FindRoom:
            //     newCommand = new FindRoomCommand(this.connectionMnager, command.Data, command.clientID);
            //     break;
            // case CommandType.RoomList:
            //     newCommand = new RoomListCommand(this.connectionMnager,command.Data,command.clientID);
            //     break;
            // case CommandType.ParticipantsList:
            //     newCommand = new ParticipantsListCommand(this.connectionMnager, command.Data, command.clientID);
            //     break;
            // case CommandType.Sdp:
            //     newCommand = new SDPCommand(this.connectionMnager, command.Data, command.clientID,connection);
            //     break;
            // case CommandType.Offer:
            //     newCommand = new OfferCommand(this.connectionMnager, command.Data, command.clientID,connection);
            //     break;
            // case CommandType.Answer:
            //     newCommand = new AnswerCommand(this.connectionMnager, command.Data, command.clientID);
            //     break;
            // case CommandType.Candidate:
            //     newCommand = new CandidateCommand(this.connectionMnager, command.Data, command.clientID);
            //     break;
            // case CommandType.Logout:
            //     newCommand = new LogoutCommand(this.connectionMnager, command.Data, command.clientID);
            //     break;
            // case CommandType.Hangup:
            //     newCommand = new HangupCommand(this.connectionMnager, command.Data, command.clientID);
            //     break;
            // case CommandType.ValidateSession:
            //     newCommand = new ValidateSessionCommand(this.connectionMnager, command.Data, command.clientID)
            //     break;
            // case CommandType.ToggleMute:
            //     newCommand = new ToggleMuteCommand(this.connectionMnager, command.Data, command.clientID)
            //     break;
            // case CommandType.GetProfileDetails:
            //     newCommand = new GetProfileDetailsCommand(this.connectionMnager, command.Data, command.clientID)
            //     break;
            // case CommandType.LeaveRoom:
            //     newCommand = new LeaveRoomCommand(this.connectionMnager, command.Data, command.clientID)
            //     break;
            // case CommandType.CreatePeerConnectionServer:
            //     newCommand = new CreatePeerConnectionServerCommand(this.connectionMnager,command.Data, command.clientID,connection)
            //     break;
            case CommandType.getRouterRtpCapabilities:
                newCommand = new getRouterRtpCapabilitiesCommand(this.connectionMnager,command.Data, command.clientID)
                break;
            default:
                break;
        }
        return newCommand;
    }
}