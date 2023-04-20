import { createServer } from "httpolyglot";
import { Application } from "express";
import { server as Server } from "websocket";
// import { Server  } from 'ws';
import { uuid } from "uuidv4";
import { ICommandHandler } from "../Abstracts/ICommandHandler";
import { IServerManager } from "../Abstracts/IServerManager";
import { EventTypes } from "../Types/Events";
import { RoomManager } from "../Connections/RoomManager";
import { IConfigManager } from "../Abstracts/IConfigManager";
import { ConfigManager } from "./ConfigManager";
import { BrowserClient } from "../BrowserClient";
import { ClientBase } from "../Abstracts/ClientBase";
import { PeerManager } from "./PeerManager";
import { roomList } from "../Models/RoomLists";
import { RoomRepository } from "../Repositories/RoomRepository";

const express = require("express");
const path = require("path");
const fs = require("fs");
const mediasoup = require("mediasoup");
const TransactionManager = require("transaction-manager");

export class WebSocketServer implements IServerManager {
  private app: Application;
  private httpServer: any;
  private commandHandler: ICommandHandler = null;
  private defaultPort: number;
  private clients: ClientBase[] = [];
  private server: any;
  private endPoint: any;
  private outGoingStremInfo: any;
  private transports: any;
  private roomManagers: RoomManager[];
  private readonly config: IConfigManager;
  private workers: any = [];
  private nextMediasoupWorkerIdx = 0;

  constructor() {
    this.config = new ConfigManager();

    const options = {
      key: fs.readFileSync(
        path.join(__dirname, "../", this.config.Settings.sslKey),
        "utf-8"
      ),
      cert: fs.readFileSync(
        path.join(__dirname, "../", this.config.Settings.sslCrt),
        "utf-8"
      ),
    };

    this.app = express();
    this.app.use(express.static(path.join(__dirname, "../../public")));
    this.httpServer = createServer(options, this.app);

    this.createWorkers();
  }

