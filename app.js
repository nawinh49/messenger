/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Messenger Platform Webview Tutorial
 *
 * Use this project as the starting point for following the
 * Messenger Platform webview tutorial.
 *
 * https://blog.messengerdevelopers.com/using-the-webview-to-create-richer-bot-to-user-interactions-ed8a789523c6
 *
 */

'use strict';
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Imports dependencies and set up http server
const
    request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    dotenv = require('dotenv').config();
    

var app = express();
var _axios = require('axios');

var _https = require('https');

var _https2 = _interopRequireDefault(_https);


var _axios2 = _interopRequireDefault(_axios);
_axios2.default.defaults.timeout = 6000;

_axios2.default.interceptors.request.use(function (config) {
    config.requestTime = new Date().getTime();
    return config;
}, function (err) {
    return Promise.reject(err);
});

_axios2.default.interceptors.response.use(function (res) {
   // logger.logService({}, res.config, res, res.request.connection);
    return res;
}, function (err) {
    //logger.logService(err, err.config, {}, err.request.connection);
    return Promise.reject(err);
});

app.set('port', process.env.PORT || 5000);
app.use(body_parser.json());
app.use(express.static('public'));

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const SERVER_URL = process.env.SERVER_URL;
const APP_SECRET = process.env.APP_SECRET;

