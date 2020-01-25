import React, { Component } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import  Home from './pages/Home'
import  StudentQuestionPage from './pages/Home'
import ProfessorQuestionPage from './pages/Home'
import './App.css';

export default class App extends Component {
  constructor(props)  {
    super(props)
    this.state = {
    }
  }

  render() {
    return (
      <BrowserRouter>
        <div>
          <Switch>
            <Route exact path='/' component={Home} />
          </Switch>
          <Switch>
            <Route exact path='/student' component={StudentQuestionPage}/>
          </Switch>
          <Switch>
            <Route exact path='professor' component={ProfessorQuestionPage}/>
          </Switch>
        </div>
      </BrowserRouter>
    )
  }
}
