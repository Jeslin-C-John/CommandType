import { RoomManager } from "../Connections/RoomManager";
import { ICommandHandler } from "./ICommandHandler";

export interface IServerManager {
    usePort(port: number): IServerManager;
    connect(): IServerManager;
    // addClient(name: string): ClientBase;
    broadCastToGroup(group: string, data: any): void;
    sendTo(target: string, data: any): void;
    broadCast(data: any): void;
    // getClient(clientID: string);
    // getGroup(groupName: string): ClientBase[];
    // getClients(): ClientBase[];
    setCommandHandler(commandHandler: ICommandHandler): IServerManager;
    // addRoom(room: IRoom): boolean;
    // getRooms(): IRoom[];
    // getRoom(roomKey: string): IRoom;
    // getRoomManager(roomKey:string):RoomManager;
    // joinToRoom(roomKey: string, user: IUser): IRoom;
    // sendToRoom(roomKey: string, sender: string, data: any): void;
    // leaveRoom(roomKey: string, user: IUser): void;
    // logout(user: IUser);
    getMediaServer():any;
    getEndPoint():any;
    getOutGoingStreamInfo():any;
    setTransporder(transporder:any):void;
    setTransport(transport:any,key:string):void;
    getTransport(key?:string):any;
    selectLayer(msg:any):void;
    cleanUp():void;  
    getMediasoupWorker():any;
}