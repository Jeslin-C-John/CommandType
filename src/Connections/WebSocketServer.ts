import { createServer } from "httpolyglot";
import { Application } from "express";
import { server as Server } from 'websocket';
// import { Server  } from 'ws';
import { uuid } from 'uuidv4';
import { ICommandHandler } from "../Abstracts/ICommandHandler";
import { IServerManager } from "../Abstracts/IServerManager"
import { EventTypes } from "../Types/Events";
import { RoomManager } from "../Connections/RoomManager";
import { IConfigManager } from "../Abstracts/IConfigManager";
import { ConfigManager } from "./ConfigManager";
import { BrowserClient } from "../BrowserClient";
import { ClientBase } from "../Abstracts/ClientBase";
import { PeerManager } from "./PeerManager";

const express = require('express')
const path = require("path");
const fs = require('fs');
const mediasoup = require('mediasoup');
const TransactionManager = require("transaction-manager");

export class WebSocketServer implements IServerManager {
    private app: Application;
    private httpServer: any;
    private commandHandler: ICommandHandler = null;
    private defaultPort: number;
    private clients: ClientBase[] = [];
    private server: any;
    private endPoint:any;
    private outGoingStremInfo:any;
    private transports:any;
    private roomManagers:RoomManager[];
    private readonly config: IConfigManager;
    private workers: any = [];
    private nextMediasoupWorkerIdx = 0;
    private roomList = new Map();
    
    constructor() {
        this.config = new ConfigManager();

        const options = {
          key: fs.readFileSync(path.join(__dirname,'../' ,this.config.Settings.sslKey), 'utf-8'),
          cert: fs.readFileSync(path.join(__dirname,'../', this.config.Settings.sslCrt), 'utf-8')
        }

        this.app = express();
        this.app.use(express.static(path.join(__dirname, "../../public")));
        this.httpServer = createServer(options, this.app);


        this.createWorkers();
    }

