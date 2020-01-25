//Express imports
const http = require('http');
const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json())

const server = http.createServer(app); // this is new
const io = require('socket.io').listen(server);

//MongoDB imports
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = mongoose.connection;
const url = 'mongodb+srv://user:4g5l5DkljpG5iNsJ@chatroom-pqfv4.mongodb.net/test?retryWrites=true';
mongoose.connect(url, {useNewUrlParser: true});
mongoose.set('useFindAndModify', false);


// Socket io
io.sockets.on('connection', function(socket){
    // clients emit this when they join new rooms
    socket.on('join', function(roomName, nickname, uid, callback){
        if (socket.room !== undefined) {
          socket.leave(socket.room)
          if (io.nsps['/'].adapter.rooms[socket.room] !== undefined) {
            var users = []
            for (socketID in io.nsps['/'].adapter.rooms[socket.room].sockets) {
              const nickname = io.nsps['/'].connected[socketID].nickname;
              const uid = io.nsps['/'].connected[socketID].uid;
              users.push({nickname: nickname, uid: uid})
            }
            io.sockets.in(socket.room).emit('userjoined', users);
          }
        }
        socket.join(roomName); // this is a socket.io method
        socket.room = roomName;
        socket.nickname = nickname; // yay JavaScript! see below
        socket.uid = uid;
        console.log("joining " + roomName + " " + nickname)
        // get a list of messages currently in the room, then send it back
        Chatroom.find({ _id: roomName}, 'messages',
          function(error, result) {
            if (error) console.log(error)
            if (result[0] === undefined) console.log('Not found');
            const messages = result[0];
            callback(messages);
        }).exec();

        //CLIENTS HERE
        var users = []
        for (socketID in io.nsps['/'].adapter.rooms[roomName].sockets) {
          const nickname = io.nsps['/'].connected[socketID].nickname;
          const uid = io.nsps['/'].connected[socketID].uid;
          users.push({nickname: nickname, uid: uid})
        }
        io.sockets.in(roomName).emit('userjoined', users);
    });

    // this gets emitted if a user changes their nickname
    socket.on('nickname', function(nickname){
        socket.nickname = nickname;
        // broadcast update to room! (see below)
    });

    socket.on('newroom', function(room){
        io.sockets.emit('newroom', room)
    });

    socket.on('changename', function(name, uid, roomName){
      for (socketID in io.nsps['/'].adapter.rooms[roomName].sockets) {
        const socketuid = io.nsps['/'].connected[socketID].uid;
        if (socketuid === uid) {
          io.nsps['/'].connected[socketID].nickname = name
        }
      }
      var users = []
      for (socketID in io.nsps['/'].adapter.rooms[roomName].sockets) {
        const nickname = io.nsps['/'].connected[socketID].nickname;
        const uid = io.nsps['/'].connected[socketID].uid;
        users.push({nickname: nickname, uid: uid})
      }
      io.sockets.in(roomName).emit('userjoined', users);
      io.sockets.emit('changename', name, uid)
    });

    // the client emits this when they want to send a message
    socket.on('message', function(idfrom, nickname, message, time, roomid){
        io.sockets.emit('message', idfrom, nickname, message, time, roomid);
        console.log("Distributing message")
    });

    socket.on('dm', function(idto, idfrom, nickname, message, time){
        const roomName = Object.keys(io.sockets.adapter.sids[socket.id])[1];
        io.sockets.in(roomName).emit('dm', idto, idfrom, nickname, message, time);
        console.log("Distributing message")
    });

    // the client emits this when people are typing
    socket.on('typing', function(name, userid){
        const roomName = Object.keys(io.sockets.adapter.sids[socket.id])[1];
        io.sockets.in(roomName).emit('typing', name, userid);
    });

    // the client emits this when people are typing
    socket.on('stoptyping', function(name){
        const roomName = Object.keys(io.sockets.adapter.sids[socket.id])[1];
        io.sockets.in(roomName).emit('stoptyping', name);
    });

    socket.on('active', function(uid){
        const roomName = Object.keys(io.sockets.adapter.sids[socket.id])[1];
        io.sockets.in(roomName).emit('active', uid);
    });

    socket.on('inactive', function(uid){
        const roomName = Object.keys(io.sockets.adapter.sids[socket.id])[1];
        io.sockets.in(roomName).emit('inactive', uid);
    });

    // the client disconnected/closed their browser window
    socket.on('disconnect', function(){
        socket.leave(socket.room)
        if (io.nsps['/'].adapter.rooms[socket.room] !== undefined) {
          var users = []
          for (socketID in io.nsps['/'].adapter.rooms[socket.room].sockets) {
            const nickname = io.nsps['/'].connected[socketID].nickname;
            const uid = io.nsps['/'].connected[socketID].uid;
            users.push({nickname: nickname, uid: uid})
          }
          io.sockets.in(socket.room).emit('userjoined', users);
        }
    });

    // an error occured with sockets
    socket.on('error', function(){
        // Don't forget to handle errors!
        // Maybe you can try to notify users that an error occured and log the error as well.
    });

});

