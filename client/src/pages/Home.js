import React, { Component } from 'react';
import { Button } from 'reactstrap';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
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
      questions: []
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

  componentDidMount() {
    this.getRes();
    socket.on('messagesent', (message, id) => {
      this.setState({questions: this.state.questions.concat({message: message, votes: 0, id: id})})
      console.log(id)
      console.log(this.state.questions)
    })
    socket.on('votesent', (id) => {
      console.log(id)
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

  handleProfessor(event) {
    const profPage = ProfessorQuestionPage()
    profPage.render();
  }

  handleStudent(event) {
    const studentPage = StudentQuestionPage()
    studentPage.render();
  }


  render() {
      //Two buttons: I am a Student // I am a Professor. 
      return (
        <Router>
          <div style={{display: "flex", justifyContent: "center"}}>

            <Button variant="primary" onClick={this.handleStudent.bind(this)}>
               <Link to="/student">Student</Link>
            </Button>

            <Button variant="primary" onClick={this.handleProfessor.bind(this)}>
              <Link to="/professor">Professor</Link>
            </Button>
          </div>
        </Router>

      )
    }
}

class StudentQuestionPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      content: "",
      roomname: "",
      question: "",
      questions: []
    }
  }

  voteQuestion(id) {
    socket.emit('vote', id, this.state.roomname);
  }

  
  sendQuestion(event) {
    event.preventDefault();
    socket.emit('question', this.state.question, this.state.roomname);
    console.log("SENT")
  }

  render() {
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
          Create Room2
          </button>
          {listItems}
          </div>
        </div>
      )
  }
}



// Make a room - look at the questions
class ProfessorQuestionPage extends Component {

  constructor(props) {
    super(props)
    this.state = {
      content: "",
      roomname: "",
      question: "",
      questions: []
    }
  }

  createRoom() {
    this.setState({inroom: true})
    socket.emit('create');
    socket.on('createcallback', (name) => {
      this.setState({roomname: name})
    })
  }

  render() {
    // Should route us to student/professor choosing page 
    return (
      <div style={{display: "flex", justifyContent: "center"}}>
        <div style={{width: "50%", textAlign: "center"}}>
          <h1>
          React Boilerplate
          </h1>
          <form noValidate autoComplete="off" onSubmit={this.handleSubmit.bind(this)}>
          <label>
            Name:
            <input type="text" value={this.state.roomname} onChange={(value) => this.handleChange(value)} />
          </label>
          <input type="submit" value="Submit" />
        </form>
        <Button variant="primary" onClick={this.createRoom.bind(this)}>
        Create Room
        </Button>
          {this.state.content}
        </div>
      </div>
      );
  }

}
export default Home;
