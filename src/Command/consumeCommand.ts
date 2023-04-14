import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { PeerManager } from "../Connections/PeerManager";
import { RoomManager } from "../Connections/RoomManager";
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { roomList } from "../Models/RoomLists";


export class consumeCommand implements ICommand {
    private readonly _serverManager: IServerManager;
    Data: any = [];
    ClientID: string;
    CommandType: CommandType;

    constructor(connectionManager: IServerManager, data: any, clientID: string) {
        this._serverManager = connectionManager;
        this.Data = data;
        this.ClientID = clientID
        this.CommandType = CommandType.consume;
    }

    public get Valid(): boolean {
        const isValid = (Object.keys(this.Data).length === 0 || !this.ClientID) ? false : true;
        if (!isValid) {
            const registerCallBack: any = {
                CommandType: CommandType.RegisterCallback,
                Data: { ClientID: this.ClientID, Message: "Validation Failed!",params : null},
                Event: EventTypes.RegistrationFailed
            }
            this._serverManager.sendTo(this.ClientID, registerCallBack);
        }
        return isValid;
    }

    async execute(): Promise<void> {
        const callBackCommand: any = {
            CommandType: CommandType.connectTransport,
            Data: { ClientID: this.ClientID, Message: "produced Command"}
        }
        
        let room_id = this.Data.RoomId;
        let consumerTransportId = this.Data.consumerTransportId;
        let producerId = this.Data.ProducerId;
        let rtpCapabilities = this.Data.RtpCapabilities;


        
        
        let params = await roomList.get(room_id).consume(this.ClientID, consumerTransportId, producerId, rtpCapabilities)

        if (params == null) {
          console.log("...................")
          console.log("params is null");
          console.log("...................")
        }
    
        console.log('Consuming', {
          name: `${roomList.get(room_id) && roomList.get(room_id).getPeers().get(this.ClientID).name}`,
          producer_id: `${producerId}`,
          consumer_id: `${(params == null) ? null : params.id}`
        })

        callBackCommand.Data.Message = "consumed";
        callBackCommand.Data.params = params;
        callBackCommand.Event = EventTypes.consumed;
        console.log('consumed')
        console.log("callBack",callBackCommand);
        console.log("params",params);
        
        
        

        this._serverManager.sendTo(this.ClientID, callBackCommand);
    }
}
