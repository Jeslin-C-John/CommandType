import { IConfigManager } from "../Abstracts/IConfigManager";

import os from 'os';
import { networkInterfaces, NetworkInterfaceInfo } from 'os';

// const os = require('os')
// const ifaces = os.networkInterfaces();

const ifaces = networkInterfaces;



export class ConfigManager implements IConfigManager{
  
  Settings :any = [];

  constructor() {    
    this.Settings = {
        listenIp: '192.168.1.103',
        listenPort: 3016,
        sslCrt: '../ssl/certificate.pem',
        sslKey: '../ssl/key.pem',
      
        mediasoup: {
          numWorkers: Object.keys(os.cpus()).length,
          worker: {
            rtcMinPort: 10000,
            rtcMaxPort: 10100,
            logLevel: 'warn',
            logTags: [
              'info',
              'ice',
              'dtls',
              'rtp',
              'srtp',
              'rtcp'
              // 'rtx',
              // 'bwe',
              // 'score',
              // 'simulcast',
              // 'svc'
            ]
          },
          router: {
            mediaCodecs: [
              {
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2
              },
              {
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                  'x-google-start-bitrate': 1000
                }
              }
            ]
          },
          webRtcTransport: {
            listenIps: [
              {
                ip: '0.0.0.0',
                announcedIp: this.getLocalIp()
              }
            ],
            maxIncomingBitrate: 1500000,
            initialAvailableOutgoingBitrate: 1000000
          }
        }
      }
    }

    getLocalIp(){
      let localIp = '127.0.0.1'
      Object.keys(ifaces).forEach((ifname) => {
        for (const iface of ifaces[ifname]) {
          if (iface.family !== 'IPv4' || iface.internal !== false) {
            continue
          }
          localIp = iface.address
          return
        }
      })
      return localIp
    }

}
