import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { PeerManager } from "../Connections/PeerManager";
import { RoomManager } from "../Connections/RoomManager";
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { roomList } from "../Models/RoomLists";


export class getRouterRtpCapabilitiesCommand implements ICommand {
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
            CommandType: CommandType.JoinRoom,
            Data: { ClientID: this.ClientID, Message: "RtpCapabilities Command",Capabilities:null}
        }
        
        let room_id = this.Data.RoomId;


          console.log('Get RouterRtpCapabilities :', {
            name: `${roomList.get(room_id).getPeers().get(this.ClientID).name}`
          })

          console.log('Getting RouterRtpCapabilities');
  
          try {
            callBackCommand.Data.Message = "RtpCapabilities Received";
            callBackCommand.Data.Capabilities = roomList.get(room_id).getRtpCapabilities()
            callBackCommand.Event = EventTypes.RtpCapabilitiesReceived;
            console.log('RtpCapabilities Received');
          } catch (e) {
            callBackCommand.Data.Message = e.message;
            callBackCommand.Event = EventTypes.RtpCapabilitiesError;
            console.log(e.message)
          }

          this._serverManager.sendTo(this.ClientID, callBackCommand);
    }
}
