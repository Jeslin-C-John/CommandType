import { IRoom } from './IRoom'

export interface IRoomRepository {
    createRoom(room: IRoom): Promise<IRoom>;
    findRoomById(roomID: string): Promise<IRoom>;
    findRoomByName(roomName: string):Promise<IRoom>;
    getAllRooms(): Promise<IRoom[]>;
}