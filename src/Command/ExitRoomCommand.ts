import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { PeerManager } from "../Connections/PeerManager";
import { RoomManager } from "../Connections/RoomManager";
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { roomList } from "../Models/RoomLists";


export class ExitRoomCommand implements ICommand {
    private readonly _serverManager: IServerManager;
    Data: any = [];
    ClientID: string;
    CommandType: CommandType;
    // private roomList = new Map();
   

    constructor(connectionManager: IServerManager, data: any, clientID: string) {
        this._serverManager = connectionManager;
        this.Data = data;
        this.ClientID = clientID
        this.CommandType = CommandType.Register;
        // console.log("**********************************");
        // console.log("User Joined to the call");
        // console.log("**************************************");
    }

    public get Valid(): boolean {
        const isValid = (Object.keys(this.Data).length === 0 || !this.ClientID) ? false : true;
        if (!isValid) {
            const registerCallBack: any = {
                CommandType: CommandType.RegisterCallback,
                Data: { ClientID: this.ClientID, Message: "Validation Failed!" },
                Event: EventTypes.RegistrationFailed
            }
            this._serverManager.sendTo(this.ClientID, registerCallBack);
        }
        return isValid;
    }

    async execute(): Promise<void> {
        const callBackCommand: any = {
            CommandType: CommandType.JoinRoom,
            Data: { ClientID: this.ClientID, Message: "Exit Room Command",RoomList:null}
        }
        
        let room_id = this.Data.RoomId;
        let name = this.Data.Name;

        console.log('Exit room', {
            name: `${roomList.get(room_id) && roomList.get(room_id).getPeers().get(this.ClientID).name}`
        })

  
          if (!roomList.has(room_id)) {
            callBackCommand.Data.Message = "Room Not Available";
            callBackCommand.Event = EventTypes.RoomExitError;
            console.log('Room Not Available')
          }
          else{
            // close transports
            await roomList.get(room_id).removePeer(this.ClientID)
            if (roomList.get(room_id).getPeers().size === 0) {
                roomList.delete(room_id)
            }
            
            callBackCommand.Data.Message = "Room exited successfully";
            callBackCommand.Data.RoomList = null;
            callBackCommand.Event = EventTypes.RoomExited;
            console.log('Room exited', {room_id: room_id,name: name})

            room_id = null;
          }

          this._serverManager.sendTo(this.ClientID, callBackCommand);
    }
}
