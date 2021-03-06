//Express imports
const express = require('express');
const path = require('path');
const http = require("http");
const app = express();
const socketIo = require("socket.io");

app.use(express.static(path.join(__dirname, 'client/build')));

//MongoDB imports
const mongoose = require('mongoose');
const db = mongoose.connection;
const url = 'mongodb+srv://user:4g5l5DkljpG5iNsJ@chatroom-pqfv4.mongodb.net/test?retryWrites=true';
mongoose.connect(url, {useNewUrlParser: true});

//Socket.IO:
const server = http.createServer(app);
const io = socketIo(server);


io.sockets.on('connection', function(socket){
  console.log("new client")
  socket.on('join', function(roomname) {
    console.log("Test")
    socket.join(roomname)
  })
  socket.on('create', function() {
    let id = Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5)
    socket.join(id)
    socket.emit('createcallback', id)
  });
  socket.on('question', function(question, roomname) {
    let id = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8)
    io.sockets.in(roomname).emit('messagesent', question, id);
  });
  socket.on('vote', function(id, roomname) {
    io.sockets.in(roomname).emit('votesent', id);
  });
})


// Creating schemas
const mySchema = new mongoose.Schema({
  name: String,
  content: String
});
const MySchema = mongoose.model('MySchema', mySchema);

// Error handling
db.on('error', console.error);

// Function on db open
db.once('open', function() {
  //Create post
  const myData = new MySchema({
    name: "data",
    content: "This is another lovingly constructed Boilerplate ^_^ made with a React frontent with react-router-dom and an express and mongoose backend"
  });

  //Upload Post
  myData.save(function(err, data) {
    if (err) return console.error(err);
    console.log(data);
  });

  console.log("Connected to DB");
});

// Process is a global object referring to the system process running
process.on('SIGINT', function() {
   mongoose.connection.close(function () {
       console.log('DB connection closed by Node process ending');
       process.exit(0);
   });
});

// Express REST endpoints
app.get('/api/getRes', (req,res) => {
    MySchema.findOne({}, function (err, post) {
      if (err) return console.error(err);
      res.json(post.content);
    });
});

app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/client/build/404.html'));
});

const port = process.env.PORT || 5000;
server.listen(port);
console.log('App is listening on port ' + port);
