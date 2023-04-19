import { RoomManager } from "../Connections/RoomManager";
import { ICommandHandler } from "./ICommandHandler";

export interface IServerManager {
    usePort(port: number): IServerManager;
    connect(): IServerManager;
    sendTo(target: string, data: any): void;
    setCommandHandler(commandHandler: ICommandHandler): IServerManager;
    broadCastRoom(callBackCommand: any, room_id: any): void;
    BroadcastToOtherParticipantsInRoom(callBackCommand: any, room_id: any, sender: any): void;
    cleanUp(): void;
    getMediasoupWorker(): any;
    sendParticipantList(roomId: any): void;
}