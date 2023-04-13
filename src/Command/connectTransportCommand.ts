import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { PeerManager } from "../Connections/PeerManager";
import { RoomManager } from "../Connections/RoomManager";
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { roomList } from "../Models/RoomLists";


export class connectTransportCommand implements ICommand {
    private readonly _serverManager: IServerManager;
    Data: any = [];
    ClientID: string;
    CommandType: CommandType;

    constructor(connectionManager: IServerManager, data: any, clientID: string) {
        this._serverManager = connectionManager;
        this.Data = data;
        this.ClientID = clientID
        this.CommandType = CommandType.Register;
    }

    public get Valid(): boolean {
        const isValid = (Object.keys(this.Data).length === 0 || !this.ClientID) ? false : true;
        if (!isValid) {
            const registerCallBack: any = {
                CommandType: CommandType.RegisterCallback,
                Data: { ClientID: this.ClientID, Message: "Validation Failed!",TransportsType:null },
                Event: EventTypes.RegistrationFailed
            }
            this._serverManager.sendTo(this.ClientID, registerCallBack);
        }
        return isValid;
    }

    async execute(): Promise<void> {
        const callBackCommand: any = {
            CommandType: CommandType.connectTransport,
            Data: { ClientID: this.ClientID, Message: "connect Transport Command"}
        }
        
        let room_id = this.Data.RoomId;
        let transport_id = this.Data.transport_id;
        let dtlsParameters = this.Data.dtlsParameters;
        let TransportsType = this.Data.TransportsType;
        
        if (!roomList.has(room_id)){
          callBackCommand.Data.Message = "Room Already Exists."
          callBackCommand.Event = EventTypes.RoomAlreadyExist;
        } 
        else{
          console.log('Connect transport', { name: `${roomList.get(room_id).getPeers().get(this.ClientID).name}` })
          await roomList.get(room_id).connectPeerTransport(this.ClientID, transport_id, dtlsParameters)
          callBackCommand.Data.Message = "Transport connected";
          callBackCommand.Data.TransportsType = TransportsType;
          callBackCommand.Event = EventTypes.Transportconnected;
          console.log('Transport connected')
        }

        this._serverManager.sendTo(this.ClientID, callBackCommand);
    }
}
