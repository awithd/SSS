#!/usr/bin/env node
const crypto = require('crypto');
var WebSocketServer = require('websocket').server;
var http = require('http');
const sjson = require('secure-json-parse');

function isString (input) {  
  return typeof input === 'string' && Object.prototype.toString.call(input) === '[object String]'
}

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    //response.writeHead(404);
    //response.end();
});
server.listen(5845, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var client_manager = [ ];
var server_manager = [ ];

wsServer.on('request', function(request) {

	var connection = request.accept('echo-protocol', request.origin);

    connection.on('message', function(message) {
	    console.log(message);
	    var data;
	    try{
			var data = sjson.parse(message.utf8Data, { protoAction: 'remove', constructorAction: 'remove' });

			if (typeof data.t !== 'undefined') {
				if(data.t>-1 && data.t<5){

					switch(data.t) { 
						case 0: 
			                connection.name = crypto.randomBytes(20).toString('hex');
			                server_manager[connection.name] = connection;
			                server_manager[connection.name].peerCount = 0;
			                var msg = { 
			                    t: 0, 
			                    n: connection.name, 
			                    s: 1 
			                };
			                server_manager[connection.name].sendUTF(JSON.stringify(msg));
							break;

						case 1: 
			                //if anyone is logged in with this username then refuse 
			                var msg;
			                connection.name = crypto.randomBytes(20).toString('hex');  
			                client_manager[connection.name] = connection;
			                var msg = { 
			                    t: 1, 
			                    n: connection.name, 
			                    s: true 
			                };
			                client_manager[connection.name].sendUTF(JSON.stringify(msg));
			                break;

						case 2: 
							var d = 100, g;
							
							Object.keys(server_manager).forEach(function(x){
								if(d>server_manager[x].peerCount){
									g = x;
									d = server_manager[x].peerCount;
								}
							});
							server_manager[g].peerCount++;

							if(server_manager[g] != null) { 
								server_manager[g].sendUTF(message.utf8Data);
							}
							
							break;
						case 3: 
							if(typeof data.n !== 'undefined' ) {
								if(isString(data.n)){
									if(data.n.length==40){
										client_manager[data.n].sendUTF(message.utf8Data);
									}
								}
							}
							break; 
						case 4: 
							if(typeof data.n !== 'undefined' ) {
								if(isString(data.n)){
									if(data.n.length==40){
										if(typeof(client_manager[data.n]) !== 'undefined') { 
											var conn = client_manager[data.n];  
											if(client_manager[data.n] != null) { 
												client_manager[data.n].sendUTF(message.utf8Data);
											} 
										}
									}
								}

							}
							
							
			            	break;
					}
				}
			}
		} catch (err){
			console.log(err);
		}
    	//var utf8Data = message.utf8Data;
		//var data = utf8Data.split("*");



		
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});