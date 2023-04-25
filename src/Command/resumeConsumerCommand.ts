import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { PeerManager } from "../Connections/PeerManager";
import { RoomManager } from "../Connections/RoomManager";
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { roomList } from "../Models/RoomLists";


export class resumeConsumerCommand implements ICommand {
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
                Data: { ClientID: this.ClientID, Message: "Validation Failed!", params: null },
                Event: EventTypes.RegistrationFailed
            }
            this._serverManager.sendTo(this.ClientID, registerCallBack);
        }
        return isValid;
    }

    async execute(): Promise<void> {
        const callBackCommand: any = {
            CommandType: CommandType.connectTransport,
            Data: { ClientID: this.ClientID, Message: "consumerResumed" }
        }


        let room_id = this.Data.RoomId;
        let consumer_id = this.Data.consumerId;

        let consumer = (roomList.get(room_id).getPeers().get(this.ClientID).consumers.get(consumer_id));
        consumer.resume();

        callBackCommand.Data.consumerId = consumer_id;
        callBackCommand.Event = EventTypes.consumerResumed;
        callBackCommand.Data.Message = "consumerResumed";

        console.log(`${consumer} :resumed`)

        this._serverManager.sendTo(this.ClientID, callBackCommand);
    }
}
