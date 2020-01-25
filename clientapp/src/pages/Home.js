import posed from "react-pose";
import React, { Component } from 'react';
import Message from '../components/Message'
import { Redirect } from 'react-router-dom';
import moment from 'moment';
import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:5000');

var uniqid = require('uniqid');

// Animate
const UserList = posed.div({
  expanded: {right: "0px"},
  hidden: {right: "-251px"}
})

const MessageList = posed.div({
  expanded: {right: "-1px", left: null},
  hidden: {left: "-100%", right: null}
})

class Home  extends Component {
  constructor(props) {
    super(props)
    this.state = {
      nickname: "",
      nicknameset: false,
      message: "",
      messages: [],
      error: false,
      rooms: [],
      userid: uniqid(),
      userlist: [],
      listshown: false,
      typing: [],
      userchat: [],
      changeNameVisible: false,
      messagesshown: false,
      awaytimer: setInterval(() => {socket.emit('inactive', this.state.userid)}, 6000),
      inactive: [],
      chattingwith: {nickname: null, uid: null, messages: []},
    }

    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChangeSubmit = this.handleChangeSubmit.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handlePost = this.handlePost.bind(this);
  }

  // Component mount pulls messages
  componentDidMount() {
    socket.on('message', (idfrom, nickname, message, time, roomid) => {
      var i
      for(i = 0; i < this.state.rooms.length; i++) {
        if (this.state.rooms[i]._id === roomid) {
          if (idfrom !== this.state.userid) {
            if (roomid === this.props.match.params.room) {
              this.setState({messages: [...this.state.messages,
                {message: message,
                nickname: nickname,
                datetime: time,
                room: this.props.match.params.room}]})
            }
          let copy = this.state.rooms.slice()
          copy[i].messages.push({message: message,
          nickname: nickname,
          datetime: time,
          room: this.props.match.params.room})
          this.setState({rooms: copy})
          this.scrollToBottom()
        }
      }
    }
    });

    socket.on('dm', (idto, idfrom, nickname, message, time) => {
      console.log(message)
      if ((idto === this.state.userid)) {
        var i
        var copy = this.state.userchat.slice()
        for (i = 0; i < this.state.userchat.length; i++) {
          if (this.state.userchat[i].uid === idfrom) {
            copy[i].messages.push({
              message: message,
              nickname: nickname,
              datetime: time,
              room: this.props.match.params.room
            })
            this.setState({userchat: copy})
          }
        }
      }
    });

    socket.on('userjoined', (ul) => {
      this.addUserToChat(ul)
      this.setState({userlist: ul})
    });

    socket.on('newroom', (room) => {
      this.setState({rooms: [...this.state.rooms, room]});
    });

    socket.on('changename', (name, uid) => {
      var j;
      for (j = 0; j < this.state.userchat.length; j++) {
        if (this.state.userchat[j].uid === uid) {
          let copy = this.state.userchat.slice()
          copy[j].nickname = name
          this.setState({userchat: copy})
        }
      }
    });

    socket.on('active', (uid) => {
      let index = this.state.inactive.indexOf(uid)
      if (index > -1) {
         this.state.inactive.splice(index, 1)
      }
    });

    socket.on('inactive', (uid) => {
      if (this.state.inactive.indexOf(uid) < 0) {
        this.setState({inactive: [...this.state.inactive, uid]})
      }
    });

    socket.on('typing', (name, userid) => {
      if ((this.state.typing.indexOf(name) < 0) && (this.state.userid !== userid)) {
        this.setState({typing: [...this.state.typing, name]})
        this.scrollToBottom()
      }
    });

    socket.on('stoptyping', (name) => {
      let index = this.state.typing.indexOf(name)
      var copy = this.state.typing.slice()
      if (index > -1) {
        console.log("Delete")
        console.log(copy.splice(index, 1))
        this.setState({typing: copy.splice(index, 1)})
      }
      console.log(this.state.typing)
    });

    fetch('/api/chatrooms', {method: 'GET'})
    .then((res) => res.json())
    .then((room) => {
      this.setState({rooms: room});
    })
    if(this.props.match.params.room !== undefined){
      this.getMessages();
    }
  }

  addUserToChat(ul) {
    console.log(ul)
    var i;
    var j;
    for (i = 0; i < ul.length; i++) {
      var y = false
      for (j = 0; j < this.state.userchat.length; j++) {
        if (this.state.userchat[j].uid === ul[i].uid) y = true
      }
      if (!y && this.state.userid !== ul[i].uid) {
        this.setState({userchat: [...this.state.userchat, {nickname: ul[i].nickname, uid: ul[i].uid, messages: []}]})
      }
    }
  }

