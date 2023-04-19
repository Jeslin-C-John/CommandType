import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { PeerManager } from "../Connections/PeerManager";
import { RoomManager } from "../Connections/RoomManager";
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { roomList } from "../Models/RoomLists";


export class producerClosedCommand implements ICommand {
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
                Data: { ClientID: this.ClientID, Message: "Validation Failed!", producer_id: null, Type: null },
                Event: EventTypes.RegistrationFailed
            }
            this._serverManager.sendTo(this.ClientID, registerCallBack);
        }
        return isValid;
    }

    async execute(): Promise<void> {
        const callBackCommand: any = {
            CommandType: CommandType.producerClosed,
            Data: { ClientID: this.ClientID, Message: "producerClosed" }
        }

        let room_id = this.Data.RoomId;
        let producer_id = this.Data.ProducerId;
        let type = this.Data.Type;

        console.log(this.Data)

        roomList.get(room_id).closeProducer(this.ClientID, producer_id);

        callBackCommand.Data.Message = "producer Closed Successfully";
        callBackCommand.Data.ProducerId = producer_id;
        callBackCommand.Data.type = type;
        callBackCommand.Event = EventTypes.producerClosed;
        console.log('producerClosed')

        console.log(callBackCommand)

        this._serverManager.sendTo(this.ClientID, callBackCommand);



        this._serverManager.sendParticipantList(room_id)
    }
}