  async createWorkers(): Promise<void> {
    let { numWorkers } = this.config.Settings.mediasoup;

    for (let i = 0; i < numWorkers; i++) {
      let worker = await mediasoup.createWorker({
        logLevel: this.config.Settings.mediasoup.worker.logLevel,
        logTags: this.config.Settings.mediasoup.worker.logTags,
        rtcMinPort: this.config.Settings.mediasoup.worker.rtcMinPort,
        rtcMaxPort: this.config.Settings.mediasoup.worker.rtcMaxPort,
      });

      worker.on("died", () => {
        console.error(
          "mediasoup worker died, exiting in 2 seconds... [pid:%d]",
          worker.pid
        );
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push(worker);
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

  onMessage(command: any, connection: any) {
    //console.clear();
    this.commandHandler.handle(command, connection);
  }

  connect(): IServerManager {
    if (this.commandHandler == null) {
      console.error("Command Handler Not Set.");
      return this;
    }

    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../../public/index.html"));
    });
    this.httpServer.listen(this.defaultPort, () => {
      console.log(
        new Date() + " Http Server is listening on port " + this.defaultPort
      );
    });
    this.server = new Server({
      httpServer: this.httpServer,
      autoAcceptConnections: false,
    });

    this.server.on("request", (request) => {
      // const connection = request.accept('echo-protocol', request.origin);
      const connection = request.accept(null, request.origin);
      console.log(new Date() + " Connection accepted.");
      const { authorization } = request.httpRequest.headers;
      const client: ClientBase = new BrowserClient();
      const clientId = this.requestHasAuthToken(authorization);

      client.clientID = clientId;
      client.ClientSocket = connection;
      this.clients.push(client);
      connection.clientID = clientId;

      connection.on("message", (socket) => {
        if (socket.type === "utf8") {
          const command = JSON.parse(socket.utf8Data);
          console.log("Data: ", socket.utf8Data);
          command.clientID = clientId;
          this.onMessage(command, connection);
        }
      });

      connection.on("close", (reasonCode, description) => {
        const { clientID } = connection;
        console.log(
          `Peer ${clientID} disconnected with reason Code ${reasonCode}. Description ${description}`
        );
        this.removeUserByClientID(clientID);
        this.clients = this.clients.filter(
          (item) => item.clientID !== clientID
        );
      });
    });
    console.log(`Socket server running in port ${this.defaultPort}.`);
  }

  async getRouterRtpCapabilities(room_id: any): Promise<any> {
    // console.log('Get RouterRtpCapabilities', {
    //     name: `${this.roomList.get(room_id).getPeers().get(socket.id).name}`
    //   })

    try {
      console.log("dasdsad:");
      return roomList.get(room_id).getRtpCapabilities();
    } catch (e) {
      return {
        error: e.message,
      };
    }
  }

  cleanUp() {
    //mediasoup.exit();
    console.log("Server Closed");
  }

  removeUserByClientID(clientId) {

    var roomId = null;
    var name = null;

    for (let key of roomList.keys()) {
      if (roomList.get(key).getPeers().get(clientId) !== undefined) {
        roomId = key;
        name = roomList.get(key).getPeers().get(clientId).name;
        break;
      }
    }

    if (roomId !== null) {
      roomList.get(roomId).removePeer(clientId)
    }
    console.log(`${name} disconnected`);


    this.sendParticipantList(roomId)

  }

  getMediasoupWorker() {
    const worker = this.workers[this.nextMediasoupWorkerIdx];

    if (++this.nextMediasoupWorkerIdx === this.workers.length)
      this.nextMediasoupWorkerIdx = 0;

    return worker;
  }

  requestHasAuthToken(token: string): string {
    return token ? token : this.generateClientID();
  }

  private generateClientID(): string {
    return uuid();
  }

  getClient(clientID: string) {
    return this.clients.find((x) => x.clientID === clientID);
  }

  getGroup(groupName: string): ClientBase[] {
    return this.clients.filter((x) => x.GroupName === groupName);
  }

  getClients(): ClientBase[] {
    return this.clients;
  }

  sendTo(target: string, data: any): void {
    var targetClient = this.getClient(target);
    if (targetClient)
      this.getClient(target).ClientSocket.sendUTF(JSON.stringify(data));
    else console.log(`${target} Client Not Found.`);
  }




  broadCastRoom = (callBackCommand: any, room_id: any): void => {
    for (let key of roomList.get(room_id).peers.keys()) {
      this.sendTo(key, callBackCommand);
    }
  };

  BroadcastToOtherParticipantsInRoom(callBackCommand: any, room_id: any, sender: any): void {
    for (let key of roomList.get(room_id).peers.keys()) {
      if (key !== sender) {
        this.sendTo(key, callBackCommand);
      }
    }
  }

  sendToSingleParticipant(callBackCommand: any, recipient: any): void {
    this.sendTo(recipient, callBackCommand);
  }

  sendParticipantList(roomId: any): void {

    if (roomList.has(roomId)) {
      var roomDetails = roomList.get(roomId);
    }

    try {
      var resp = [...roomDetails.peers.entries()].map(([id, peer]) => ({
        user_id: id,
        user_name: peer.name,
        consumers: [...peer.consumers.keys()],
        producers: [...peer.producers.keys()]
      }));
      // var resp = [...roomDetails.peers.entries()].map(([id, peer]) => ({
      //   id,
      //   name: peer.name,
      //   transports: [...peer.transports.keys()],
      //   consumers: [...peer.consumers.keys()],
      //   producers: [...peer.producers.keys()]
      // }));
    } catch (error) { resp = null }

    if (resp !== null) {
      const callBackCommand: any = {
        CommandType: "ParticipantListUpdate",
        Data: { Data: resp, Message: "ParticipantListUpdate" }
      }
      callBackCommand.Event = EventTypes.ParticipantListUpdate;

      this.broadCastRoom(callBackCommand, roomId);
      this.PushUserDeatilsToMogoDB(roomId, resp)
      // this.BroadcastToOtherParticipantsInRoom(callBackCommand, room_id, this.ClientID);
    }

  }

  PushUserDeatilsToMogoDB(roomId: any, userDetails: any) {
    let IRoomRepository = new RoomRepository();

    IRoomRepository.findRoomByName(roomId).then(
      function (res) {
        if (res != undefined && res != null) {
          IRoomRepository.updateUserList(roomId, userDetails);
        }
      },
      function (err) {
        console.error(`Something went wrong: ${err}`)
      }
    );
  }

}
