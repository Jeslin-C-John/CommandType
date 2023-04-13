import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { PeerManager } from "../Connections/PeerManager";
import { RoomManager } from "../Connections/RoomManager";
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { roomList } from "../Models/RoomLists";


export class getProducersCommand implements ICommand {
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
                Data: { ClientID: this.ClientID, Message: "Validation Failed!" },
                Event: EventTypes.RegistrationFailed
            }
            this._serverManager.sendTo(this.ClientID, registerCallBack);
        }
        return isValid;
    }

    async execute(): Promise<void> {
        const callBackCommand: any = {
            CommandType: CommandType.getProducers,
            Data: { ClientID: this.ClientID, Message: "get Producers Command",producerList:null}
        }
        
        let room_id = this.Data.RoomId;

        if (!roomList.has(room_id)){
          callBackCommand.Data.Message = "Room Already Exists."
          callBackCommand.Event = EventTypes.RoomAlreadyExist;
        } 
        else{
          console.log('Get producers', { name: `${roomList.get(room_id).getPeers().get(this.ClientID).name}` })
          let producerList = roomList.get(room_id).getProducerListForPeer()
          callBackCommand.Data.Message = "Producers Received";
          callBackCommand.Data.producerList = producerList;
          callBackCommand.Event = EventTypes.ProducersReceived;
          console.log('Producers Received')
        }

        this._serverManager.sendTo(this.ClientID, callBackCommand);
    }
}