  // Calls creation of new room
  makeRoom() {
    this.setState({messages: [], message: ""})
    this.setState({userchat: [], chattingwith: {nickname: null, uid: null, messages: []}})
    socket.emit('disconnect');
    fetch('/api/chatroom', {method: 'POST'})
    .then((res) => res.json())
    .then((room) => {
      this.props.history.push('/' + room._id);
      socket.emit('newroom', room);
      if (this.state.nickname !== ""){
        this.joinRoom(room._id, this.state.nickname)
      }
    })
  }

  markActive() {
    console.log(this.state.typing)
    socket.emit('active', this.state.userid);
    clearInterval(this.state.awaytimer)
    this.setState({awaytimer: setInterval(() => {socket.emit('inactive', this.state.userid)}, 6000)})
  }

  // Message pull function
  getMessages() {
    fetch('/api/messages/?room=' + this.props.match.params.room , {method: 'GET'})
    .then((res) =>
      {if(res.status === 404) {
        this.setState({error: true})
      } else {res.json()
        .then((json) => this.handleData(json.messages))}})
  }

  // Insert results into message state
  handleData(newData) {
    this.setState({messages: newData});
  }

  joinRoom(room, nickname) {
    socket.emit('join', room, nickname, this.state.userid, (messages) => {
        this.setState({messages: messages.messages});
        this.scrollToBottom()
    })
    this.markActive()
  }

  handleTextChange(event) {
   this.setState({nickname: event.target.value});
   this.markActive()
  }

  convertTime(date1) {
    let date = new Date(date1)
    let ret = moment(date).format("LT")
    return ret;
  }

  toggleUserList() {
    this.setState({listshown: !this.state.listshown})
    this.markActive()
  }

  changeName() {
    if(this.state.nickname !== "") {
      this.setState({changeNameVisible: true})
    }
  }

  toggleMessageList() {
    socket.emit('stoptyping', this.state.nickname);
    this.setState({messagesshown: !this.state.messagesshown})
    console.log(this.state.messagesshown)
    this.markActive()
  }

  handleSubmit(event) {
    this.setState({nicknameset: true});
    event.preventDefault();
    if(this.state.nickname === "") {
      this.setState({nickname: "Anonymous"})
      this.joinRoom(this.props.match.params.room, "Anonymous")
    } else {
      this.joinRoom(this.props.match.params.room, this.state.nickname)
    }
    this.markActive()
  }

  handleChangeSubmit(event) {
    event.preventDefault();
    this.setState({nicknameset: true});
    if(this.state.nickname === "") {
      this.setState({nickname: "Anonymous"})
      socket.emit('changename', "Anonymous", this.state.userid, this.props.match.params.room);
    } else {
      socket.emit('changename', this.state.nickname, this.state.userid, this.props.match.params.room);
    }
    this.setState({changeNameVisible: false})
    this.markActive()
  }

  handleMessageChange(event) {
    if (!this.state.messagesshown) {
      if(event.target.value === "") {
       socket.emit('stoptyping', this.state.nickname);
      } else {
       socket.emit('typing', this.state.nickname, this.state.userid);
      }
      this.setState({message: event.target.value});
      this.markActive()
    } else {
        this.setState({message: event.target.value});
        this.markActive()
    }
  }

  chatwith(user) {
    this.setState({chattingwith: user})
    this.markActive()
  }

  scrollToBottom() {
    let list = document.querySelector('.messageContainer');
    list.scrollTop = list.scrollHeight;
  }

  // Sends post request with message state
  handlePost(event) {
    event.preventDefault();
    if (this.state.messagesshown && this.state.chattingwith.uid !== null) {
      socket.emit('dm', this.state.chattingwith.uid, this.state.userid, this.state.nickname, this.state.message, (new Date()).getTime());
      this.state.chattingwith.messages.push({
      message: this.state.message,
      nickname: this.state.nickname,
      datetime: (new Date()).getTime(),
      room: this.props.match.params.room,
      mypost: true})
      this.setState({message: ""});
    } else if (!this.state.messagesshown) {
      socket.emit('message', this.state.userid, this.state.nickname, this.state.message, (new Date()).getTime(), this.props.match.params.room);
      if(this.state.message !== ""){
      fetch('/api/message',
        {method: 'POST',
         headers: {
                    "Content-Type": "application/json",
                    },
         body: JSON.stringify({
            message: this.state.message,
            nickname: this.state.nickname,
            datetime: (new Date()).getTime(),
            room: this.props.match.params.room,
          })})
      .then((res) => res.json())
      .then((json) => {
        json.mypost = true
        this.setState({messages: [...this.state.messages, json]})
        var i
        for(i = 0; i < this.state.rooms.length; i++) {
          console.log(this.state.rooms[i]._id)
          if (this.state.rooms[i]._id === this.props.match.params.room) {
            let copy = this.state.rooms.slice()
            copy[i].messages.push(json)
            this.setState({rooms: copy})
          }
        }
        this.scrollToBottom()
      })
      this.setState({message: ""});
      socket.emit('stoptyping', this.state.nickname);
      }
    }
    this.markActive()
  }

