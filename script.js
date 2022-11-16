// Script downloaded From Github, and using the Stun server from Google on the 19302 port.
// Note : how does it works : https://i.ytimg.com/vi/_4FkRf9utSc/maxresdefault.jpg

if (!location.hash) {
    location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
  }
  const roomHash = location.hash.substring(1);
  
  const drone = new ScaleDrone('yiS12Ts5RdNhebyM');
  const roomName = 'observable-' + roomHash;
  const configuration = {
    iceServers: [{
      urls: 'stun:stun.l.google.com:19302'
    }]
  };
  let room;
  let pc;
  
  
  function onSuccess() {};
  function onError(error) {
    console.error(error);
  };
  
  drone.on('open', error => {
    if (error) {
      return console.error(error);
    }
    room = drone.subscribe(roomName);
    room.on('open', error => {
      if (error) {
        onError(error);
      }
    });
    room.on('members', members => {
      console.log('MEMBERS', members);
      const isOfferer = members.length === 2;
      startWebRTC(isOfferer);
    });
  });
  
  function sendMessage(message) {
    drone.publish({
      room: roomName,
      message
    });
  }
  
  function startWebRTC(isOfferer) {
    pc = new RTCPeerConnection(configuration);
  
    pc.onicecandidate = event => {
      if (event.candidate) {
        sendMessage({'candidate': event.candidate});
      }
    };
  
    if (isOfferer) {
      pc.onnegotiationneeded = () => {
        pc.createOffer().then(localDescCreated).catch(onError);
      }
    }
  
    pc.ontrack = event => {
      const stream = event.streams[0];
      if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== stream.id) {
        remoteVideo.srcObject = stream;
        document.getElementById("first").innerHTML = "Utilisateurs connectés !";

      }
    };
  
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    }).then(stream => {
      localVideo.srcObject = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }, onError);
  
    room.on('data', (message, client) => {
      if (client.id === drone.clientId) {
        return;
      }
  
      if (message.sdp) {
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
          if (pc.remoteDescription.type === 'offer') {
            pc.createAnswer().then(localDescCreated).catch(onError);
          }
        }, onError);
      } else if (message.candidate) {
        pc.addIceCandidate(
          new RTCIceCandidate(message.candidate), onSuccess, onError
        );
      }
    });
  }
  
  function localDescCreated(desc) {
    pc.setLocalDescription(
      desc,
      () => sendMessage({'sdp': pc.localDescription}),
      onError
    );
  }

//   turnConfig = {
//     iceServers: [
//     {   
//       urls: [ "stun:<YOUR_URL>" ]
//     }, 
//     {   
//       username: "likhith",   
//       credential: "password",   
//       urls: [       
//         "turn:<YOUR_URL>:3478?transport=udp",       
//         "turn:<YOUR_URL>:3478?transport=tcp",       
//        ]
//      }
//    ]
// }