    async createWorkers(): Promise<void> {
        let { numWorkers } = this.config.Settings.mediasoup
    
        for (let i = 0; i < numWorkers; i++) {
          let worker = await mediasoup.createWorker({
            logLevel: this.config.Settings.mediasoup.worker.logLevel,
            logTags: this.config.Settings.mediasoup.worker.logTags,
            rtcMinPort: this.config.Settings.mediasoup.worker.rtcMinPort,
            rtcMaxPort: this.config.Settings.mediasoup.worker.rtcMaxPort
          })
    
          worker.on('died', () => {
            console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid)
            setTimeout(() => process.exit(1), 2000)
          })

          this.workers.push(worker)
         // let test = JSON.parse(worker);
         // console.log("Worker: "+ test);
        }
    }

    setCommandHandler(commandHandler: ICommandHandler): IServerManager {
        if (commandHandler.commandFactory === null) {
            console.error(`Invalid Command Handler, Error : Command Factory Missing`);
            return;
        }
        this.commandHandler = commandHandler;
        return this;
    }

    usePort(port: number): IServerManager {
        this.defaultPort = port;
        return this;
    }

    onMessage(command: any,connection:any) {
        //console.clear();
        this.commandHandler.handle(command,connection);
    }

    connect(): IServerManager {
        if (this.commandHandler == null) {
            console.error('Command Handler Not Set.');
            return this;
        }

        this.app.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "../../public/index.html"));
        });
        this.httpServer.listen(this.defaultPort, () => {
            console.log((new Date()) + ' Http Server is listening on port ' + this.defaultPort);
        })
        this.server = new Server({
            httpServer: this.httpServer,
            autoAcceptConnections: false
        });

        this.server.on('request', (request) => {
            // const connection = request.accept('echo-protocol', request.origin);
            const connection = request.accept(null, request.origin);
            console.log((new Date()) + ' Connection accepted.');
            const { authorization } = request.httpRequest.headers;
            const client: ClientBase = new BrowserClient();
            const clientId = this.requestHasAuthToken(authorization);



            client.clientID = clientId;
            client.ClientSocket = connection;
            this.clients.push(client);
            connection.clientID = clientId;

            connection.on('message', (socket) => {
                if (socket.type === 'utf8') {
                     const command = JSON.parse(socket.utf8Data);
                     console.log('Data: ',socket.utf8Data);
                     command.clientID = clientId;
                     this.onMessage(command,connection);
                }
            });

            connection.on('close', (reasonCode, description) => {
                const { clientID } = connection;
                console.log(`Peer ${clientID} disconnected with reason Code ${reasonCode}. Description ${description}`);
                // this.removeUserByClientID(clientID);
                this.clients = this.clients.filter((item) => item.clientID !== clientID);
            });
        });
        console.log(`Socket server running in port ${this.defaultPort}.`);
    }

    async getRouterRtpCapabilities(room_id:any):Promise<any>{
        // console.log('Get RouterRtpCapabilities', {
        //     name: `${this.roomList.get(room_id).getPeers().get(socket.id).name}`
        //   })
  
          try {
            console.log("dasdsad:")
            return(this.roomList.get(room_id).getRtpCapabilities())

          } catch (e) {
            return({
              error: e.message
            })
          }
    }

    cleanUp(){
        //mediasoup.exit();
        console.log("Server Closed");
    }

    // async CreateRoom(room_id:any):Promise<any>{
    //     console.log("RoomId:"+room_id);
    //     if (this.roomList.has(room_id)) {
    //         return ('already exists')
    //       } else {
    //         console.log('Created room', { room_id: room_id })
    //         let worker = await this.getMediasoupWorker()
    //         this.roomList.set(room_id, new RoomManager(room_id, worker, this.server))
    //         return(room_id)
    //       }
    // }


    // JoinRoom(room_id:any,name:string){
    //     console.log('User joined', {
    //         room_id: room_id,
    //         name: name
    //       })
  
    //       if (!this.roomList.has(room_id)) {
    //         return cb({
    //           error: 'Room does not exist'
    //         })
    //       }
  
    //       this.roomList.get(room_id).addPeer(new PeerManager(room_id, name))
    //       socket.room_id = room_id
  
    //       //cb(roomList.get(room_id).toJson())
    // }


    // Callback():any{

    // }











    getMediasoupWorker() {
        const worker = this.workers[this.nextMediasoupWorkerIdx]
    
        if (++(this.nextMediasoupWorkerIdx) === this.workers.length) this.nextMediasoupWorkerIdx = 0
    
        return worker
      }
    










    getMediaServer() {
        throw new Error("Method not implemented.");
    }
    getEndPoint() {
        throw new Error("Method not implemented.");
    }
    getOutGoingStreamInfo() {
        throw new Error("Method not implemented.");
    }
    setTransporder(transporder: any): void {
        throw new Error("Method not implemented.");
    }
    setTransport(transport: any, key: string): void {
        throw new Error("Method not implemented.");
    }
    getTransport(key?: string) {
        throw new Error("Method not implemented.");
    }
    selectLayer(msg: any): void {
        throw new Error("Method not implemented.");
    }
    async loadRooms(): Promise<void> {
        throw new Error("Method not implemented.");
    } 
    getRoomManager(roomKey: string): RoomManager {
        throw new Error("Method not implemented.");
    }
    sendToRoom(roomKey: string, sender: string, data: any): void {
        throw new Error("Method not implemented.");
    }
    getClient(clientID: string) {
        return this.clients.find(x => x.clientID === clientID);
    }
    getGroup(groupName: string): ClientBase[] {
        return this.clients.filter(x => x.GroupName === groupName);
    }
    getClients(): ClientBase[] {
        return this.clients;
    }
    broadCastToGroup = (group: string, data: any): void => {
        throw new Error("Method not implemented.");
    }


    sendTo(target: string, data: any): void {
        var targetClient = this.getClient(target);
         if(targetClient)
        //if (targetClient && this.getClient(target))
            this.getClient(target).ClientSocket.sendUTF(JSON.stringify(data));
        else
            console.log(`${target} Client Not Found.`)
    }


    broadCast = (data: any): void => {
        throw new Error("Method not implemented.");
    }
    addClient(name: string): ClientBase {
        throw new Error("Method not implemented.");
    }
    requestHasAuthToken(token: string): string {
        return token ? token : this.generateClientID();
    }
    private generateClientID(): string {
        return uuid();
    }
    
}