// React
import * as React from "react";
import { connect } from "react-redux";
// import { setQueryRule } from "../features/queryRuleSlice";
import { setToolbarState } from "../features/toolbarStateSlice";

// Syncfusion
import { getComponent } from "@syncfusion/ej2-base";
import { TextBoxComponent } from "@syncfusion/ej2-react-inputs";

class TextTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state = Object.assign({}, props);
    this.qryBldrObj = getComponent(
      document.getElementById("querybuilder"),
      "query-builder"
    );
  }
  textChange(event) {
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
        <TextBoxComponent
          value={this.state.rule.value}
          change={this.textChange.bind(this)}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const selectedObject = state.toolbarState.selectedObject;
  const queryColumns = state.toolbarState.queryColumns;
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
      // dispatch(setQueryRule(rule));

      // make copy of toolbar state
      const newToolbarState = { ...this.state.toolbarState };
      newToolbarState.queryRule = rule;

      dispatch(setToolbarState(newToolbarState));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TextTemplate);
