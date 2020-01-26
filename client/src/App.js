import React, { Component } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import  Home from './pages/Home'
import  Professor from './pages/Professor'
import  Student from './pages/Student'
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
            <Route exact path='/:post' component={Student}/>
            <Route exact path='professor' component={Professor}/>
          </Switch>
        </div>
      </BrowserRouter>
    )
  }
}
