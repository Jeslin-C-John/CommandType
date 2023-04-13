import { IServerManager } from "../Abstracts/IServerManager"
import { SocketServer } from "./SocketServer"
import { ServerType } from "../Types/ServerType"
import { WebSocketServer } from "./WebSocketServer";
import { MongoDBServer } from "./MongoDBServer";
import { IDatabaseManager } from "../Abstracts/IDatabaseManager";
import { config } from "dotenv";



class ServerFactory {
    private static _instance: ServerFactory;
    private readonly serverType: ServerType;
    private readonly dbType: string;

    private constructor() {
        config({ path: `${__dirname}/../.env` });
        this.serverType = ServerType.WebSocket;
        this.dbType = process.env.DB
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public GetServer(): IServerManager {
        switch (this.serverType) {
            case ServerType.Socket: {
                return new SocketServer();
            }
            case ServerType.WebSocket: {
                return new WebSocketServer();
            }
            default: {
                return new SocketServer();
            }
        }
    }
    public GetDatabase(): IDatabaseManager {
        switch (this.dbType) {
            default: {
                return new MongoDBServer();
            }
        }
    }
}

export const ServerFactoryInstance = ServerFactory.Instance;