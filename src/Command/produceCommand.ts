import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { PeerManager } from "../Connections/PeerManager";
import { RoomManager } from "../Connections/RoomManager";
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { roomList } from "../Models/RoomLists";


export class produceCommand implements ICommand {
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
                Data: { ClientID: this.ClientID, Message: "Validation Failed!", producer_id: null },
                Event: EventTypes.RegistrationFailed
            }
            this._serverManager.sendTo(this.ClientID, registerCallBack);
        }
        return isValid;
    }

    async execute(): Promise<void> {
        const callBackCommand: any = {
            CommandType: CommandType.connectTransport,
            Data: { ClientID: this.ClientID, Message: "produced Command" }
        }

        let room_id = this.Data.RoomId;
        let producerTransportId = this.Data.producerTransportId;
        let kind = this.Data.kind;
        let rtpParameters = this.Data.rtpParameters;

        if (!roomList.has(room_id)) {
            callBackCommand.Data.Message = "Room Already Exists."
            callBackCommand.Event = EventTypes.RoomAlreadyExist;
        }
        else {

            let producer_id = await roomList.get(room_id).produce(this.ClientID, producerTransportId, rtpParameters, kind)

            console.log('Produce', {
                type: `${kind}`,
                name: `${roomList.get(room_id).getPeers().get(this.ClientID).name}`,
                id: `${producer_id}`
            })

            callBackCommand.Data.Message = "produced";
            callBackCommand.Data.producer_id = producer_id;
            callBackCommand.Event = EventTypes.produced;
            console.log('produced')
        }

        this._serverManager.sendTo(this.ClientID, callBackCommand);


        this._serverManager.sendParticipantList(room_id)


    }
}
