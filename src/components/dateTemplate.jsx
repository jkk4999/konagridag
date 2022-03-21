// React
import * as React from "react";
import { connect } from "react-redux";
import { setQueryRule } from "../features/queryRuleSlice";

// Syncfusion
import { getComponent } from "@syncfusion/ej2-base";
import { DatePickerComponent } from "@syncfusion/ej2-react-calendars";

class DateTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state = Object.assign({}, props);
    this.qryBldrObj = getComponent(
      document.getElementById("querybuilder"),
      "query-builder"
    );
  }
  dateChange(event) {
    const args = this.state;
    let elem = document
      .getElementById(args.ruleID)
      .querySelector(".e-rule-value");
    this.qryBldrObj.notifyChange(event.value, elem, "value");

    const validRule = this.qryBldrObj.getRules();

    this.props.setQueryRule(validRule);
  }
  render() {
    const args = this.state;
    return (
      <div>
        <DatePickerComponent
          change={this.dateChange.bind(this)}
          format='yyyy-MM-dd'
          placeholder='Select date'
          value={this.state.rule.value}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const selectedObject = state.selectedObject;
  const queryColumns = state.queryColumns;
  const gridData = state.gridData;
  const objectMetadata = state.objectMetadata;
  return {
    selectedObject,
    queryColumns,
    gridData,
    objectMetadata,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setQueryRule: (rule) => {
      dispatch(setQueryRule(rule));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DateTemplate);
