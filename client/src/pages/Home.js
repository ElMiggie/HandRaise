import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:5000');
const axios = require('axios')

class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {
      content: "",
      roomname: "",
      question: "",
      inroom: false,
      questions: [],
      voted: []
    }
  }

  getRes() {
    fetch('/api/getRes')
    .then(res => res.json())
    .then(content => this.setState({ content: content }))
  }

  joinRoom() {
    this.setState({inroom: true})
    socket.emit('join', this.state.roomname)
  }

  createRoom() {
    this.setState({inroom: true})
    socket.emit('create');
    socket.on('createcallback', (name) => {
      this.setState({roomname: name})
    })
  }

  registerVote(id) {
    var temparray = []
    for (var i = 0; i < this.state.questions.length; i++) {
      if (this.state.questions[i].id === id) {
        temparray.push({
          message: this.state.questions[i].message,
          votes: this.state.questions[i].votes + 1,
          id: id
        })
      } else {
        temparray.push(this.state.questions[i])
      }
    }
    this.setState({questions: temparray})
  }

  voteQuestion(id) {
    if (!this.state.voted.includes(id)) {
      this.setState({voted: this.state.voted.concat(id)})
      socket.emit('vote', id, this.state.roomname);
    }
  }

  componentDidMount() {
    this.getRes();
    socket.on('messagesent', (message, id) => {
      this.setState({questions: this.state.questions.concat({message: message, votes: 0, id: id})})
      console.log(id)
      console.log(this.state.questions)
    })
    socket.on('votesent', (id) => {
      this.registerVote(id)
    })
  }

  handleChange(event) {
    this.setState({roomname: event.target.value});
  }

  handleChangeQuestion(event) {
    this.setState({question: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    this.joinRoom();
  }

  sendQuestion(event) {
    event.preventDefault();
    socket.emit('question', this.state.question, this.state.roomname);
    console.log("SENT")
  }

  render() {
    if (!this.state.inroom) {
      return (
      <div style={{display: "flex", justifyContent: "center"}}>
        <div style={{width: "50%", textAlign: "center"}}>
          <h1>
          React Boilerplate
          </h1>
          <form onSubmit={this.handleSubmit.bind(this)}>
          <label>
            Name:
            <input type="text" value={this.state.roomname} onChange={(value) => this.handleChange(value)} />
          </label>
          <input type="submit" value="Submit" />
        </form>
        <button onClick={this.createRoom.bind(this)}>
        Create Room
        </button>
          {this.state.content}
        </div>
      </div>
      );
    } else {
      const listItems = this.state.questions.map((question, index) =>
        <div key={question.id}>
          <div>{question.message}</div>
          <div>Votes: {question.votes}</div>
          <button onClick={() => this.voteQuestion(question.id)}>vote</button>
        </div>
      );
      return (
        <div style={{display: "flex", justifyContent: "center"}}>
          <div style={{width: "50%", textAlign: "center"}}>
            <h1>
            Message
            </h1>
            <form onSubmit={this.sendQuestion.bind(this)}>
            <label>
              Message:
              <input type="text" value={this.state.question} onChange={(value) => this.handleChangeQuestion(value)} />
            </label>
            <input type="submit" value="Submit" />
          </form>
          <button onClick={() => this.sendQuestion()}>
          Create Room
          </button>
          {listItems}
          </div>
        </div>
      )
    }
  }
}
export default Home;