app.listen(app.get('port'), () => {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

// Serve the options path and set required headers
app.get('/options', (req, res, next) => {
    let referer = req.get('Referer');
    if (referer) {
        if (referer.indexOf('www.messenger.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
        } else if (referer.indexOf('www.facebook.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
        }
        res.sendFile('public/options.html', {root: __dirname});
    }
});

app.get('/test',testRes);

async function testRes(req,res){
 var body ={
    channel: "Google_Assistant",
    term: "เช็คยอดเงิน",
    intent: "display",
    method: "message",
    timeout: 10000,
    userId:  "111111111111111111111111111"
  };
  var agent = new _https2.default.Agent({
    rejectUnauthorized: false
  });
  var header={};
  var randomNumber = Math.floor(Math.random() * 1000000 + 1).toString();
  //header['x-api-request-id'] = "QWlzQEFvZy1ham9pYWRwd2Vpdm5wT2g5U0xrZFZKdzYwSkZjOXBpd2VqdmIycG93bg==";
  header['x-api-request-id'] = 'self-' + new Date().getTime() + randomNumber;
  var response = await _axios.post('https://dev-askaunjai.ais.co.th:8443/social-adapter-fe/chatbot', body,{
    httpsAgent: agent,
    headers: header
   })
   console.log(JSON.stringify(response['data']));
   res.json(response['data']['params']['intent']);
} 
// Handle postback from webview
app.get('/optionspostback', (req, res) => {
    let body = req.query;
    let response = {
        "text": `Great, I will book you a ${body.bed} bed, with ${body.pillows} pillows and a ${body.view} view.`
    };

    res.status(200).send('Please close this window to return to the conversation thread.');
    callSendAPI(body.psid, response);
});

// Accepts POST requests at the /webhook endpoint
app.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;
       console.log('Webhook');
    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // parse messaging array
        const webhook_events = body.entry[0];

  // initialize quick reply properties
        let text, title, payload;

  // Secondary Receiver is in control - listen on standby channel
         if (webhook_events.standby) {
             console.log('webhook_events');
            // iterate webhook events from standby channel
            webhook_events.standby.forEach(event => {

              const psid = event.sender.id;
              const message = event.message;

              if (message && message.quick_reply && message.quick_reply.payload == 'take_from_inbox') {
                // quick reply to take from Page inbox was clicked          
                text = 'The Primary Receiver is taking control back. \n\n Tap "Pass to Inbox" to pass thread control to the Page Inbox.';
                title = 'Pass to Inbox';
                payload = 'pass_to_inbox';

                sendQuickReply(psid, text, title, payload);
                HandoverProtocol.takeThreadControl(psid);
              } else {
              
            // Gets the body of the webhook event
                        console.log(webhook_events);
                        let webhook_event = message;
                        console.log(webhook_event);
                        console.log('Message: '+webhook_event.text);
                        // Get the sender PSID
                        let sender_psid = psid;
                        console.log(`Sender PSID: ${sender_psid}`);
              
              }
                

            });   
          }        
          // Bot is in control - listen for messages 
          if (webhook_events.messaging) {             
              
            console.log('webhook_events.messaging');
            // iterate webhook events
            webhook_events.messaging.forEach(event => {      
              // parse sender PSID and message
              const psid = event.sender.id;
              const message = event.message;

              if (message && message.quick_reply && message.quick_reply.payload == 'pass_to_inbox') {
                  console.log('message.quick_reply');
                // quick reply to pass to Page inbox was clicked
                let page_inbox_app_id = 263902037430900;      
               //   let page_inbox_app_id = 689501971423050; 
                text = 'The Primary Receiver is passing control to the Page Inbox. \n\n Tap "Take From Inbox" to have the Primary Receiver take control back.';
                title = 'Take From Inbox';
                payload = 'take_from_inbox';

                sendQuickReply(psid, text, title, payload);
                HandoverProtocol.passThreadControl(psid, page_inbox_app_id);

              } else if (event.pass_thread_control) {
                console.log(event.pass_thread_control);
                // thread control was passed back to bot manually in Page inbox
                text = 'You passed control back to the Primary Receiver by marking "Done" in the Page Inbox. \n\n Tap "Pass to Inbox" to pass control to the Page Inbox.';
                title = 'Pass to Inbox';
                payload = 'pass_to_inbox';

                sendQuickReply(psid, text, title, payload);

             // } else if (message && !message.is_echo) {      
              //  console.log('message.is_echo');
                // default
             //   text = 'Welcome! The bot is currently in control. \n\n Tap "Pass to Inbox" to pass control to the Page Inbox.';
             //   title = 'Pass to Inbox';
             //   payload = 'pass_to_inbox';

             //   sendQuickReply(psid, text, title, payload);
              } else {
                    console.log('else');
                    body.entry.forEach(entry => {

                        // Gets the body of the webhook event
                        let webhook_event = entry.messaging[0];
                        console.log(webhook_event);

                        // Get the sender PSID
                        let sender_psid = webhook_event.sender.id;
                        console.log(`Sender PSID: ${sender_psid}`);

                        // Check if the event is a message or postback and
                        // pass the event to the appropriate handler function
                        if (webhook_event.message) {
                            handleMessage(sender_psid, webhook_event.message);
                           // let message = webhook_event.message.text;

                        } else if (webhook_event.postback) {
                            handlePostback(sender_psid, webhook_event.postback);
                        }

                    });
              
              }

            });
          }
        
        
      

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

    const VERIFY_TOKEN = process.env.TOKEN;

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});


// Handles messages events
async function handleMessage(sender_psid, received_message) {
    let response;  
    var responsePayload = [];
    var text = '';
    // Checks if the message contains text
    if (received_message.text) {
        switch (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase()) {
            case "room preferences":
                response = setRoomPreferences(sender_psid);
                break;
            default:
            let resApi = await callApi('https://dev-askaunjai.ais.co.th:8443/social-adapter-fe/chatbot',{
                channel: "Google_Assistant",
                term: received_message.text,
                intent: "display",
                method: "message",
                timeout: 10000,
                userId: '11111111111111'
              });
                console.log(JSON.stringify(resApi['data']['data']['message'][0]));
                            
                
                let responseReply;
                let responseOption;
                let responseData = resApi.data;
                let responseStatusCode = responseData['statusCode'];
                console.info(`Status Code ${responseStatusCode}`);
                if(responseStatusCode === '20000'){
                    let responseParams = responseData['params'];
                    let messageDataObj = responseData['data'];
                    let intentData  =responseParams['intent'];
                   
                    console.info(`intent : ${responseParams['intent']}  and method : ${responseParams['method']}`);
                    var intentTagData = responseParams['intentTag'];
                    if(intentTagData.toLocaleUpperCase().indexOf("CHECK")>-1){
                        intentData = 'check';
                    }
                    if(received_message.text === 'Agent'){
                        intentData = 'transfer';
                    }
                    switch (intentData) {
                        case 'display':
                            responseReply = JSON.parse(replyDisplay(messageDataObj));
                            console.log(responseReply);
                            if(responseReply['Option'] !== undefined) {
                                console.log(responseReply['Option'][0]);
                                responseOption = responseReply['Option'][0];                      
                       
                             text = responseOption['msgTitle']
                             if(responseOption['msgOption'] !== undefined) {
                                  const msgOption = responseOption['msgOption'];   
                                  msgOption.Data.forEach(res => {                                  
                                             var payload = {
                                                     content_type: 'text',
                                                     title: `${res}`,
                                                     payload: `${res}`
                                               }
                                            responsePayload.push(payload);
                                    }); 
                              }   
                            }
                            break;
                        case 'ir':
                             console.info("in ir intent");
                             text = "Ir";  
                             break;
                        case 'transfer':
                             console.info("in transfer intent");
                             text = "transfer";  
                             passThreadControl(sender_psid,'689501971423050');
                             break;
                        case 'ontop':
                            console.info("in ontop intent");
                            text = "อุ่นใจยังไม่ได้ให้บริการผ่านช่องทางนี้ครับ สามารถใช้ผ่านช่องทางอื่นได้ที่นี่ <a href=\"https://goo.gl/RT5cMp\" target=\"_blank\" data-vtz-browse=\"https://goo.gl/RT5cMp\" data-vtz-link-type=\"Web\">";  
                            break;
                        case 'check':
                              var methodName = intentTagData.split('_').pop();
                              if(methodName.toLocaleUpperCase()==='BALANCE'){
                                     text = "อุ่นใจยังไม่ได้ให้บริการผ่านช่องทางนี้ครับ สามารถใช้ผ่านช่องทางอื่นได้ที่นี่ <a href=\"https://goo.gl/RT5cMp\" target=\"_blank\" data-vtz-browse=\"https://goo.gl/RT5cMp\" data-vtz-link-type=\"Web\">";  
                              }else if(methodName.toLocaleUpperCase()==='BALANCEINTERNET'){
                                     text = "อุ่นใจยังไม่ได้ให้บริการผ่านช่องทางนี้ครับ สามารถใช้ผ่านช่องทางอื่นได้ที่นี่ <a href=\"https://goo.gl/RT5cMp\" target=\"_blank\" data-vtz-browse=\"https://goo.gl/RT5cMp\" data-vtz-link-type=\"Web\">";  
                              }else{
                                //text = replyDisplay(messageDataObj);
                                    responseReply = JSON.parse(replyDisplay(messageDataObj));
                                    console.log(responseReply);
                                    if(responseReply['Option'] !== undefined) {
                                        console.log(responseReply['Option'][0]);
                                        responseOption = responseReply['Option'][0];                       
                                     console.log(responseOption['msgOption']);
                                     console.log(responseOption['msgTitle']);
                                      if(responseOption['msgOption'] !== undefined) {
                                           const msgOption = responseOption['msgOption'];   
                                            msgOption.Data.forEach(res => {                                  
                                            var payload = {
                                                     content_type: 'text',
                                                     title: `${res}`,
                                                     payload: `${res}`
                                               }
                                            responsePayload.push(payload);
                                             });                                                                                     
                                         }
                                     text = responseOption['msgTitle']
                                    }
                                 //conv.ask(this.TEXT.SERVICE_ERROR);
                              }
                            break;
                        // case 'gsso':
                        //     break;
                        case 'authenticate':
                            break;
                        default:
                            console.info("in default switch case");
                            // text = replyDisplay(messageDataObj);
                               responseReply = JSON.parse(replyDisplay(messageDataObj));
                                    console.log(responseReply);
                                    if(responseReply['Option'] !== undefined) {
                                        console.log(responseReply['Option'][0]);
                                        responseOption = responseReply['Option'][0];                       
                                     console.log(responseOption['msgOption']);
                                     console.log(responseOption['msgTitle']);
                                      if(responseOption['msgOption'] !== undefined) {
                                           const msgOption = responseOption['msgOption'];   
                                            msgOption.Data.forEach(res => {                                  
                                            var payload = {
                                                     content_type: 'text',
                                                     title: `${res}`,
                                                     payload: `${res}`
                                               }
                                            responsePayload.push(payload);
                                             });                                                                                     
                                         }
                                     text = responseOption['msgTitle']
                                    }
                            break;
                    }
                }else{
                    text = "Error Something wrong";
                }

                text = urlify(text);
                if(responsePayload.length > 0) {
                    response = {
                     //   "text": `${urlify(resApi['data']['data']['message'][0])}.`
                       "text": `${text}` ,
                         /*quick_replies: [{
                                content_type: 'text',
                                title: 'next',
                                payload: 'next'
                        }]*/
                        quick_replies: responsePayload
                    };
                } else {
                    response = {
                     //   "text": `${urlify(resApi['data']['data']['message'][0])}.`
                       "text": `${text}`                   
                    };
                }
                break;
        }
    } else {
        response = {
            "text": `Sorry, I don't understand what you mean.`
        }
    }

    // Send the response message
    callSendAPI(sender_psid, response);
}

async function callApi(url,objParams){
   return  _axios.post(url, getBody(objParams),getHeader());  
} 
function modifyMessage(messages){
            let results = {};
           for(var message of messages){
                if(message.indexOf("{{msgSelect:")>-1){
                    results['msgSelect']= message.substring(message.indexOf('{{msgSelect:') +
                                  12, message.indexOf('}}'));
                    console.info(results['msgSelect']);
                }else if(message.indexOf('{{msgMore:') > -1 ){
                            results['msgMore']  = message.substring(message.indexOf('{{msgMore:') +
                                          10, message.indexOf('}}'));
                            console.info(results['msgMore']);
                      }else{
                             results['message'] = message;
                             console.info(results['message']);
                           }
            }
            return results;    
}
function replyDisplay(messageDataObj){
            var o = {} // empty Object
            var key = 'Data';
            o[key] = []; // empty Array, which you can push() values into         
      
            var o2 = {} // empty Object
            var key2 = 'Option';
            o2[key2] = []; // empty Array, which you can push() values into  
    
             var text;
             var text2;
             let messageObj = modifyMessage(messageDataObj['message']);
          
             if(messageDataObj['msgParam'] !== undefined && 
                messageDataObj['msgParam']['msgSelect'] !== undefined &&
                messageObj['msgSelect']!==undefined){
                    let msgSelects = [];
                    for(var msgSelectObj of messageDataObj['msgParam']['msgSelect']){
                        if(msgSelectObj['title'] !== undefined) {
                            text = msgSelectObj['title'];
                           }
                        else {
                            text = msgSelectObj['payload'];                             
                           }
                           o[key].push(text);
                    }                   
                           text2 = { msgOption : o,
                                    msgTitle : messageObj['msgSelect']
                                  };              
                           o2[key2].push(text2);
                    //return    text +' ' + messageObj['msgSelect'];   
                      return JSON.stringify(o2);
             }else if(messageDataObj['msgParam'] !== undefined && 
                      messageDataObj['msgParam']['msgMore'] !== undefined &&
                      messageObj['msgMore']!==undefined){              
                       text2 = {  msgTitle : messageObj['msgMore']  };              
                       o2[key2].push(JSON.stringify(text2));          
                      return JSON.stringify(o2);                    
            }else if(messageObj['message']!==undefined){                     
                        text2 = {  msgTitle : messageObj['message']  };              
                       o2[key2].push(text2);          
                      return JSON.stringify(o2);  
            }else{          
                       text2 = {  msgTitle : 'อุ่นใจไม่ตอบสนองกรุณาลองใหม่ภายหลัง'  };              
                       o2[key2].push(text2);          
                      return JSON.stringify(o2);  
            }
}


function getBody(objParams){
    return {
        channel: objParams.channel,
        term: objParams.term,
        intent: objParams.intent,
        method: objParams.method,
        timeout: objParams.timeout,
        userId: objParams.userId
      };
}

function getHeader(){
      var agent = new _https2.default.Agent({
        rejectUnauthorized: false
      });
      var header={};
      var randomNumber = Math.floor(Math.random() * 1000000 + 1).toString();
      header['x-api-request-id'] = 'self-' + new Date().getTime() + randomNumber;
    return {
        httpsAgent: agent,
        headers: header
    }
}

// Define the template and webview
function setRoomPreferences(sender_psid) {
    let response = {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: "OK, let's set your room preferences so I won't need to ask for them in the future.",
                buttons: [{
                    type: "web_url",
                    url: SERVER_URL + "/options",
                    title: "Set preferences",
                    webview_height_ratio: "compact",
                    messenger_extensions: true
                }]
            }
        }
    };

    return response;
}

