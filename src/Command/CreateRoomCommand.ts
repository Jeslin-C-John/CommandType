import { ICommand } from "../Abstracts/ICommand";
import { IServerManager } from '../Abstracts/IServerManager'
import { CommandType } from "../Types/CommandType";
import { EventTypes } from "../Types/Events";
import { RoomRepository } from "../Repositories/RoomRepository";
import { Room } from "../Schemas/Room";
import { RoomManager } from "../Connections/RoomManager";
import { roomList } from "../Models/RoomLists";


export class CreateRoomCommand implements ICommand {
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
            CommandType: CommandType.RegisterCallback,
            Data: { ClientID: this.ClientID }
        }
        
        let room_id = this.Data.RoomId;

        console.log("RoomId:"+room_id);
        if (roomList.has(room_id)) {
            registerCallBack.Data.Message = "Room Already Exists."
            registerCallBack.Event = EventTypes.RoomAlreadyExist;
          } else {
            console.log('Created room', { room_id: room_id })
            registerCallBack.Data.Message = "Room Created Successfully.";
            registerCallBack.Event = EventTypes.RoomCreated;
            let worker = await this._serverManager.getMediasoupWorker()
            let room = new RoomManager(room_id, worker, this._serverManager) 
            roomList.set(room_id,room )
            console.log("**************************************************")
            //console.log(this.roomList.get("123") )
            // console.log("**************************************************")
            
        //    let IRoomRepository = new RoomRepository();
        //    let RoomDetails = new Room({
        //         name: 'Bill',
        //         email: 'bill@initech.com',
        //         avatar: 'https://i.imgur.com/dM7Thhn.png'
        //    })

        //    IRoomRepository.createRoom(RoomDetails);
        //    console.log("Room Created");
           
            
            // return(room_id)
          }
        console.log("clientId", this.ClientID)
        this._serverManager.sendTo(this.ClientID, registerCallBack);
    }
}
