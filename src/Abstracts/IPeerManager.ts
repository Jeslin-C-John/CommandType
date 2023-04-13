export interface IPeerManager {
    addTransport(transport:any): any;    
    connectTransport(transport_id:any, dtlsParameters:any):any;
    createProducer(producerTransportId:any, rtpParameters:any, kind:any):any;
    createConsumer(consumer_transport_id:any, producer_id:any, rtpCapabilities:any):any;
    closeProducer(producer_id:any):any;
    getProducer(producer_id:any):any;
    close():any;
    removeConsumer(consumer_id:any):any;
}