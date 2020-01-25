import React, { Component } from 'react';
import moment from 'moment';

class Message extends Component {
  constructor(props) {
    super(props)
    this.state = {
      room: null,
      me: this.props.item.mypost,
    }
  }

  componentDidMount() {
    console.log(this.props)
  }
  convertTime() {
    let date = new Date(this.props.item.datetime)
    let ret = moment(date).format("LT")
    return ret;
  }

  render() {
    return (
      <div style={{ marginLeft: "15px", marginRight: "15px"}}>
      <div style={{display: "flex", width: "100%", justifyContent: this.state.me ? "flex-end" : "flex-start", marginBottom: '12px'}}>
      <div style={{display: "flex", maxWidth: "60%", flexDirection: "column"}}>
      <div style={{width: "100%", display: "flex", justifyContent: "center", fontSize: "12px", marginBottom:"2px"}}>
      {this.convertTime()}
      </div>
        <div style={{display: "flex", flexDirection: "column", maxWidth: "100%", color: this.state.me ? "white" : "black", backgroundColor: this.state.me ? "#56a1f2" : "#e6e5ea", padding: "10px", paddingRight: "15px", paddingLeft: "15px", borderRadius: "20px"}}>
          <b style={{marginRight: "5px"}}>
            {this.props.item.nickname}
          </b>
          <sub style={{wordWrap: "break-word", flexWrap: "wrap"}}>
            {this.props.item.message}
          </sub>
        </div>
      </div>
      </div>
      </div>
    );
  }
}
export default Message;