// Creating schemas
const message = new mongoose.Schema({
  nickname: String,
  message: String,
  datetime: Number,
});
const Message = mongoose.model('Message', message);

const chatroom = new mongoose.Schema({
  _id: String,
  messages: []
});
const Chatroom = mongoose.model('Chatroom', chatroom);

// Error handling
db.on('error', console.error);

// Process is a global object referring to the system process running
process.on('SIGINT', function() {
   mongoose.connection.close(function () {
       console.log('DB connection closed by Node process ending');
       process.exit(0);
   });
});


// Express REST endpoints
app.post('/api/chatroom', async (req,res) => {

  // Hex ID generator
  function generateRoomIdentifier() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++)
      result += chars[(Math.floor(Math.random() * chars.length))];
    return result;
  }

  // Chunk to set ID
  let ident = generateRoomIdentifier();
  let unique = false;
  while(!unique) {
    // Check if room exists
    await Chatroom.findById(ident, function (err, room) {
      if (err) {
        console.log(err);
      } else {
        if(room === null) {
          console.log("Accepting name of " + ident);
          unique = true;
        } else {
          console.log("Retrying naming of " + ident);
          ident = generateRoomIdentifier();
        }
      }
    })
  }

  // Create Room
  let room = new Chatroom({
    _id: ident,
    messages: []
  })

  // Upload Room
  console.log("uploading")
  await room.save(function(err, data) {
    if (err) return console.error(err);
    console.log(data);
  });

  // Send new room ID
  res.send({"_id": ident, "messages": []});
});

// Posting message
app.post('/api/message', (req,res) => {

  // Create message from request
  let message = new Message({
    nickname: req.body.nickname,
    message: req.body.message,
    datetime: req.body.datetime,
  })

  // Add message to the chatroom array
  Chatroom.findOneAndUpdate(
   {_id: req.body.room},
   { $push: {
             messages: message
             }
   },
   function(err, res) {
     if (err) console.log(err)
     console.log(res)
   })

   // End async
   res.send(JSON.stringify(message));
 });

// Fetch Messages
app.get('/api/messages', (req,res) => {
  Chatroom.find({ _id: req.query.room}, 'messages',
  function(error, result) {
    if (error) console.log(error)
    if (result[0] === undefined) res.status(404).send('Not found');
    res.send(JSON.stringify(result[0]));
  }).exec();
});

app.get('/api/chatrooms', (req,res) => {
  Chatroom.find({}, function(error, result) {
    if (error) console.log(error)
    res.send(JSON.stringify(result));
  }).exec();
});

// Default case
app.get('*', (req,res) => {
    console.log("404")
});
const port = 5000;
server.listen(port);
console.log('App is listening on port ' + port);