  renderMessages() {
    const listUsers = this.state.userchat.map((item, index) =>
      <div className="userchat" style={{backgroundColor: ((this.state.chattingwith.uid !== null) && (this.state.chattingwith.uid === item.uid)) ? "#f2f2f2" : "white"}} key={index} onClick={() => this.chatwith(item)}>
        <div style={{width: "80%", overflow: "hidden", textOverflow: "ellipsis", maxLines: 1, height: "30px", overflow: "hidden"}}>
        {item.nickname}
        </div>
        <div style={{width: "80%", overflow: "hidden", textOverflow: "ellipsis", fontSize: "14px", fontWeight: "300"}}>
          {item.messages.length === 0 ? "No messages" : item.messages[item.messages.length - 1].message}
        </div>
      </div>
    );

    const noUsers = (
      <div style={{display: "flex", width: "100%", height: "100%", justifyContent: "center", alignItems: "center"}}>
        No users online
      </div>
    );
    const listMessages = this.state.chattingwith.messages.map((item, index) =>
      <Message item={item} key={index} user={this.state.nickname} />
    );
    return (
      <div style={{display: "flex", width: "100%", height: "100%"}}>
        <div className="messagemenu">
        {this.state.userchat.length === 0 ? noUsers : listUsers}
        </div>
        <div className="messagebody">
        <div style={{marginTop: "6px"}}>
        {listMessages}
        </div>
        </div>
      </div>
    )
  }

  rendercontent() {
    // Used to render users
    const listUsers = this.state.userlist.map((item, index) =>
      <div style={{width: "220px", display: "flex", flexDirection: "row", overflow: "hidden", fontSize: "22px", marginTop: "5px", fontWeight: "100"}} key={index}>
      <div style={{textOverflow: "ellipsis", overflow: "hidden"}}>
        {item.nickname}
      </div>
      {(this.state.inactive.indexOf(item.uid) >= 0) &&
        <div>
        (Away)
        </div>
      }

      </div>
    );
    // Used to render messages
    const listMessages = this.state.messages.map((item, index) =>
      <Message item={item} key={index} user={this.state.nickname} />
    );
    if(this.props.match.params.room === undefined){
      return (
        <div style={{display: "flex", flexDirection: 'column', justifyContent: "center", height: "100%", alignItems: "center"}}>
          <h2>
            No chatroom selected
          </h2>
          <div style={{marginBottom: '15px'}}>
            Please select a chatroom or
          </div>
          <div onClick={() => this.makeRoom()} style={{cursor: 'pointer', color: 'blue'}}>
            Create your own
          </div>

        </div>
      )
    } else {
      if(this.state.nicknameset === false) {
      return (
        <div style={{display: "flex", flexDirection: 'column', justifyContent: "center", height: "100%", alignItems: "center"}}>
          <form className="nickname" onSubmit={this.handleSubmit}>
          <div style={{display: "flex", flexDirection: 'column', justifyContent: "center", height: "100%", alignItems: "center"}}>
            <h2>
              Create a nickname
            </h2>
            <div style={{marginBottom: '10px'}}>
              This is how other users will see you
            </div>
            <input className="nameinput" type="text" placeholder="Nickname" value={this.state.nickname} onChange={this.handleTextChange} />
            <input className="namesubmit" type="submit" value="Enter Room" />
          </div>
          </form>
        </div>
      );
      } else {
        return(
          <div>
            <UserList className="userlist" pose={this.state.listshown ? "expanded" : "hidden"}>
            <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%"}}>
              <div/>
                <div>
                  Users
                </div>
              <div/>
            </div>
            {listUsers}
            </UserList>
            <MessageList className="messagelist" pose={this.state.messagesshown ? "expanded" : "hidden"}>
              {this.renderMessages()}
            </MessageList>
            <div>
            <div style={{height: "8px"}} />
          {listMessages}
          </div>
          {(this.state.typing.length > 1) &&
            <div style={{margin: "15px", fontWeight: "100"}}>
               Several people are typing ...
            </div>
          }
          {(this.state.typing.length === 1) &&
            <div style={{margin: "15px", fontWeight: "100"}}>
            {this.state.typing[0]} is typing ...
            </div>
          }
          </div>
        )
      }
    }
  }