// Sends response messages via the Send API

function urlify(text) {
  //  var urlRegex = /(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/g;
   // var urlRegex =/(^|[^\/])(www\.[\S]+(\b|$))/gim;
   var urlRegex = /(?:(?:https?|ftp):\/\/|\b(?:[a-z\d]+\.))(?:(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))?\))+(?:\((?:[^\s()<>]+|(?:\(?:[^\s()<>]+\)))?\)|[^\s`!()\[\]{};:'".,<>?""''=]))?/g
    var urlFull = '';
    console.log('urlify '+text);
    return  text.replace(urlRegex, function(url) {
        urlFull = url;
        console.log('urlFull:'+urlFull);
        return   url;
    }).concat(' '+urlFull).replace(/<[^>]+>/g, '')
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };
    console.log(request_body);
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": PAGE_ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

// Send a quick reply message
function sendQuickReply(psid, text, title, postback_payload) {
  
  console.log('SENDING QUICK REPLY');
  
  let payload = {};
  
  payload.recipient = {
    id: psid
  }

  payload.message = {
    text: text,
    quick_replies: [{
        content_type: 'text',
        title: title,
        payload: postback_payload
    }]    
  }

  call('/messages', payload, () => {});
}

function passThreadControl (userPsid, targetAppId) {
  console.log('PASSING THREAD CONTROL')
  let payload = {
    recipient: {
      id: userPsid
    },
    target_app_id: targetAppId
  };

  call('/pass_thread_control', payload, () => {});
}

function takeThreadControl (userPsid) {
  console.log('TAKING THREAD CONTROL')
  let payload = {
    recipient: {
      id: userPsid
    }
  };

  call('/take_thread_control', payload, () => {});
}

function call (path, payload, callback) {
  const access_token = process.env.PAGE_ACCESS_TOKEN || env.PAGE_ACCESS_TOKEN;
  const graph_url = 'https://graph.facebook.com/me';

  if (!path) {
    console.error('No endpoint specified on Messenger send!');
    return;
  } else if (!access_token || !graph_url) {
    console.error('No Page access token or graph API url configured!');
    return;
  }

  request({
    uri: graph_url + path,
    qs: {'access_token': access_token},
    method: 'POST',
    json: payload,
  }, (error, response, body) => {
    console.log(body)
    
    if (!error && response.statusCode === 200) {
      console.log('Message sent succesfully');
    } else {
      console.error('Error: ' + error);        
    }
    callback(body);
  });
};



app.post('/ThreadControl', (req, res) => {
   let body = req.body;
  
    // Parse params from the webhook verification request
    //let mode = req.query['hub.mode'];
    //let token = req.query['hub.verify_token'];
    //let challenge = req.query['hub.challenge'];
   
   if (body.recipientId !== undefined && (body.term  === 'exit' || body.term === 'end')) {
         recipientToPrime(body.recipientId , body.term);
        // Check the mode and token sent are correct      
            console.log('WEBHOOK_BACK_TO_PRIME');
            res.status(200).send(JSON.stringify('{STATUS:OK,MESSAGE:WEBHOOK_BACK_TO_PRIME}'));

    } else if(body.recipientId !== undefined && body.term  !== undefined && body.method  === 'forback') {
         let response;
         var text = '';     
         response = {
                 //   "text": `${urlify(resApi['data']['data']['message'][0])}.`
                   "text": `${body.term}` 
                };
            callSendAPI(body.recipientId, response);
            res.status(200).send(JSON.stringify('{STATUS:OK,MESSAGE:WEBHOOK_SEND_TO_MESSAGE}'));
    } else {
      res.sendStatus(403);
    }
   
});

function recipientToPrime(userPsid){

     takeThreadControl(userPsid);   
  
} 

