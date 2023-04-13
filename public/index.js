if (location.href.substr(0, 5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4)
const server = new window.conference('ws://localhost:3016');

let producer = null;
let roomObj = null;
consoleEvent = true;
let _roomId = null;
let _username = null;
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
      LoanDevice(data.Event, data)
    });
    events.on(callbackEvents.DeviceLoaded, function (data) {
      LoadRoom(data.Event, data)
    });
    events.on(callbackEvents.consumerClosed, function (data) {
      roomObj.consumerClosed(data.consumer_id)
    });
    events.on(callbackEvents.newProducers, function (data) {
      roomObj.newProducers(data)
    });
    events.on(callbackEvents.disconnect, function (data) {
      roomObj.disconnect()
    });
    events.on(callbackEvents.RoomExited, function (data) {
      ExitRoom(data.Event, data)
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

function JoinRoom(EventName, EventData){
  ConsoleEvent(EventName, EventData)
  roomObj.join(_username, _roomId)
}

function ReadRouterRtpCapabilities(EventName, EventData){
  ConsoleEvent(EventName, EventData)
  roomObj.getRouterRtpCapabilities(_username, _roomId); 
}

function LoanDevice(EventName, EventData){
  ConsoleEvent(EventName, EventData);
  roomObj.loadDevice(EventData.Data);
}

function LoadRoom(EventName, EventData) {
  ConsoleEvent(EventName, EventData);
  roomOpen();
}

function ExitRoom(EventName, EventData){
  ConsoleEvent(EventName, EventData)
  roomObj.clean()
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
  if(consoleEvent){
    // console.log(EventName + " : "+ JSON.stringify(EventData))
    console.log(EventData.Data.Message)
    // alert(EventData.Data.Message)
    LiveConsole(EventData.Data.Message);
  }
}

function LiveConsole(msg){
  let ele = document.getElementById('alert_box');
  if(msg=='Room Created Successfully.'||msg=='Room Already Exists.'){
    ele.innerHTML = '<p>'+msg+'</p>';
  }
  else{
    ele.innerHTML += '<p>'+msg+'</p>';
  }
}













// function LoanDevice(EventName, EventData){
//   ConsoleEvent(EventName, EventData);
//   roomObj.loadDevice(EventData.Data).then(function(data) {
//     /* code if successful */
//     console.log(data)
//     alert(data);
//   },
//   function(error) {
//      /* code if some error */
//      alert(error);
//    }
//   );
//   roomOpen();
// }
