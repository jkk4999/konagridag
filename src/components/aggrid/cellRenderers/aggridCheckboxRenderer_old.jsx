import React, { Component } from "react";

export default class extends Component {
  constructor(props) {
    super(props);
    this.checkedHandler = this.checkedHandler.bind(this);
  }
  checkedHandler(event) {
    let checked = event.target.checked;
    let colId = this.props.column.colId;
    this.props.node.setDataValue(colId, checked);
  }
  render() {
    return (
      <input
        type='checkbox'
        onClick={this.checkedHandler}
        checked={this.props.value}
        defaultChecked={false}
      />
    );
  }
}
