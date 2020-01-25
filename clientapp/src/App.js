import React, { Component } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import Home from './pages/Home'
import Error from './pages/Error'

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
            <Route path="/:room" component={Home} />
            <Route path="/" component={Home} />
            <Route exact path="/404" component={Error} />
          </Switch>
        </div>
      </BrowserRouter>
    )
  }
}
