const axios = require('axios')
const backendurl = process.env.REACT_APP_WS_URL;
const webhookurl = process.env.REACT_APP_WEBHOOK;
axios.defaults.withCredentials = true;
const Chat = require('twilio-chat');
const Twilio = require('twilio-client');

async function provisionMessagingService(friendlyName, webhook) {
    try {
        const input = {friendlyName, webhook:webhookurl};
        console.log("creating service:" + friendlyName + " webhook:" + webhookurl);
        const creationResult = await axios.post(`${backendurl}/provision_message_service`, input);

        console.log("creation result:" + creationResult);
        if(creationResult.data.sid) {
            return {
                status:"success",
                sid:creationResult.data.sid
            };
        } else {
            console.log("creation result:" + creationResult);
        }

    } catch (error) {
        return {status: "error"};
    }
}

async function sendMessage(msgSvcSid, to, body) {
    try {
        const input = {body, msgSvcSid, to};
        const sendResult = await axios.post(`${backendurl}/send_msg`, input);

        console.log("send result:" + sendResult);
        if(sendResult.data.sid) {
            return {
                status:"success",
                sid:sendResult.data.sid
            };
        } else {
            console.log("send result:" + sendResult);
        }

    } catch (error) {
        return {status: "error"};
    }
}

async function listConferences(reqID) {
    try {
        console.log(`reqID ${reqID}`)
        const sendResult = await axios.get(`${backendurl}/list_conferences?reqID=${reqID}`);

        console.log("send result:" + sendResult);
        if(sendResult.data.results) {
            return {
                status:"success",
                results:sendResult.data.results
            };
        } else {
            return {status:"error"}
        }

    } catch (error) {
        return {status: "error"};
    }
}

async function setupConferences(phoneNumbers, participantsPerConf) {
    try {
        let phoneTrimmed = phoneNumbers.replace(/\s+/, "") ;
        let phoneList = phoneTrimmed.split(",");
        const input = {phoneNumbers:phoneList, participantsPerConf};
        const sendResult = await axios.post(`${backendurl}/create_conf_groups`, input);

        console.log("send result:" + sendResult);
        if(sendResult.data.status) {
            return {
                status:"success",
                reqID:sendResult.data.reqID
            };
        } else {
            console.log("send result:" + sendResult);
        }

    } catch (error) {
        return {status: "error"};
    }
}

//-------------CHAT-------------------------
let chatChannel = undefined;
let sessionid = undefined;

async function getToken() {
    try {
        const sendResult = await axios.get(`${backendurl}/token`);
        sessionid = sendResult.data.identity;
        return sendResult;

    } catch (error) {
        return {status: "error"};
    }
}

async function getChatChannels() {
    try {
        const channels = await axios.get(`${backendurl}/chat_channels`);
        return channels.data;

    } catch (error) {
        return {status: "error"};
    }
}

async function initiateChat(channelID, messageAdded) {
    let token = await getToken();
    console.log(`token retrieved: ${token.data.token}`)
    sessionid = token.data.identity;
    // Initialize the Chat client
    let chatClient = await Chat.Client.create(token.data.token);
    if(!channelID) {
        chatChannel = await chatClient.createChannel(
            {
                uniqueName: token.data.identity,
                friendlyName: token.data.identity
            }
        )
        const connectFlow = await axios.post(`${backendurl}/connect_chat_to_flow`, {channelsid:chatChannel.sid});
    } else {
        chatChannel = await chatClient.getChannelByUniqueName(channelID);
    }

    setupChannel(messageAdded);
    return chatChannel;
}

function setupChannel(messageAdded) {
    // Join the channel
    chatChannel.join().then((channel) => {
        console.log("Joined Channel")
    });

    // Listen for new messages sent to the channel
    chatChannel.on('messageAdded', function(message) {
        console.log(`${message.author} - ${message.body}`) 
        if(message.author!==sessionid)
            messageAdded(message.body);
    });
    
  }

//-----------------VOICE CALL------------------------
async function getVoiceToken(clientId) {
    try {
        const sendResult = await axios.get(`${backendurl}/voice_token?clientId=${clientId}`);
        return sendResult;

    } catch (error) {
        return {status: "error"};
    }
}

let device = undefined;
let deviceClientId = undefined;

async function newDeviceSetup(clientId, prepareIncoming, cancelCall) {
    let token = await getVoiceToken(clientId);
    deviceClientId = clientId;
    console.log(`voice token retrieved: ${token.data.token}`)
    device = new Twilio.Device();
    device.setup(token.data.token);

    device.on('incoming', function(connection) {
        //https://www.twilio.com/docs/voice/client/javascript/connection#customParameters
        let incomingcallerid = connection.parameters.From;
        console.log(`call coming from ${incomingcallerid}`);
        //device.disconnectAll();
        prepareIncoming(incomingcallerid, connection);
    })

    device.on('cancel', function(connection) {
        console.log(`Call cancelled--`);
        cancelCall()
    })

    
    device.on('disconnect', function(connection) {
        console.log(`Call disconnected--`);
        cancelCall()
    }) 

}

async function initiateCall(clientId, prepareIncoming, cancelCall, phoneNumber=0) {
    if(!device) {
        await newDeviceSetup(clientId, prepareIncoming, cancelCall);
        device.on('ready',
            function(device) {
                if(phoneNumber)
                    device.connect({phoneNumber, clientId})
            }
        )
    } else {
        if(device.status() === 'busy')
            device.disconnectAll();
        if(deviceClientId !== clientId) {
            device.destroy();
            newDeviceSetup(clientId, prepareIncoming, cancelCall);
        }
        if(phoneNumber)
            device.connect({phoneNumber, clientId});
    }
    
}

async function hangupCall() {
    if(device.activeConnection())
        device.activeConnection().disconnect();
    else {
        console.log(`already disconnected. End.`)
    }
}

async function muteCall(isMuted) {
    device.activeConnection().mute(!isMuted);
}

async function pickupCall(connection) {
    connection.accept();
}

export {provisionMessagingService, 
    sendMessage, 
    setupConferences,
    listConferences,
    initiateChat,
    getChatChannels,
    getVoiceToken,
    initiateCall,
    hangupCall,
    muteCall,
    pickupCall
}