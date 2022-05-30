// React
import * as React from "react";
import { connect } from "react-redux";
import { setQueryRule } from "../features/queryRuleSlice";
import { setToolbarState } from "../features/toolbarStateSlice";

// Syncfusion
import { DropDownListComponent } from "@syncfusion/ej2-react-dropdowns";
import { MultiSelectComponent } from "@syncfusion/ej2-react-dropdowns";
import { getComponent } from "@syncfusion/ej2-base";

class SelectTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state = Object.assign({}, props);
    this.qryBldrObj = getComponent(
      document.getElementById("querybuilder"),
      "query-builder"
    );
    this.multiSelectMapping = { text: "text", value: "value" };
  }
  selectChange(event) {
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
    const selectedObject = args.selectedObject ? args.selectedObject.id : null;
    const queryField = args.field;
    const objectMetadata = args.objectMetadata;
    const objMetadata = objectMetadata.find(
      (f) => f.objName === selectedObject
    );
    const metadataFields = objMetadata.metadata.fields;
    const metadataField = metadataFields.find((f) => f.name === queryField);
    const picklistValues = metadataField.picklistValues;

    const options = [];
    picklistValues.forEach((p) => {
      const newOption = {
        value: p.value,
        text: p.label,
      };
      options.push(newOption);
    });

    return (
      <div>
        <MultiSelectComponent
          dataSource={options}
          fields={this.multiSelectMapping}
          value={this.state.rule.value}
          change={this.selectChange.bind(this)}
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

// export default connect(mapStateToProps, mapDispatchToProps)(SelectTemplate);
export default SelectTemplate;
