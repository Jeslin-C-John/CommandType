import { IServerManager } from "../Abstracts/IServerManager"
import { IConfigManager } from "../Abstracts/IConfigManager";
import { RoomManager } from "./RoomManager";
import { PeerManager } from "./PeerManager";
import { ConfigManager } from "./ConfigManager";
import { ICommandHandler } from "../Abstracts/ICommandHandler";


const express = require('express')
const https = require('httpolyglot')
const fs = require('fs')
const mediasoup = require('mediasoup')
const path = require('path')
const app = express()




export class SocketServer implements IServerManager {

  private readonly config: IConfigManager;
  private defaultPort: number ;
  private commandHandler: ICommandHandler  ;
  private workers: any = []
  private nextMediasoupWorkerIdx = 0
  private roomList = new Map();
  private io :any;
  

  constructor() {
    
     this.config = new ConfigManager();

    const options = {
      key: fs.readFileSync(path.join(__dirname,'../' ,this.config.Settings.sslKey), 'utf-8'),
      cert: fs.readFileSync(path.join(__dirname,'../', this.config.Settings.sslCrt), 'utf-8')
    }

    const httpsServer = https.createServer(options, app)

    this.io = require('socket.io')(httpsServer)

    app.use(express.static(path.join(__dirname, '../../','public')))

    httpsServer.listen(this.config.Settings.listenPort, () => {
      console.log('Listening on https://' + this.config.Settings.listenIp + ':' + this.config.Settings.listenPort)
    })

  }

  usePort(port: number): IServerManager {
    this.defaultPort = port;
    return this;
  }
  connect(): IServerManager {
    this.createWorkers();
    this.SocketConnect(this.io,this.roomList);    
    return this;
  }

  setCommandHandler(commandHandler: ICommandHandler): IServerManager{
    if (commandHandler.commandFactory === null) {
        console.error(`Invalid Command Handler, Error : Command Factory Missing`);
        return this;
    }
    this.commandHandler = commandHandler;
    return this;
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
    }
  }


  SocketConnect(io: any, roomList: any) {

    io.on('connection', (socket) => {

      socket.on('reconnect_failed', function(room_id) {
        console.log('Reconnection failed');
    })
      
      socket.on('createRoom', async ({ room_id }, callback) => {
        if (roomList.has(room_id)) {
          callback('already exists')
        } else {
          console.log('Created room', { room_id: room_id })
          let worker = await this.getMediasoupWorker()
          roomList.set(room_id, new RoomManager(room_id, worker, io))
          callback(room_id)
        }
      })

      socket.on('join', ({ room_id, name }, cb) => {
        console.log('User joined', {
          room_id: room_id,
          name: name
        })

        if (!roomList.has(room_id)) {
          return cb({
            error: 'Room does not exist'
          })
        }

        roomList.get(room_id).addPeer(new PeerManager(socket.id, name))
        socket.room_id = room_id

        cb(roomList.get(room_id).toJson())
      })

      socket.on('getProducers', () => {
        if (!roomList.has(socket.room_id)) return
        console.log('Get producers', { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` })

        // send all the current producer to newly joined member
        let producerList = roomList.get(socket.room_id).getProducerListForPeer()

        socket.emit('newProducers', producerList)
      })

      socket.on('getRouterRtpCapabilities', (_, callback) => {
        console.log('Get RouterRtpCapabilities', {
          name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })

        try {
          callback(roomList.get(socket.room_id).getRtpCapabilities())
        } catch (e) {
          callback({
            error: e.message
          })
        }
      })

      socket.on('createWebRtcTransport', async (_, callback) => {
        console.log('Create webrtc transport', {
          name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })

        try {
          const { params } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id)

          callback(params)
        } catch (err) {
          console.error(err)
          callback({
            error: err.message
          })
        }
      })

      socket.on('connectTransport', async ({ transport_id, dtlsParameters }, callback) => {
        console.log('Connect transport', { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` })

        if (!roomList.has(socket.room_id)) return
        await roomList.get(socket.room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters)

        callback('success')
      })

      socket.on('produce', async ({ kind, rtpParameters, producerTransportId }, callback) => {
        if (!roomList.has(socket.room_id)) {
          return callback({ error: 'not is a room' })
        }

        let producer_id = await roomList.get(socket.room_id).produce(socket.id, producerTransportId, rtpParameters, kind)

        console.log('Produce', {
          type: `${kind}`,
          name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
          id: `${producer_id}`
        })

        callback({
          producer_id
        })
      })

      socket.on('consume', async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
        //TODO null handling
        let params = await roomList.get(socket.room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities)

        console.log('Consuming', {
          name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
          producer_id: `${producerId}`,
          consumer_id: `${params.id}`
        })

        callback(params)
      })

      socket.on('resume', async (data, callback) => {
        //await consumer.resume()   
        callback()
      })

      socket.on('getMyRoomInfo', (_, cb) => {
        cb(roomList.get(socket.room_id).toJson())
      })

      socket.on('disconnect', () => {
        console.log('Disconnect', {
          name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })

        if (!socket.room_id) return
        roomList.get(socket.room_id).removePeer(socket.id)
      })

      socket.on('producerClosed', ({ producer_id }) => {
        console.log('Producer close', {
          name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })

        roomList.get(socket.room_id).closeProducer(socket.id, producer_id)
      })

      socket.on('exitRoom', async (_, callback) => {
        console.log('Exit room', {
          name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })

        if (!roomList.has(socket.room_id)) {
          callback({
            error: 'not currently in a room'
          })
          return
        }
        // close transports
        await roomList.get(socket.room_id).removePeer(socket.id)
        if (roomList.get(socket.room_id).getPeers().size === 0) {
          roomList.delete(socket.room_id)
        }

        socket.room_id = null

        callback('successfully exited room')
      })

    })
  }

  room() {
    return Object.values(this.roomList).map((r: any) => {
      return {
        router: r.router.id,
        peers: Object.values(r.peers).map((p: any) => {
          return {
            name: p.name
          }
        }),
        id: r.id
      }
    })
  }

  getMediasoupWorker() {
    const worker = this.workers[this.nextMediasoupWorkerIdx]

    if (++(this.nextMediasoupWorkerIdx) === this.workers.length) this.nextMediasoupWorkerIdx = 0

    return worker
  }


  broadCastToGroup(group: string, data: any): void {
    throw new Error("Method not implemented.");
  }
  sendTo(target: string, data: any): void {
    throw new Error("Method not implemented.");
  }
  broadCast(data: any): void {
    throw new Error("Method not implemented.");
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
  getTransport(key?: string | undefined) {
    throw new Error("Method not implemented.");
  }
  selectLayer(msg: any): void {
    throw new Error("Method not implemented.");
  }
  cleanUp(): void {
    throw new Error("Method not implemented.");
  }

}
