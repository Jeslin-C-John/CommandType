import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { PeerManager } from "../Connections/PeerManager";
import { RoomManager } from "../Connections/RoomManager";
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { roomList } from "../Models/RoomLists";


export class JoinRoomCommand implements ICommand {
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
        console.log("**********************************");
        console.log("User Joined to the call");
        console.log("**************************************");
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
            Data: { ClientID: this.ClientID, Message: "Join Room Command",RoomList:null}
        }
        
        let room_id = this.Data.RoomId;
        let name = this.Data.Name;

        // console.log("******************************* wesocket ***********************");
        // console.log(this.ClientID);
        // console.log(this._serverManager);
        // console.log("******************************* wesocket end ***********************");
  
          if (!roomList.has(room_id)) {
            callBackCommand.Data.Message = "Room Not Available";
            callBackCommand.Event = EventTypes.JoinError;
            console.log('Room Not Available')
          }
          else{
            roomList.get(room_id).addPeer(new PeerManager(this.ClientID,name))

            callBackCommand.Data.Message = "Room Joined Successfully";
            callBackCommand.Data.RoomList = roomList.get(room_id).toJson()
            callBackCommand.Event = EventTypes.JoinedRoom;
            console.log('User joined', {room_id: room_id,name: name})
          }

          this._serverManager.sendTo(this.ClientID, callBackCommand);
    }
}
