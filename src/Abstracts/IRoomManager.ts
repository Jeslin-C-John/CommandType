// import { IConfigManager } from "./IConfigManager";

export interface IRoomManager {
    // constructor(room_id:any, worker:any, io:any, config: IConfigManager): void;
    addPeer(peer: any): any;
    getProducerListForPeer(): any;
    getRtpCapabilities(): any;
    createWebRtcTransport(socket_id: any): any;
    connectPeerTransport(socket_id: any, transport_id: any, dtlsParameters: any): any;
    produce(socket_id: any, producerTransportId: any, rtpParameters: any, kind: any): any;
    consume(socket_id: any, consumer_transport_id: any, producer_id: any, rtpCapabilities: any): any;
    removePeer(socket_id: any): any;
    closeProducer(socket_id: any, producer_id: any): any;
    broadCast(socket_id: any, name: any, data: any): any;
    send(socket_id: any, name: any, data: any): any;
    getPeers(): any;
    toJson(): any;
    getRouter(worker: any): any;
}