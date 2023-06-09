import { IConfigManager } from "../Abstracts/IConfigManager";
import { IRoomManager } from "../Abstracts/IRoomManager"
import { EventTypes } from "../Types/Events";
import { ConfigManager } from "./ConfigManager";

export class RoomManager implements IRoomManager {

  private readonly config: IConfigManager;
  private id: any;
  private peers: any;
  private io: any;
  private router: any;

  constructor(room_id, worker, io) {
    this.config = new ConfigManager();
    this.id = room_id
    this.peers = new Map()
    this.io = io
  }

  async getRouter(worker) {
    const mediaCodecs = this.config.Settings.mediasoup.router.mediaCodecs
    await worker
      .createRouter({
        mediaCodecs
      })
      .then(
        function (router) {
          this.router = router
        }.bind(this)
      )
    const audioLevelObserver = await this.router.createAudioLevelObserver(
      {
        interval: 300,
        threshold: -40,
        maxEntries: 500,
      });
    return audioLevelObserver
  }

  AudioLevelObserverEvents(audioLevelObserver: any, _room_id: any) {

    audioLevelObserver.observer.on('silence', () => {
      const callBackCommand: any = {
        CommandType: EventTypes.audioLevelObserver,
        Data: "silence"
      }
      this.io.broadCastRoom(callBackCommand, _room_id)
    })

    audioLevelObserver.observer.on('volumes', (volumes: any) => {
      let activeProducers = [];
      volumes.forEach((Element: { producer: { id: any; }; }) => {
        activeProducers.push(Element.producer.id);
      });
      const callBackCommand: any = {
        CommandType: EventTypes.audioLevelObserver,
        Data: activeProducers
      }
      this.io.broadCastRoom(callBackCommand, _room_id)
    })
  }

  addPeer(peer) {
    this.peers.set(peer.id, peer)
  }

  getProducerListForPeer() {
    let producerList: any = []
    this.peers.forEach((peer) => {
      peer.producers.forEach((producer) => {
        producerList.push({
          producer_id: producer.id
        })
      })
    })
    return producerList
  }

  getRtpCapabilities() {
    return this.router.rtpCapabilities
  }

  async createWebRtcTransport(socket_id) {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = this.config.Settings.mediasoup.webRtcTransport

    const transport = await this.router.createWebRtcTransport({
      listenIps: this.config.Settings.mediasoup.webRtcTransport.listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate
    })
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate)
      } catch (error) { }
    }

    transport.on(
      'dtlsstatechange',
      function (dtlsState) {
        if (dtlsState === 'closed') {
          console.log('Transport close', { name: this.peers.get(socket_id).name })
          transport.close()
        }
      }.bind(this)
    )

    transport.on('close', () => {
      console.log('Transport close', { name: this.peers.get(socket_id).name })
    })

    console.log('Adding transport', { transportId: transport.id })
    this.peers.get(socket_id).addTransport(transport)
    return {
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      }
    }
  }

  async connectPeerTransport(socket_id, transport_id, dtlsParameters) {
    if (!this.peers.has(socket_id)) return

    await this.peers.get(socket_id).connectTransport(transport_id, dtlsParameters)
  }

  async produce(socket_id, producerTransportId, rtpParameters, kind) {
    // handle undefined errors
    return new Promise(
      async function (resolve, reject) {
        let producer = await this.peers.get(socket_id).createProducer(producerTransportId, rtpParameters, kind)
        resolve(producer.id)
        this.broadCast(socket_id, 'newProducers', [
          {
            producer_id: producer.id,
            producer_socket_id: socket_id
          }
        ])
      }.bind(this)
    )
  }

  async consume(socket_id, consumer_transport_id, producer_id, rtpCapabilities) {
    // handle nulls
    if (
      !this.router.canConsume({
        producerId: producer_id,
        rtpCapabilities
      })
    ) {
      console.error('can not consume')
      return
    }

    let { consumer, params } = await this.peers
      .get(socket_id)
      .createConsumer(consumer_transport_id, producer_id, rtpCapabilities)

    consumer.on(
      'producerclose',
      function () {
        console.log('Consumer closed due to producerclose event', {
          name: `${this.peers.get(socket_id).name}`,
          consumer_id: `${consumer.id}`
        })
        this.peers.get(socket_id).removeConsumer(consumer.id)
        // tell client consumer is dead
        // this.io.to(socket_id).emit('consumerClosed', {   // to be fixed
        //   consumer_id: consumer.id
        // })
        const registerCallBack: any = {
          CommandType: "consumerClosed",
          Data: consumer.id,
          Event: "consumerClosed",
          Message: "Consumer closed"
        }
        this.io.sendTo(socket_id, registerCallBack);
      }.bind(this)
    )

    return params
  }

  async removePeer(socket_id) {
    this.peers.get(socket_id).close()
    this.peers.delete(socket_id)
  }

  closeProducer(socket_id, producer_id) {
    this.peers.get(socket_id).closeProducer(producer_id)
  }

  broadCast(socket_id, name, data) {
    for (let otherID of Array.from(this.peers.keys()).filter((id) => id !== socket_id)) {
      this.send(otherID, name, data)
    }
  }

  send(socket_id, name, data) {

    const registerCallBack: any = {
      CommandType: name,
      Data: data,
      Event: name,
      Message: (name == 'newProducers') ? "New producer Created" : name
    }


    // this.io.to(socket_id).emit(name, data)
    this.io.sendTo(socket_id, registerCallBack);
  }

  getPeers() {
    return this.peers
  }

  toJson() {
    return {
      id: this.id,
      peers: JSON.stringify([...this.peers])
    }
  }
}
