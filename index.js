"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { v4: uuidv4 } = require('uuid');
const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
var clients = [];
class Client {
    constructor(socket, uuid) {
        socket.on("message", message => { this.message_handler(message); });
        socket.on("disconnect", () => { this.close_handler(); });
        this.socket = socket;
        this.uuid = uuid;
    }
    send(pkg) {
        this.socket.send(JSON.stringify(pkg));
    }
    request_sdp(recipient_uuid) {
        this.socket.send(JSON.stringify({
            type: "generate sdp",
            recipient: this.uuid,
            sender: recipient_uuid,
            connection_id: uuidv4()
        }));
    }
    message_handler(message) {
        if (typeof (message) === 'string') {
            //l,;l;,,console.log(message);
            var pkg = JSON.parse(message);
            if (pkg.type === 'sdp') {
                console.log("Recieved SDP");
                var remote_client = get_client(pkg.recipient);
                if (remote_client != null) {
                    console.log("Sending SDP " + pkg.sdp.type + " to remote client.");
                    remote_client.send(pkg);
                }
                else {
                    console.log("Remote client UUID not found.");
                }
            }
            else if (pkg.type == 'presence') {
                for (var i = 0; i < clients.length; i++) {
                    if (clients[i] != this) {
                        clients[i].request_sdp(this.uuid);
                    }
                }
            }
        }
    }
    close_handler() {
        var index = clients.indexOf(this);
        if (index > -1) {
            clients.splice(index, 1);
        }
        // clients.map(client => this.send({
        //     type: 'close',
        //     remote_id: this.uuid
        // }))
        console.log("Closing connection");
    }
}
function get_client(uuid) {
    // This will be a linear search for now. This will be converted to a binary search.
    for (var i = 0; i < clients.length; i++) {
        if (uuid === clients[i].uuid) {
            return clients[i];
        }
    }
    return null;
}
io.on('connection', (socket) => {
    var client_uuid = uuidv4();
    var uuid_pkg = {
        type: 'uuid',
        uuid: client_uuid
    };
    socket.send(JSON.stringify(uuid_pkg));
    var client = new Client(socket, client_uuid);
    console.log("There are " + clients.length + " clients connected.");
    for (var i = 0; i < clients.length; i++) {
        clients[i].request_sdp(client_uuid);
    }
    clients.push(client);
});
http.listen(8080, "192.168.0.60", () => console.log("Listening on 192.168.0.61:8080"));
//# sourceMappingURL=index.js.map