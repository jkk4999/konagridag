// React
import * as React from "react";
import { connect } from "react-redux";
// import { setQueryRule } from "../features/queryRuleSlice";
import { setToolbarState } from "../features/toolbarStateSlice";

// Syncfusion
import { getComponent } from "@syncfusion/ej2-base";
import { NumericTextBoxComponent } from "@syncfusion/ej2-react-inputs";

class NumberTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state = Object.assign({}, props);
    this.qryBldrObj = getComponent(
      document.getElementById("querybuilder"),
      "query-builder"
    );
  }
  numberChange(event) {
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
        <NumericTextBoxComponent
          change={this.numberChange.bind(this)}
          validateDecimalOnType={true}
          value={this.state.rule.value}
          decimals={2}
          format='n2'
        />
      </div>
    );
  }
}

// function mapStateToProps(state) {
//   const selectedObject = state.toolbarState.selectedObject;
//   const queryColumns = state.toolbarState.queryColumns;
//   const gridData = state.gridData;
//   const objectMetadata = state.objectMetadata;
//   return {
//     selectedObject,
//     queryColumns,
//     gridData,
//     objectMetadata,
//   };
// }

// function mapDispatchToProps(dispatch) {
//   return {
//     setQueryRule: (rule) => {
//       // dispatch(setQueryRule(rule));

//       // make copy of toolbar state
//       const newToolbarState = { ...this.state.toolbarState };
//       newToolbarState.queryRule = rule;

//       dispatch(setToolbarState(newToolbarState));
//     },
//   };
// }

// export default connect(mapStateToProps, mapDispatchToProps)(NumberTemplate);
export default NumberTemplate;