  renderRoom() {
    return (
      <div style={{ height: '100%'}}>
        <div className="roomContainer">
          <div className="header" style={{fontWeight: '300'}}>
            <div onClick={() => this.toggleMessageList()} style={{fontWeight: '200', cursor: "pointer"}}>
            {this.state.nicknameset &&
              <div>
                Messages
              </div>
            }
            </div>
            <div>
              {this.props.match.params.room}
            </div>
            <div onClick={() => this.toggleUserList()} style={{fontWeight: '200', cursor: "pointer"}}>
              {this.state.nicknameset &&
                <div>
                  {this.state.userlist.length} {this.state.userlist.length === 1 ? "User Online" : "Users Online"}
                </div>
              }
            </div>
          </div>
          <div className="messageContainer">
            {this.rendercontent()}
          </div>
          {(this.state.nicknameset) &&
          <div className="footer">
            <form onSubmit={this.handlePost} style={{width: "100%", display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
              <input placeholder="Type a message..." className="messageinput" type="text" value={this.state.message} onChange={this.handleMessageChange} />
              <input className="messagesubmit" type="submit" value="Post" style={{marginLeft: "5px"}} />
            </form>
          </div>
          }
        </div>
      </div>
    );
  }

  render() {
    const listRooms = this.state.rooms.map((item, index) =>
      <div key={item._id}
      className="roombutton"
      onClick={() => {
        if (item._id !== this.props.match.params.room) {
          this.setState({userchat: [], chattingwith: {nickname: null, uid: null, messages: []}})
          socket.emit('disconnect');
          console.log(this.props.match.params.room)
          this.setState({messages: item.messages})
          this.props.history.push('/' + item._id);
          if (this.state.nickname !== ""){
            this.joinRoom(item._id, this.state.nickname)
          }
        }
      }}>
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <div>
          <div>
            {item._id}
          </div>
          <div className="roomtext">
          {(item.messages[0] !== undefined)&&
            <div>
              {item.messages[item.messages.length - 1].nickname + ": " + item.messages[item.messages.length - 1].message}
            </div>
          }
          {(item.messages[0] === undefined)&&
            <div>
              No recent messages
            </div>
          }
          </div>
        </div>
        <div style={{width: '70px', textAlign: "right", color: '#8d8c8d'}}>
        {(item.messages[0] !== undefined)&&
          <div>
          {this.convertTime(item.messages[item.messages.length - 1].datetime)}
          </div>
        }
        </div>
        </div>
      </div>
    );

    // Redirect to 404
    if (this.state.error === true) {
      return <Redirect to={'404'} />
    }

    return (
      <div className="body">
        <div className="changeName" style={{zIndex: this.state.changeNameVisible ? 1000000 : -100, opacity: this.state.changeNameVisible ? 1 : 0}}>
          <div className="changeNameContainer">
            <div style={{width: "100%", height: '60px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
              <img src={require('./x.svg')} height="18" width="18" className="xbutton" onClick={() => this.setState({changeNameVisible: false})}/>
            </div>
            <form className="nickname" onSubmit={this.handleChangeSubmit}>
            <div style={{display: "flex", flexDirection: 'column', justifyContent: "center", marginTop: "40px", alignItems: "center"}}>
              <h2>
                Change nickname
              </h2>
              <div style={{marginBottom: '10px'}}>
                Update your nickname
              </div>
              <input className="nameinput" type="text" placeholder="Nickname" value={this.state.nickname} onChange={this.handleTextChange} />
              <input className="namesubmit" type="submit" value="Save Change" />
            </div>
            </form>
          </div>
        </div>
        <div className="rooms">
          <div className="menu">
            <div className="plus" onClick={() => this.changeName()}>
              <img src={require('./pencil.svg')} height="22" width="22" />
            </div>
            <div style={{fontWeight: "200"}}>
              Chatrooms
            </div>
            <div className="plus" onClick={() => this.makeRoom()}>
            +
            </div>
          </div>
          <div className="scroll" id="scroll">
            {listRooms}
            <div style={{ float:"left", clear: "both" }}
                ref={(el) => { this.messagesEnd = el; }}>
           </div>
          </div>
        </div>
        <div className="room">
        {this.renderRoom()}
        </div>
      </div>
    )
  }
}
export default Home;
