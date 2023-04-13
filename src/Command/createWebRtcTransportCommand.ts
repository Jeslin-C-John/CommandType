import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { RoomRepository } from "../Repositories/RoomRepository";
import { Room } from "../Schemas/Room";
import { RoomManager } from "../Connections/RoomManager";
import { roomList } from "../Models/RoomLists";


export class createWebRtcTransportCommand implements ICommand {
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
        // console.log("Roomlist:"+ JSON.stringify(this.roomList));
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

        const registerCallBack: any = {
            CommandType: CommandType.createWebRtcTransport,
            Data: { 
                        ClientID: this.ClientID, 
                        Message: "Create webrtc transport",
                        params:null,
                        errorlist:null,
                        IsSuccess:true,
                        transportType:null,
                        transportId:null
                  }
        }
        
        let room_id = this.Data.RoomId;
        registerCallBack.Data.transportType = this.Data.transportType;

        console.log('Create webrtc transport', {name: `${roomList.get(room_id).getPeers().get(this.ClientID).name}`})
      
        try {
          const { params } = await roomList.get(room_id).createWebRtcTransport(this.ClientID)
          registerCallBack.Data.Message = "WebRtc Transport Created Successfully.";
          registerCallBack.Event = EventTypes.CreateWebRtcTransportSuccess;
          registerCallBack.Data.params = params;
          registerCallBack.Data.transportId = params.id;
          registerCallBack.Data.IsSuccess = true;
        } catch (err) {
            registerCallBack.Data.Message = err.message
            registerCallBack.Data.params = JSON.stringify(err);
            registerCallBack.Data.IsSuccess = false;
            registerCallBack.Event = EventTypes.CreateWebRtcTransportError;
        }
           
        this._serverManager.sendTo(this.ClientID, registerCallBack);
    }
}
