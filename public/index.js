if (location.href.substr(0, 5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4)
// const server = new window.conference('ws://localhost:3016');
const server = new window.conference('wss://192.168.1.105:3016');

let producer = null;
let roomObj = null;
consoleEvent = true;
let _roomId = null;
let _username = null;
let _device = null;
nameInput.value = 'user_' + Math.round(Math.random() * 1000);

const callbackEvents = {
  RoomCreated: "RoomCreated",
  JoinedRoom: "JoinedRoom",
  RoomAlreadyExist: "RoomAlreadyExist",
  RtpCapabilitiesReceived: "RtpCapabilitiesReceived",
  DeviceLoaded: "DeviceLoaded",
  consumerClosed: "consumerClosed",
  newProducers: "newProducers",
  disconnect: "disconnect",
  RoomExited: "RoomExited",
  CreateWebRtcTransportSuccess: "CreateWebRtcTransportSuccess",
  ProducersReceived: "ProducersReceived",
  Transportconnected: "Transportconnected",
  produced: "produced",
  consumed: "consumed",
  producerClosed: "producerClosed"
};


server.connect().then((events) => {
  events.on(callbackEvents.RoomCreated, function (data) {
    JoinRoom(data.Event, data)
  });
  events.on(callbackEvents.RoomAlreadyExist, function (data) {
    JoinRoom(data.Event, data)
  });
  events.on(callbackEvents.JoinedRoom, function (data) {
    ReadRouterRtpCapabilities(data.Event, data)
  });
  events.on(callbackEvents.RtpCapabilitiesReceived, function (data) {
    LoadDevice(data.Event, data)
  });
  events.on(callbackEvents.DeviceLoaded, function (data) {
    InitWebrtcTransport(data.Event, data)
  });
  events.on(callbackEvents.consumerClosed, function (data) {
    roomObj.consumerClosed(data.Data)
  });
  events.on(callbackEvents.newProducers, function (data) {
    ConsoleEvent(data.Event, data)
    roomObj.newProducers(data.Data)
  });
  events.on(callbackEvents.disconnect, function (data) {
    roomObj.disconnect()
  });
  events.on(callbackEvents.RoomExited, function (data) {
    ExitRoom(data.Event, data)
  });
  events.on(callbackEvents.CreateWebRtcTransportSuccess, function (data) {
    CreateWebrtcTransport(data.Event, data)
  });
  events.on(callbackEvents.ProducersReceived, function (data) {
    getProducers(data.Event, data)
  });
  events.on(callbackEvents.Transportconnected, function (data) {
    Transportconnected(data.Event, data)
  });
  events.on(callbackEvents.produced, function (data) {
    produced(data.Event, data)
  });
  events.on(callbackEvents.consumed, function (data) {
    ConsoleEvent(data.Event, data)
    roomObj.getConsumeStreamReturn(data.Data.params)
  });
  events.on(callbackEvents.producerClosed, function (data) {
    ConsoleEvent(data.Event, data)
    roomObj.producerClosedReturn(data.Data.ProducerId, data.Data.type);
  });
})


function Login(username, room_id) {
  if (roomObj && roomObj.isOpen()) {
    console.log('Already connected to a room')
  } else {
    _roomId = room_id;
    _username = username;

    initEnumerateDevices()
    roomObj = new RoomClient(localMedia, remoteVideos, remoteAudios, window.mediasoupClient, server, room_id, username, null)

    roomObj.createRoom(_roomId);

    addListeners()
  }
}

function JoinRoom(EventName, EventData) {
  ConsoleEvent(EventName, EventData)
  roomObj.join(_username, _roomId)
}

function ReadRouterRtpCapabilities(EventName, EventData) {
  ConsoleEvent(EventName, EventData)
  roomObj.getRouterRtpCapabilities(_username, _roomId);
}

function LoadDevice(EventName, EventData) {
  ConsoleEvent(EventName, EventData);
  roomObj.loadDevice(EventData.Data.Capabilities);
}

function InitWebrtcTransport(EventName, EventData) {
  ConsoleEvent(EventName, EventData);
  _device = EventData.Data.Device
  roomObj.createWebRtcTransport(_device, "producerTransport", _roomId);
}

function CreateWebrtcTransport(EventName, EventData) {
  ConsoleEvent(EventName, EventData);
  if (EventData.Data.transportType == "producerTransport") {
    roomObj.initProducerTransports(EventData.Data.params);
    roomObj.createWebRtcTransport(_device, "consumerTransport", _roomId);
  }
  else if (EventData.Data.transportType == "consumerTransport") {
    roomObj.initConsumerTransports(EventData.Data.params);
    roomObj.getProducers(_username, _roomId);
  }
}

function ExitRoom(EventName, EventData) {
  ConsoleEvent(EventName, EventData)
  roomObj.clean()
}

function getProducers(EventName, EventData) {
  ConsoleEvent(EventName, EventData)
  roomObj.newProducers(EventData.Data.producerList);
  roomOpen();
}

function Transportconnected(EventName, EventData) {
  ConsoleEvent(EventName, EventData)
  roomObj.mediasoupCallback("connect", null)
}

function produced(EventName, EventData) {
  ConsoleEvent(EventName, EventData)
  roomObj.mediasoupCallback("produce", EventData.Data)
}




















function roomOpen() {
  login.className = 'hidden'
  reveal(startAudioButton)
  hide(stopAudioButton)
  reveal(startVideoButton)
  hide(stopVideoButton)
  reveal(startScreenButton)
  hide(stopScreenButton)
  reveal(exitButton)
  reveal(copyButton)
  reveal(devicesButton)
  control.className = ''
  reveal(videoMedia)
}

function hide(elem) {
  elem.className = 'hidden'
}

function reveal(elem) {
  elem.className = ''
}

function addListeners() {
  roomObj.on(RoomClient.EVENTS.startScreen, () => {
    hide(startScreenButton)
    reveal(stopScreenButton)
  })

  roomObj.on(RoomClient.EVENTS.stopScreen, () => {
    hide(stopScreenButton)
    reveal(startScreenButton)
  })

  roomObj.on(RoomClient.EVENTS.stopAudio, () => {
    hide(stopAudioButton)
    reveal(startAudioButton)
  })
  roomObj.on(RoomClient.EVENTS.startAudio, () => {
    hide(startAudioButton)
    reveal(stopAudioButton)
  })

  roomObj.on(RoomClient.EVENTS.startVideo, () => {
    hide(startVideoButton)
    reveal(stopVideoButton)
  })
  roomObj.on(RoomClient.EVENTS.stopVideo, () => {
    hide(stopVideoButton)
    reveal(startVideoButton)
  })
  roomObj.on(RoomClient.EVENTS.exitRoom, () => {
    hide(control)
    hide(devicesList)
    hide(videoMedia)
    hide(copyButton)
    hide(devicesButton)
    reveal(login)
  })
}

let isEnumerateDevices = false

function initEnumerateDevices() {
  // Many browsers, without the consent of getUserMedia, cannot enumerate the devices.
  if (isEnumerateDevices) return

  const constraints = {
    audio: true,
    video: true
  }

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      enumerateDevices()
      stream.getTracks().forEach(function (track) {
        track.stop()
      })
    })
    .catch((err) => {
      console.error('Access denied for audio/video: ', err)
    })
}

function enumerateDevices() {
  // Load mediaDevice options
  navigator.mediaDevices.enumerateDevices().then((devices) =>
    devices.forEach((device) => {
      let el = null
      if ('audioinput' === device.kind) {
        el = audioSelect
      } else if ('videoinput' === device.kind) {
        el = videoSelect
      }
      if (!el) return

      let option = document.createElement('option')
      option.value = device.deviceId
      option.innerText = device.label
      el.appendChild(option)
      isEnumerateDevices = true
    })
  )
}

function ConsoleEvent(EventName, EventData) {
  if (consoleEvent) {
    // console.log(EventName + " : "+ JSON.stringify(EventData))
    //alert(EventData.Data.Message)
    if (EventData.Data.Message == undefined) {
      console.log(EventData.Message)
      LiveConsole(EventData.Message);
    }
    else {
      console.log(EventData.Data.Message)
      LiveConsole(EventData.Data.Message);
    }
  }
}

function LiveConsole(msg) {
  let ele = document.getElementById('alert_box');
  if (msg == 'Room Created Successfully.' || msg == 'Room Already Exists.') {
    ele.innerHTML = '<p>' + msg + '</p>';
  }
  else {
    ele.innerHTML += '<p>' + msg + '</p>';
  }
}