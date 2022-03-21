// React
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import * as ReactDom from "react-dom";
import { connect } from "react-redux";

// Redux
import { setQueryOptions } from "../../features/queryOptionsSlice";
import { setQueryPanelVisible } from "../../features/queryPanelVisabilitySlice";
import { setQueryRule } from "../../features/queryRuleSlice";

// Mui
import { makeStyles } from "@mui/styles";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import { IconButton } from "@mui/material";
import Button from "@mui/material/Button";
import { Stack } from "@mui/material";
import { Select } from "@mui/material/Select";
import { styled, useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Toolbar from "@mui/material/Toolbar";
import { Typography } from "@mui/material/styles/createTypography";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

// Syncfusion
import {
  QueryBuilderComponent,
  ColumnsDirective,
  ColumnDirective,
} from "@syncfusion/ej2-react-querybuilder";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { NumericTextBoxComponent } from "@syncfusion/ej2-react-inputs";

// Components

import CheckboxTemplate from "./checkboxTemplate";
import CurrencyTemplate from "./currencyTemplate";
import DecimalTemplate from "./decimalTemplate";
import IntegerTemplate from "./integerTemplate";
import PercentTemplate from "./percentTemplate";
import SelectTemplate from "./selectTemplate.jsx";

class QueryBuilder3 extends React.Component {
  constructor() {
    super(...arguments);

    const state = {
      columns: this.props.queryColumns,
      rule: this.props.queryRule,
    };

    this.runQuery = this.runQuery.bind(this);
    this.saveQuery = this.saveQuery.bind(this);
  }

  runQuery() {}

  async saveQuery() {
    try {
      const rules = this.props.queryRule;

      const insertUrl = "/postgres/knexInsert";

      const insertColumns = [
        "name",
        "owner",
        "object",
        "is_public",
        "query_rules",
        "is_active",
        "orgid",
      ];

      const insertValues = {
        name: "Test Query",
        owner: this.props.userInfo.userEmail,
        object: this.props.selectedObject.id,
        is_public: false,
        query_rules: rules,
        is_active: true,
        orgid: this.props.userInfo.organizationId,
      };

      const insertPayload = {
        table: "query2",
        columns: insertColumns,
        values: insertValues,
      };

      const insertResponse = await fetch(insertUrl, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(insertPayload),
      });

      if (!insertResponse.ok) {
        throw new Error(
          `queryBuilder3-insertQuery() - ${insertResponse.message}`
        );
      }

      let insertResult = await insertResponse.json();
      const newQuery = insertResult.records[0];

      // adds the query to the grid query selector options
      let queryOps = [...this.props.queryOptions];
      const newOpt = {
        id: newQuery.name,
        label: newQuery.name,
      };
      queryOps.push(newOpt);
      this.props.setQueryOptions(queryOps);

      // set the selected query to the new value
    } catch (error) {
      console.log("Error inserting query");
      return;
    }
  }

  showQuery() {
    // if (this.props.queryPanelVisible === true) {
    //   this.dispatch(setQueryPanelVisible(false));
    // } else {
    //   this.dispatch(setQueryPanelVisible(true));
    // }
    const a = this;
    this.props.setQueryPanelVisible(false);
  }

  checkboxTemplate(props) {
    return <CheckboxTemplate {...props} />;
  }

  currencyTemplate(props) {
    return <CurrencyTemplate {...props} />;
  }

  decimalTemplate(props) {
    return <DecimalTemplate {...props} />;
  }

  integerTemplate(props) {
    return <IntegerTemplate {...props} />;
  }

  percentTemplate(props) {
    return <PercentTemplate {...props} />;
  }

  selectTemplate(props) {
    return <SelectTemplate {...props} />;
  }

  ruleChanged(args) {
    const validRule = args.rule;

    const rule = {
      rule: validRule,
    };

    this.props.setQueryRule(validRule);
  }

  render() {
    return (
      <Box>
        <QueryBuilderComponent
          // enableNotCondition='true'
          id='querybuilder'
          rule={this.props.queryRule}
          columns={this.props.queryColumns}
          sortDirection='Ascending'
          ref={this.props.forwardRef}
          // ruleChange={(args) => {
          //   // this.ruleChanged(args);
          // }}
        >
          <ColumnsDirective>
            {this.props.queryColumns.map((item, idx) => {
              const selectedObject = this.props.selectedObject;

              const objectMetadata = this.props.objectMetadata;
              const objMetadata = objectMetadata.find(
                (m) => m.objName === selectedObject.id
              );
              const metadataFields = objMetadata.metadata.fields;
              const metadataField = metadataFields.find(
                (f) => f.name === item.field
              );
              const fieldDataType = metadataField.dataType;

              switch (fieldDataType) {
                case "boolean": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                      // template={this.checkboxTemplate}
                      enableNotCondition='true'
                    />
                  );
                }
                case "currency": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        {
                          key: "Greater Than Or Equal",
                          value: "greaterthanorequal",
                        },
                        { key: "Greater Than", value: "greaterthan" },
                        { key: "Between", value: "between" },
                        { key: "Not Between", value: "notbetween" },
                        {
                          key: "Less Than Or Equal",
                          value: "lessthanorequal",
                        },
                        { key: "Less Than", value: "lessthan" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      // template={this.currencyTemplate}
                      type={item.type}
                    />
                  );
                }
                case "date": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        {
                          key: "Greater Than Or Equal",
                          value: "greaterthanorequal",
                        },
                        { key: "Greater Than", value: "greaterthan" },
                        { key: "Between", value: "between" },
                        { key: "Not Between", value: "notbetween" },
                        {
                          key: "Less Than Or Equal",
                          value: "lessthanorequal",
                        },
                        { key: "Less Than", value: "lessthan" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                    />
                  );
                }
                case "datetime": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        {
                          key: "Greater Than Or Equal",
                          value: "greaterthanorequal",
                        },
                        { key: "Greater Than", value: "greaterthan" },
                        { key: "Between", value: "between" },
                        { key: "Not Between", value: "notbetween" },
                        {
                          key: "Less Than Or Equal",
                          value: "lessthanorequal",
                        },
                        { key: "Less Than", value: "lessthan" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                    />
                  );
                }
                case "decimal": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        {
                          key: "Greater Than Or Equal",
                          value: "greaterthanorequal",
                        },
                        { key: "Greater Than", value: "greaterthan" },
                        { key: "Between", value: "between" },
                        { key: "Not Between", value: "notbetween" },
                        {
                          key: "Less Than Or Equal",
                          value: "lessthanorequal",
                        },
                        { key: "Less Than", value: "lessthan" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                      // template={this.decimalTemplate}
                    />
                  );
                }
                case "double": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        {
                          key: "Greater Than Or Equal",
                          value: "greaterthanorequal",
                        },
                        { key: "Greater Than", value: "greaterthan" },
                        { key: "Between", value: "between" },
                        { key: "Not Between", value: "notbetween" },
                        {
                          key: "Less Than Or Equal",
                          value: "lessthanorequal",
                        },
                        { key: "Less Than", value: "lessthan" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                      // template={this.decimalTemplate}
                    />
                  );
                }
                case "fax": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        { key: "Contains", value: "contains" },
                        { key: "Not Contains", value: "notcontains" },
                        { key: "Starts With", value: "startswith" },
                        { key: "Ends With", value: "endswith" },
                        { key: "Is Empty", value: "isempty" },
                        { key: "Is Not Empty", value: "isnotempty" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                    />
                  );
                }
                case "id": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        { key: "Contains", value: "contains" },
                        { key: "Not Contains", value: "notcontains" },
                        { key: "Starts With", value: "startswith" },
                        { key: "Ends With", value: "endswith" },
                        { key: "Is Empty", value: "isempty" },
                        { key: "Is Not Empty", value: "isnotempty" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                    />
                  );
                }
                case "int": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        {
                          key: "Greater Than Or Equal",
                          value: "greaterthanorequal",
                        },
                        { key: "Greater Than", value: "greaterthan" },
                        { key: "Between", value: "between" },
                        { key: "Not Between", value: "notbetween" },
                        {
                          key: "Less Than Or Equal",
                          value: "lessthanorequal",
                        },
                        { key: "Less Than", value: "lessthan" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                      // template={this.integerTemplate}
                    />
                  );
                }
                case "long": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        {
                          key: "Greater Than Or Equal",
                          value: "greaterthanorequal",
                        },
                        { key: "Greater Than", value: "greaterthan" },
                        { key: "Between", value: "between" },
                        { key: "Not Between", value: "notbetween" },
                        {
                          key: "Less Than Or Equal",
                          value: "lessthanorequal",
                        },
                        { key: "Less Than", value: "lessthan" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      // template={this.integerTemplate}
                      type={item.type}
                    />
                  );
                }
                case "percent": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        {
                          key: "Greater Than Or Equal",
                          value: "greaterthanorequal",
                        },
                        { key: "Greater Than", value: "greaterthan" },
                        { key: "Between", value: "between" },
                        { key: "Not Between", value: "notbetween" },
                        {
                          key: "Less Than Or Equal",
                          value: "lessthanorequal",
                        },
                        { key: "Less Than", value: "lessthan" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      // template={this.percentTemplate}
                      type={item.type}
                    />
                  );
                }
                case "phone": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        { key: "Contains", value: "contains" },
                        { key: "Not Contains", value: "notcontains" },
                        { key: "Starts With", value: "startswith" },
                        { key: "Ends With", value: "endswith" },
                        { key: "Is Empty", value: "isempty" },
                        { key: "Is Not Empty", value: "isnotempty" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                    />
                  );
                }
                case "picklist": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        { key: "In", value: "in" },
                        { key: "Not In", value: "notin" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                      // template={this.selectTemplate}
                    />
                  );
                }
                case "reference": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        { key: "Is Empty", value: "isempty" },
                        { key: "Is Not Empty", value: "isnotempty" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                    />
                  );
                }
                case "string": {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      operators={[
                        { key: "Equal", value: "equal" },
                        { key: "Not Equal", value: "notequal" },
                        { key: "Contains", value: "contains" },
                        { key: "Not Contains", value: "notcontains" },
                        { key: "Starts With", value: "startswith" },
                        { key: "Ends With", value: "endswith" },
                        { key: "Is Empty", value: "isempty" },
                        { key: "Is Not Empty", value: "isnotempty" },
                        { key: "Is Null", value: "isnull" },
                        { key: "Is Not Null", value: "isnotnull" },
                      ]}
                      type={item.type}
                    />
                  );
                }
                default: {
                  return (
                    <ColumnDirective
                      key='{item.name}'
                      field={item.field}
                      label={item.label}
                      type={item.type}
                    />
                  );
                }
              }
            })}
          </ColumnsDirective>
        </QueryBuilderComponent>
        <Stack direction={"row"}>
          <Button
            id='runQueryBtn'
            variant='contained'
            onClick={this.runQuery}
            size='small'
            sx={{
              mt: 2,
            }}
          >
            Run Query
          </Button>

          <Button
            id='saveQueryBtn'
            variant='contained'
            size='small'
            onClick={() => {
              this.saveQuery();
            }}
            sx={{
              mt: 2,
              ml: 5,
            }}
          >
            Save Query
          </Button>

          <Button
            id='showQueryBtn'
            variant='contained'
            size='small'
            onClick={() => {
              if (this.props.queryPanelVisible) {
                this.props.setQueryPanelVisible(false);
              } else {
                this.props.setQueryPanelVisible(true);
              }
            }}
            sx={{
              mt: 2,
              ml: 5,
            }}
          >
            Show Query
          </Button>
        </Stack>
      </Box>
    );
  }
}

function mapStateToProps(state) {
  const selectedObject = state.selectedObject;
  const userInfo = state.userInfo;
  const queryColumns = state.queryColumns;
  const queryOptions = state.queryOptions;
  const queryRule = state.queryRule;
  const gridData = state.gridData;
  const objectMetadata = state.objectMetadata;
  const queryPanelVisible = state.queryPanelVisible;
  return {
    selectedObject,
    userInfo,
    queryColumns,
    queryOptions,
    queryRule,
    queryPanelVisible,
    gridData,
    objectMetadata,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setQueryOptions: (arg) => {
      dispatch(setQueryOptions(arg));
    },
    setQueryRule: (rule) => {
      dispatch(setQueryRule(rule));
    },
    setQueryPanelVisible: (arg) => {
      dispatch(setQueryPanelVisible(arg));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(QueryBuilder3);
