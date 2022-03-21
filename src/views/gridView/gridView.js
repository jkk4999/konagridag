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

// React Spinner
import LoadingOverlay from "react-loading-overlay-ts";
import BounceLoader from "react-spinners/BounceLoader";
import GridLoader from "react-spinners/GridLoader";

// Redux
import { addMetadata } from "../../features/objectMetadataSlice";
import { setGridColumns } from "../../features/gridColumnsSlice";
import { setGridData } from "../../features/gridDataSlice";
import { setObjectList } from "../../features/objectListSlice";
import { setObjectOptions } from "../../features/objectOptionsSlice";
import { setQueryColumns } from "../../features/queryColumnsSlice";
import { setQueryBuilderVisible } from "../../features/queryBuilderVisabilitySlice";
import { setQueryOptions } from "../../features/queryOptionsSlice";
import { setQueryPanelVisible } from "../../features/queryPanelVisabilitySlice";
import { setQueryRule } from "../../features/queryRuleSlice";
import { setQueryRuleText } from "../../features/queryRuleTextSlice";
import { setQueryList } from "../../features/queryListSlice";
import { setSelectedObject } from "../../features/selectedObjectSlice";
import { setSelectedQuery } from "../../features/selectedQuerySlice";
import { setSelectedTemplate } from "../../features/selectedTemplateSlice";
import { setSidebarSize } from "../../features/sidebarSizeSlice";
import { setTemplateFields } from "../../features/templateFieldsSlice";
import { setTemplateList } from "../../features/templateListSlice";
import { setTemplateOptions } from "../../features/templateOptionsSlice";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";

// Mui
import { makeStyles } from "@mui/styles";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import { IconButton } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Select } from "@mui/material/Select";
import { Stack } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Toolbar from "@mui/material/Toolbar";
import { Typography } from "@mui/material/styles/createTypography";

// components
import CheckboxTemplate from "../../components/checkboxTemplate";
import CurrencyTemplate from "../../components/currencyTemplate";
import DateTemplate from "../../components/dateTemplate";
import DecimalTemplate from "../../components/decimalTemplate";
import IntegerTemplate from "../../components/integerTemplate";
import PercentTemplate from "../../components/percentTemplate";
import SelectTemplate from "../../components/selectTemplate.jsx";
import TextTemplate from "../../components/textTemplate";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

// Material Icons
import * as Bi from "react-icons/bi"; // bi icons
import * as Di from "react-icons/di"; // di icons
import * as Fi from "react-icons/fi"; // feather icons
import * as Io from "react-icons/io"; // IO icons
import * as Mi from "react-icons/md"; // material icons
import * as Vsc from "react-icons/vsc"; // vsc icons

// MUI icons
import AddOutlinedIcon from "@mui/icons-material/Add";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DoubleArrowOutlinedIcon from "@mui/icons-material/DoubleArrowOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

// Syncfusion
import {
  QueryBuilderComponent,
  ColumnsDirective,
  ColumnDirective,
  ColumnsModel,
  RuleModel,
  RuleChangeEventArgs,
} from "@syncfusion/ej2-react-querybuilder";
import {
  ButtonComponent,
  CheckBoxComponent,
} from "@syncfusion/ej2-react-buttons";
import { DatePickerComponent } from "@syncfusion/ej2-react-calendars";
import {
  DropDownListComponent,
  MultiSelectComponent,
} from "@syncfusion/ej2-react-dropdowns";
import { NumericTextBoxComponent } from "@syncfusion/ej2-react-inputs";
import { RadioButtonComponent, CheckBox } from "@syncfusion/ej2-react-buttons";
import { TextBoxComponent } from "@syncfusion/ej2-react-inputs";

import * as gf from "./gridFunctions";
import { grid } from "@mui/system";
import { rippleEffect } from "@syncfusion/ej2-base";

// css rules in jss
const useStyles = makeStyles((theme) => ({
  gridStyle: {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    width: "100%",
    height: "93vh",
    backgroundColor: "#fff",
    color: "black",
    marginLeft: "15px",
  },
}));

export default function GridView() {
  // Snackbar
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const onClickDismiss = (key) => () => {
    notistackRef.current.closeSnackbar(key);
  };

  const notistackRef = React.createRef();

  // react spinner
  let [loading, setLoading] = useState(true);

  // local object references
  const gridRef = useRef(null);
  const objectSelectorRef = useRef(null);
  const templateSelectorRef = useRef(null);
  const querySelectorRef = useRef(null);
  const jsonButton = useRef(null);
  const saveQueryTextField = useRef(null);
  const sqlButton = useRef(null);
  const queryRuleContent = useRef(null);
  const queryBuilderRef = useRef(null);

  // redux global state
  const dispatch = useDispatch();
  const gridColumns = useSelector((state) => state.gridColumns);
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const objectOptions = useSelector((state) => state.objectOptions);
  const queryColumns = useSelector((state) => state.queryColumns);
  const queryOptions = useSelector((state) => state.queryOptions);
  const queryPanelVisible = useSelector((state) => state.queryPanelVisible);
  const queryRule = useSelector((state) => state.queryRule);
  const selectedObject = useSelector((state) => state.selectedObject);
  const selectedTemplate = useSelector((state) => state.selectedTemplate);
  const selectedQuery = useSelector((state) => state.selectedQuery);
  const templateOptions = useSelector((state) => state.templateOptions);
  const templateFields = useSelector((state) => state.templateFields);
  const userInfo = useSelector((state) => state.userInfo);

  // local state values
  const [queryVisible, setQueryVisible] = useState(true);
  const [queryRuleText, setQueryRuleText] = useState();

  // QueryBuilder
  const [queryContentRows, setQueryContentRows] = useState(5);
  const [showQuery, setShowQuery] = useState(false);
  const [saveQueryText, setSaveQueryText] = useState("");

  const sidebarSize = useSelector((state) => state.sidebarSize);
  const isLoggedIn = useSelector((state) => state.isLoggedIn);

  // AgGrid state
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);

  const containerStyle = useMemo(() => ({ width: "95%", height: "90%" }), []);
  const gridStyle = useMemo(
    () => ({ height: "90%", width: "95%", marginLeft: "10px" }),
    []
  );

  // get org objects after user login
  useEffect(() => {
    const loadInitialData = async () => {
      if (Object.keys(userInfo).length === 0) {
        return;
      }

      setLoading(true);
      const result = await gf.getObjectOptions(userInfo);

      if (result.status === "error") {
        // log error and notify user
        console.log(`gridView-userEffect() - ${result.errorMessage}`);

        // notify user of error
        const snackOptions = {
          variant: "error",
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
          TransitionComponent: Slide,
        };

        const key = enqueueSnackbar(
          "Error retrieving org objects",
          snackOptions
        );

        return "error";
      }

      const data = result.records;

      // set global state
      dispatch(setObjectOptions(data));

      const selectedObj = data[0];

      // set the selectedObject
      dispatch(setSelectedObject(selectedObj));

      setLoading(false);
    };

    loadInitialData();
  }, [userInfo, dispatch, enqueueSnackbar]);

  // selected object changed
  useEffect(() => {
    /*  when the selected object changes
      1 - get metadata for selected object
      2 - load the template options
      3 - load the query options
      4 - set selected template & query based on preferences or defaults
    */

    const objChanged = async () => {
      if (selectedObject === null || selectedObject.id === "") {
        return;
      }

      let hasTemplates = null;
      let hasQueries = null;

      try {
        // get object metadata
        const metadataResult = await gf.getObjectMetadata(
          selectedObject.id,
          userInfo,
          objectMetadata
        );

        if (metadataResult.status !== "ok") {
          throw new Error(
            `useSelectedObjectChanged() - ${metadataResult.errorMessage}`
          );
        }

        const hasMetadata = objectMetadata.find(
          (f) => f.objName === selectedObject.id
        );

        if (hasMetadata === undefined) {
          // store object metadata in global state
          const objMetadata = metadataResult.records;
          dispatch(
            addMetadata({
              objName: selectedObject.id,
              metadata: metadataResult.records,
            })
          );
        }

        // get template options
        const templateResult = await gf.getTemplateOptions(
          selectedObject.id,
          userInfo
        );

        if (templateResult.status === "error") {
          throw new Error(
            `useSelectedObjectChanged() - ${templateResult.errorMessage}`
          );
        }

        const templateData = templateResult.records;

        // create the template options list
        const tmpOptions = [];
        templateData.forEach((d) => {
          const newOpt = {
            id: d.id,
            label: d.template_name,
          };
          tmpOptions.push(newOpt);
        });
        dispatch(setTemplateOptions(tmpOptions));

        // create the query options list
        const queryResult = await gf.getQueryOptions(
          selectedObject.id,
          userInfo
        );

        if (queryResult.status === "error") {
          throw new Error(
            `useSelectedObjectChanged() - ${queryResult.errorMessage}`
          );
        }

        const queryData = queryResult.records;

        // create the query options list
        const qryOptions = [];
        queryData.forEach((d) => {
          const newOpt = {
            id: d.id,
            label: d.name,
          };
          qryOptions.push(newOpt);
        });
        dispatch(setQueryOptions(qryOptions));

        // check for grid preferences
        const prefResult = await gf.getGridPreferences(
          selectedObject.id, // selectedObject
          false, // is_related
          userInfo // userInfo
        );

        if (prefResult.status === "error") {
          throw new Error(
            `useSelectedObjectChanged() - Error retrieving user preferences for ${selectedObject.id}`
          );
        }

        const prefData = prefResult.records;

        if (prefData.length > 1) {
          throw new Error(
            `useSelectedObjectChanged() - Found more than 1 user preference for ${selectedObject.id}`
          );
        }

        if (prefData.length === 1) {
          // get template preferenceId
          const templatePrefId = Number(prefData[0].templateid);

          // find the template option with this Id
          const tmpOption = tmpOptions.find((o) => o.id === templatePrefId);

          // use this template
          dispatch(setSelectedTemplate(tmpOption));

          // get query preferenceId
          const queryPrefId = Number(prefData[0].queryid);

          // find the query option with this Id
          const queryOption = qryOptions.find((o) => o.id === queryPrefId);

          // use this template
          dispatch(setSelectedQuery(queryOption));

          return;
        }

        // if no preferences, check for defaults
        const defaultTemplateResult = await gf.getDefaultTemplates(
          selectedObject.id,
          userInfo.orgid,
          true, // default
          true, // is_active
          true, // is_public
          false, // is_related,
          null // owner
        );

        if (defaultTemplateResult.status === "error") {
          throw new Error(
            `useSelectedObjectChanged() - Error retrieving template defaults for ${selectedObject.id}`
          );
        }

        const defaultTemplates = defaultTemplateResult.records;

        if (defaultTemplates.length > 1) {
          // default templates only valid for public templates
          // there should only be 1 default template per object
          throw new Error(
            `useSelectedObjectChanged() - found more than 1 default template for ${selectedObject.id}`
          );
        }

        if (defaultTemplates.length === 1) {
          const defaultTemplate = defaultTemplates[0];

          // find the template option with this Id
          const templateOption = tmpOptions.find(
            (t) => t.id === Number(defaultTemplate.id)
          );

          // use this template
          dispatch(setSelectedTemplate(templateOption));
        }

        const defaultQueryResult = await gf.getDefaultQueries(
          selectedObject.id,
          userInfo.orgid,
          true, // default
          true, // is_active
          null, // is_public,
          null // owner
        );

        if (defaultQueryResult.status === "error") {
          throw new Error(
            `useSelectedObjectChanged() - Error retrieving query defaults for ${selectedObject.id}`
          );
        }

        const defaultQueries = defaultQueryResult.records;

        if (defaultQueries.length > 1) {
          // default queries only valid for public queries
          // there should only be 1 default query per object
          throw new Error(
            `useSelectedObjectChanged() - found more than 1 default query for ${selectedObject.id}`
          );
        }

        if (defaultQueries.length === 1) {
          const defaultQuery = defaultQueries[0];

          // find the query option with this Id
          const queryOption = qryOptions.find(
            (t) => t.id === Number(defaultQuery.id)
          );

          // use this query
          dispatch(setSelectedTemplate(queryOption));
        }
      } catch (error) {
        // log error and notify user
        console.log(`useSelectedObjectChanged() - ${error.message}`);

        // notify user of error
        const snackOptions = {
          variant: "error",
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
          TransitionComponent: Slide,
        };

        const key = enqueueSnackbar(error.message, snackOptions);
      }
    };

    objChanged();
  }, [selectedObject, dispatch, enqueueSnackbar, objectMetadata, userInfo]);

  // selectedTemplate create the grid columns
  useEffect(() => {
    const tmpChanged = async () => {
      if (selectedTemplate === null || selectedTemplate.id === "") {
        return;
      }

      try {
        // get the template fields for selected template
        const templateFieldResult = await gf.getTemplateFields(
          selectedTemplate.id
        );

        if (templateFieldResult.status === "error") {
          throw new Error(
            `gridView-useEffect() - ${templateFieldResult.errorMessage}`
          );
        }

        const templateFieldData = templateFieldResult.records;

        // create the grid columns
        const gridCols = await gf.createGridColumns(
          selectedObject.id,
          templateFieldData,
          objectMetadata
        );

        // only store gridColumns if they changed
        const difference = [
          ...gf.compareArrays(gridCols, gridColumns),
          ...gf.compareArrays(gridColumns, gridCols),
        ];

        // store the grid columns if they changed
        if (difference.length > 0) {
          setColumnDefs(gridCols);
        }
      } catch (error) {
        // log error and notify user
        console.log(`useEffectTemplateChanged() - ${error.message}`);

        // notify user of error
        const snackOptions = {
          variant: "error",
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
          TransitionComponent: Slide,
        };

        const key = enqueueSnackbar(error.message, snackOptions);
      }
    };

    tmpChanged();
  }, [selectedTemplate, enqueueSnackbar, objectMetadata, selectedObject]);

  // create the QueryBuilder columns
  useEffect(() => {
    if (objectMetadata.length === 0 || selectedObject === null) {
      return;
    }

    const qbChanged = async () => {
      if (selectedObject === null || objectMetadata.length === 0) {
        return;
      }
      // create QueryBuilder columns
      const qbColumns = await gf.createQueryBuilderColumns(
        selectedObject,
        objectMetadata
      );

      dispatch(setQueryColumns(qbColumns));

      const a = 1;
    };

    qbChanged();
  }, [gridColumns, dispatch, objectMetadata, selectedObject]);

  // update the QueryBuilder rules when the selected query changes
  // and run the query
  useEffect(() => {
    const queryChanged = async () => {
      if (selectedObject === null || selectedQuery === null) {
        return;
      }

      // create QueryBuilder rule conditions
      const queryResult = await gf.getSelectedQuery(selectedQuery, userInfo);

      if (queryResult.status === "error") {
        throw new Error(`gridView-useEffect() - ${queryResult.errorMessage}`);
      }

      const query = queryResult.records[0];

      const rule = query.query_rules;

      dispatch(setQueryRule(rule));

      if (queryBuilderRef.current !== null) {
        queryBuilderRef.current.setRules(rule);
      }

      console.log("GridView() - Executing selectedQueryChanged");

      // setLoading(false);
      // return;

      const executeQueryResult = await runQuery();

      if (executeQueryResult === undefined) {
        setLoading = false;
        return;
      }

      if (executeQueryResult.status !== "ok") {
        // showToast(
        //   "GridToolbar() - Error retrieving query templates",
        //   result.errorMessage,
        //   "Error!",
        //   0,
        //   true
        // );
        console.log(executeQueryResult.errorMessage);
        setLoading(false);
        return;
      }

      let queryData = executeQueryResult.records[0];

      // convert date strings to objects
      // queryData.forEach((r) => {});

      // store query results in global state
      // console.log("GridToolbar() - Storing query results state");
      // dispatch(setGridData(queryResult));

      // update grid row state
      setRowData(queryData);
      setLoading(false);
    };

    queryChanged();
  }, [selectedQuery, dispatch, userInfo]);

  // update the query text after rule change
  useEffect(() => {
    const validRule = queryBuilderRef.current.getRules();
    let queryContent = null;

    if (jsonButton.current.checked) {
      queryContent = JSON.stringify(validRule, null, 4);
    } else {
      queryContent = queryBuilderRef.current.getSqlFromRules(validRule);
    }

    setQueryRuleText(queryContent);
  }, [queryRule, queryBuilderRef]);

  const classes = useStyles();

  function changeQueryDisplayType(args) {
    const validRule = queryBuilderRef.current.getRules();
    let queryContent = null;

    if (jsonButton.current.checked) {
      queryContent = JSON.stringify(validRule, null, 4);
    } else {
      queryContent = queryBuilderRef.current.getSqlFromRules(validRule);
    }

    let rows = queryContent.split("\n").length;
    setQueryRuleText(queryContent);
    setQueryContentRows(rows);
  }

  // QUERYBUILDER EVENT HANDLERS
  function getQueryOperators(rulesArray) {
    let result = [];

    function helper(rulesArray) {
      if (rulesArray.length === 0) {
        return;
      }

      const rule = rulesArray[0];
      if (rule.rules === undefined) {
        result.push(rule.operator);
      }

      helper(rulesArray.pop());
    }

    helper(rulesArray);

    return result;
  }

  function getFieldDataType(fieldName, objFields) {
    let fieldDataType = null;

    // const objMetadata = metadataMap.get(objName);
    // const objFields = objMetadata.fields;
    const objField = objFields.find((f) => f.name === fieldName);
    fieldDataType = objField.dataType;
    return fieldDataType;
  }

  function processRule(rule, objFields) {
    try {
      const { field, label, operator, type, value } = rule;

      const fieldDataType = getFieldDataType(field, objFields);

      // to support between operation
      // between only for non-string values
      let filterStartValue = null;
      let filterEndValue = null;

      // if operator === 'picklist'
      // create a comma-seperated list for the SOQL IN clause
      // picklist operator valid for string values only
      let valuesArray = [];
      let filterValue = null;
      let filterValues = [];
      if (fieldDataType === "picklist") {
        const numValues = value.length;
        value.forEach((el, index) => {
          filterValues = filterValues + `'${el}'`;
          if (index < numValues - 1) {
            filterValues = filterValues + ", ";
          }
        });
      } else if (operator == "between" || operator == "notBetween") {
        filterStartValue = value[0];
        filterEndValue = value[1];
      } else {
        filterValue = value;
      }

      let whereClause = "";

      switch (operator) {
        case "equal":
          if (
            fieldDataType === "decimal" ||
            fieldDataType === "currency" ||
            fieldDataType === "double" ||
            fieldDataType === "integer" ||
            fieldDataType === "long" ||
            fieldDataType === "boolean"
          ) {
            // non-string values are not quoted
            return {
              sql: `${field} = ${filterValue}`,
            };
          } else if (
            fieldDataType === "string" ||
            fieldDataType === "encryptedstring" ||
            fieldDataType === "id"
          ) {
            // string values are quoted
            return { sql: `${field} = '${filterValue}'` };
          } else if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} = ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} = ${aDateLiteral}` };
          } else if (fieldDataType === "picklist") {
            // picklist input field is multi-select
            // so implement using IN
            return { sql: `${field} IN (${filterValues})` };
          } else {
            // treat other data types as string
            // NEED TO REVIEW THIS EX: BLOBS, ETC.
            return { sql: `${field} = '${filterValues}'` };
          }
          break;
        case "notequal":
          // value could be a string or number
          if (
            fieldDataType === "decimal" ||
            fieldDataType === "currency" ||
            fieldDataType === "double" ||
            fieldDataType === "integer" ||
            fieldDataType === "long" ||
            fieldDataType === "boolean"
          ) {
            return { sql: `${field} <> ${filterValue}` };
          } else if (
            fieldDataType === "string" ||
            fieldDataType === "encryptedstring" ||
            fieldDataType === "id"
          ) {
            // string values are quoted
            return { sql: `${field} <> '${filterValue}'` };
          } else if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} <> ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} <> ${aDateLiteral}` };
          } else if (fieldDataType === "picklist") {
            // picklist input field is multi-select
            // so implement using IN
            return {
              sql: `NOT ${field} IN (${filterValues})`,
            };
          } else {
            return { sql: `${field} <> '${filterValue}'` };
          }
          break;
        case "in":
          // soql in clause needs comma-seperated list of values
          // get the values

          return { sql: `${field} IN (${filterValues})` };

          break;
        case "notin":
          // soql in clause needs comma-seperated list of values
          // get the values

          return { sql: `NOT ${field} IN (${filterValues})` };

          break;
        case "contains":
          // convert to LIKE
          return { sql: `${field} LIKE '%${filterValue}%'` };
          break;
        case "notcontains":
          // convert to LIKE
          return {
            sql: `NOT ${field} LIKE '%${filterValue}%'`,
          };
          break;
        case "lessthanorequal":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} <= ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} <= ${aDateLiteral}` };
          } else {
            return { sql: `${field} <= ${filterValue}` };
          }
          break;
        case "greaterorequal":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} >= ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} >= ${aDateLiteral}` };
          } else {
            return { sql: `${field} >= ${filterValue}` };
          }
          break;
        case "lessthan":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} < ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} < ${aDateLiteral}` };
          } else {
            return { sql: `${field} < ${filterValue}` };
          }
          break;
        case "greaterthan":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return { sql: `${field} > ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = JSON.stringify(aDate);
            return {
              sql: `${field} > ${aDateLiteral}`,
              filterValue: [],
            };
          } else {
            return { sql: `${field} > ${filterValue}` };
          }
          break;
        case "beginswith":
          // valid for text
          return { sql: `${field} LIKE '${filterValue}%'` };
          break;
        case "notbeginswith":
          // valid for text
          return {
            sql: `NOT ${field} LIKE '${filterValue}%'`,
          };
          break;
        case "endswith":
          // valid for text
          return { sql: `${field} LIKE '%${filterValue}'` };
          break;
        case "notendswith":
          // valid for text
          return {
            sql: `NOT ${field} LIKE '%${filterValue}'`,
          };
          break;
        case "between":
          // for date and number fields
          if (fieldDataType === "date") {
            const startDate = new Date(filterStartValue);
            const startDateLiteral = JSON.stringify(startDate);
            const endDate = new Date(filterEndValue);
            const endDateLiteral = JSON.stringify(endDate);
            return {
              sql: `${field} >= ${startDateLiteral} AND ${field} <= ${endDateLiteral}`,
            };
          } else if (fieldDataType === "datetime") {
            const startDate = new Date(filterStartValue);
            const startDateLiteral = JSON.stringify(startDate);
            const endDate = new Date(filterEndValue);
            const endDateLiteral = JSON.stringify(endDate);
            return {
              sql: `${field} >= ${startDateLiteral} AND ${field} <= ${endDateLiteral}`,
            };
          } else {
            return {
              sql: `${field} >= ${filterValue.start} AND ${field} <= ${filterValue.end}`,
            };
          }
          break;
        case "notbetween": {
          // for non-string values
          if (fieldDataType === "date") {
            const startDate = new Date(filterStartValue);
            const startDateLiteral = JSON.stringify(startDate);
            const endDate = new Date(filterEndValue);
            const endDateLiteral = JSON.stringify(endDate);
            return {
              sql: `${field} < ${startDateLiteral} OR ${field} > ${endDateLiteral}`,
            };
            break;
          } else if (fieldDataType === "datetime") {
            const startDate = new Date(filterStartValue);
            const startDateLiteral = JSON.stringify(startDate);
            const endDate = new Date(filterEndValue);
            const endDateLiteral = JSON.stringify(endDate);
            return {
              sql: `${field} < ${startDateLiteral} OR ${field} > ${endDateLiteral}`,
            };
            break;
          }
          break;
        }
        case "isnull": {
          return { sql: `${field} = null` };
          break;
        }
        case "isnotnull": {
          return { sql: `${field} != null` };
          break;
        }
        default: {
          // revisit this as we want to filter out queries with blobs, etc.
          return { sql: `${field} = '${filterValue}'` };
        }
      }
    } catch (error) {
      return { status: "error", errorMessage: error.message };
    }
  }

  function processGroup(ruleGroup, objFields, objName, result) {
    const groupCondition = ruleGroup.condition;
    const rules = ruleGroup.rules;
    let queryStr = "";

    const groupResult = [];

    rules.forEach((rule) => {
      if (rule.rules === undefined) {
        const response = processRule(rule, objFields);
        groupResult.push(response.sql);
      } else {
        const ruleObj = {
          condition: rule.condition,
          rules: rule.rules,
        };
        processGroup(ruleObj, objFields, objName, result);
      }
    });

    if (groupResult.length > 1) {
      queryStr = groupResult.join(` ${groupCondition.toUpperCase()} `);
      queryStr = `${queryStr}`;
    } else {
      queryStr = groupResult[0];
    }

    result.push(`(${queryStr})`);
  }

  function getQuerySQL(query, objFields, objName) {
    let result = [];
    const sql = "";

    const outerCondition = query.condition;

    const rules = query.rules;

    rules.forEach((rule) => {
      // a rule can be a group
      if (rule.rules) {
        const groupObj = {
          condition: rule.condition,
          rules: rule.rules,
        };
        processGroup(groupObj, objFields, objName, result);
      } else {
        const response = processRule(rule, objFields);
        result.push(response.sql);
      }
    });

    let queryStr = "";
    if (result.length > 1) {
      queryStr = result.join(` ${outerCondition.toUpperCase()} `);
    } else {
      queryStr = result[0];
    }

    console.log(queryStr);
    return queryStr;
  }

  async function runQuery() {
    setLoading(true);
    const query = queryBuilderRef.current.getRules();
    const ruleStr = queryBuilderRef.current.getSqlFromRules(query);

    // get object metadata
    const metadataResult = await gf.getObjectMetadata(
      selectedObject.id,
      userInfo,
      objectMetadata
    );

    if (metadataResult.status !== "ok") {
      throw new Error(`runQuery() - ${metadataResult.errorMessage}`);
    }

    const objMetadata = metadataResult.records;

    let objMetadataFields = objMetadata.metadata.fields;

    // create the SOQL
    const rules = query.rules;

    const sqlResult = getQuerySQL(query, objMetadataFields, selectedObject.id);

    const executeQueryResult = await gf.runQuery(selectedObject.id, sqlResult);

    if (executeQueryResult.status !== "ok") {
      // showToast(
      //   "GridToolbar() - Error retrieving query templates",
      //   result.errorMessage,
      //   "Error!",
      //   0,
      //   true
      // );
      console.log(executeQueryResult.errorMessage);
      setLoading(false);
      return;
    }

    let queryData = executeQueryResult.records[0];

    // convert date strings to objects
    // queryData.forEach((r) => {});

    // store query results in global state
    // console.log("GridToolbar() - Storing query results state");
    // dispatch(setGridData(queryResult));

    // update grid row state
    setRowData(queryData);
    setLoading(false);
  }

  async function saveQuery() {
    try {
      setLoading(true);
      // get the query record and determine if the current user is the owner
      const queryUrl = "/postgres/knexSelect";
      const queryResult = await gf.getQuery(selectedQuery.id, userInfo);
      if (queryResult.status !== "ok") {
        throw new Error(`gridView-saveQuery() - ${queryResult.errorMessage}`);
      }

      const currentRule = queryBuilderRef.current.getRules();

      // always returns 1 record
      const queryRec = queryResult.records[0];

      let queryName = "";
      if (queryRec.owner !== userInfo.userEmail) {
        // save as private query
        // prompt user for name
        setOpenSaveDialog(true);
        return;
      }

      const insertUrl = "/postgres/knexInsert";

      const insertColumns = [
        "id",
        "name",
        "owner",
        "object",
        "is_public",
        "query_rules",
        "is_active",
        "orgid",
      ];

      const insertValues = {
        id: selectedQuery.id,
        name: selectedQuery.label,
        owner: userInfo.userEmail,
        object: selectedObject.id,
        is_public: false,
        query_rules: currentRule,
        is_active: true,
        orgid: userInfo.organizationId,
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
        throw new Error(`gridView-saveQuery() - ${insertResponse.message}`);
      }

      let insertResult = await insertResponse.json();
      const newQuery = insertResult.records[0];

      // notify user
      const snackOptions = {
        variant: "success",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
        TransitionComponent: Slide,
      };

      const key = enqueueSnackbar("Query Saved", snackOptions);

      // update query text
      let queryContent = null;
      if (jsonButton.current.checked) {
        queryContent = queryBuilderRef.current.getSqlFromRules(currentRule);
      } else {
        queryContent = JSON.stringify(currentRule, null, 4);
      }

      setQueryRuleText(queryContent);

      // adds the query to the grid query selector options
      // let queryOps = [...queryOptions];
      // const newOpt = {
      //   id: newQuery.name,
      //   label: newQuery.name,
      // };
      // queryOps.push(newOpt);
      // dispatch(setQueryOptions(queryOps));

      // set the selected query to the new value
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error.message);
      return;
    }
  }

  async function showQueryPanel() {
    // if (this.props.queryPanelVisible === true) {
    //   this.dispatch(setQueryPanelVisible(false));
    // } else {
    //   this.dispatch(setQueryPanelVisible(true));
    // }
    const a = this;
    this.props.setQueryPanelVisible(false);
  }

  function numberChange(event) {
    const args = this.state;
    let elem = document
      .getElementById(args.ruleID)
      .querySelector(".e-rule-value");
    queryBuilderRef.notifyChange(event.value, elem, "value");
  }

  function checkBoxChange(event) {
    const a = 1;
  }

  // GRID EVENT HANDLERS
  function gridCellValueChanged(params) {
    const rowIndex = params.rowIndex;
    const columnName = params.column;
    const columnDef = params.columnDef;
    const oldValue = params.oldValue;
    const newValue = params.newValue;
  }

  // The client has set new data into the grid using api.setRowData() or by
  // changing the rowData bound property.
  function gridRowDataChanged(params) {
    const api = params.api;
    const columnApi = params.columnApi;
  }

  function gridRowSelected(params) {
    const api = params.api;
    const columnApi = params.columnApi;
    const data = params.data;
    const rowIndex = params.rowIndex;
  }

  // A cell's value within a row has changed. This event corresponds to Full Row Editing only.
  function gridRowValueChanged(params) {
    const api = params.api;
    const columnApi = params.columnApi;
    const data = params.data;
    const rowIndex = params.rowIndex;
  }

  function gridSelectionChanged(params) {
    const api = params.api;
    const columnApi = params.columnApi;
  }

  function expandOrCollapseAll(params) {
    const api = params.api;
    const columnApi = params.columnApi;
  }

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      sortable: true,
      resizable: true,
      filter: true,
      minWidth: 150,
    };
  }, []);

  function onGridReady(e) {
    // autoSizeAll(false);
    // e.columnApi.resetColumnState();
  }

  const autoSizeAll = useCallback((skipHeader) => {
    const allColumnIds = [];
    gridRef.current.columnApi.getAllColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);
  }, []);

  // MUI save Dialog
  const [openSaveDialog, setOpenSaveDialog] = React.useState(false);

  const handleSaveQueryOpen = () => {
    setOpenSaveDialog(true);
  };

  async function handleSaveQueryClose(e) {
    setOpenSaveDialog(false);
    const queryName = saveQueryText;

    const currentRule = queryBuilderRef.current.getRules();

    // save a new query
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
      name: queryName,
      owner: userInfo.userEmail,
      object: selectedObject.id,
      is_public: false,
      query_rules: currentRule,
      is_active: true,
      orgid: userInfo.organizationId,
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
      throw new Error(`gridView-saveQuery() - ${insertResponse.message}`);
    }

    let insertResult = await insertResponse.json();
    const newQuery = insertResult.records[0];

    // notify user
    const snackOptions = {
      variant: "success",
      autoHideDuration: 5000,
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
      TransitionComponent: Slide,
    };

    const key = enqueueSnackbar("Query Saved", snackOptions);

    // update query text
    let queryContent = null;
    if (jsonButton.current.checked) {
      queryContent = queryBuilderRef.current.getSqlFromRules(currentRule);
    } else {
      queryContent = JSON.stringify(currentRule, null, 4);
    }

    setQueryRuleText(queryContent);
  }

  const handleCancelQueryClose = (e) => {
    setOpenSaveDialog(false);
  };

  // Implementation of setTextValue method
  function setTextValue(event) {
    setSaveQueryText(event.target.value);
  }

  // QueryBuilder select options mapping
  const multiSelectMapping = { text: "text", value: "value" };

  function checkboxTemplate(props) {
    return <CheckboxTemplate {...props} />;
  }

  function currencyTemplate(props) {
    return <CurrencyTemplate {...props} />;
  }

  function dateTemplate(props) {
    return <DateTemplate {...props} />;
  }

  function decimalTemplate(props) {
    return <DecimalTemplate {...props} />;
  }

  function integerTemplate(props) {
    return <IntegerTemplate {...props} />;
  }

  function percentTemplate(props) {
    return <PercentTemplate {...props} />;
  }

  function selectTemplate(props) {
    return <SelectTemplate {...props} />;
  }

  function textTemplate(props) {
    return <TextTemplate {...props} />;
  }

  function queryBuilderRuleChanged(args) {
    dispatch(setQueryRule(args.rule));
  }

  console.log("Rendering View");
  console.log(queryRule);

  return (
    <LoadingOverlay
      active={loading}
      spinner={<GridLoader />}
      styles={{
        overlay: (base) => ({
          ...base,
          background: "rgba(53, 71, 103, 0.5)",
        }),
        wrapper: {
          width: "400px",
          height: "400px",
        },
      }}
    >
      <Box
        sx={{
          left: () => {
            if (sidebarSize === "visible") {
              return 60;
            } else {
              return 0;
            }
          },
        }}
        className={classes.gridStyle}
      >
        <Dialog open={openSaveDialog} onClose={handleSaveQueryClose}>
          <DialogTitle>Save Query</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Only query owner can make changes to this query. Enter a query
              name to save as a private query.
            </DialogContentText>
            <TextField
              ref={saveQueryTextField}
              autoFocus
              margin='dense'
              id='name'
              label='Name'
              type='text'
              fullWidth
              variant='standard'
              onChange={setTextValue}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelQueryClose}>Cancel</Button>
            <Button onClick={handleSaveQueryClose}>Save</Button>
          </DialogActions>
        </Dialog>

        {/* object, template & query selectors */}
        <Toolbar
          variant='dense'
          sx={{
            mb: 2,
            mt: 2,
          }}
        >
          <Autocomplete
            id='objectSelector'
            autoComplete
            includeInputInList
            options={objectOptions}
            ref={objectSelectorRef}
            value={selectedObject}
            renderInput={(params) => (
              <TextField {...params} label='Org Objects' variant='standard' />
            )}
            onChange={async (event, newValue) => {
              setLoading(true);

              console.log("Selected object changed");

              // store selected object in global state
              dispatch(setSelectedObject(newValue));

              return;
            }}
            sx={{ width: 175 }}
          />

          <Autocomplete
            id='templateSelector'
            autoComplete
            includeInputInList
            options={templateOptions}
            value={selectedTemplate}
            ref={templateSelectorRef}
            renderInput={(params) => (
              <TextField {...params} label='Templates' variant='standard' />
            )}
            onChange={async (event, newValue) => {
              dispatch(setSelectedTemplate(newValue));
              return;
            }}
            sx={{ ml: 5, width: 225 }}
          />

          <Autocomplete
            id='querySelector'
            autoComplete
            includeInputInList
            options={queryOptions}
            value={selectedQuery}
            ref={querySelectorRef}
            renderInput={(params) => (
              <TextField {...params} label='Queries' variant='standard' />
            )}
            onChange={(event, newValue) => {
              dispatch(setSelectedQuery(newValue));
              return;
            }}
            sx={{ ml: 5, width: 225 }}
          />
        </Toolbar>

        {/* grid toolbar */}
        <Toolbar
          variant='dense'
          sx={{
            mb: 3,
            mt: 0,
          }}
        >
          {/* add button */}
          <Tooltip title='Add' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
                ml: -2,
              }}
              aria-label='Add'
              size='medium'
              onClick={() => {}}
            >
              <AddOutlinedIcon />
            </IconButton>
          </Tooltip>

          {/* edit button */}
          <Tooltip title='Edit' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
              }}
              aria-label='Edit'
              size='medium'
              onClick={() => {}}
            >
              <EditOutlinedIcon />
            </IconButton>
          </Tooltip>

          {/* delete button */}
          <Tooltip title='Delete' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
              }}
              aria-label='Delete'
              size='medium'
              onClick={() => {}}
            >
              <DeleteOutlinedIcon />
            </IconButton>
          </Tooltip>

          {/* search button */}
          <Tooltip title='Search' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
              }}
              aria-label='Search'
              size='medium'
              onClick={() => {
                if (queryVisible) {
                  setQueryVisible(false);
                } else {
                  setQueryVisible(true);
                }
              }}
            >
              <SearchOutlinedIcon />
            </IconButton>
          </Tooltip>

          {/* clear filters button */}
          <Tooltip title='Clear Filters' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
              }}
              aria-label='Clear Filters'
              size='medium'
              onClick={() => {}}
            >
              <FilterAltOffOutlinedIcon />
            </IconButton>
          </Tooltip>

          {/* favorites button */}
          <Tooltip title='Favorites' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
              }}
              aria-label='Favorites'
              size='medium'
              onClick={() => {}}
            >
              <FavoriteBorderOutlinedIcon />
            </IconButton>
          </Tooltip>

          {/* relationships button */}
          <Tooltip title='Relationships' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
              }}
              aria-label='Relationships'
              size='medium'
              onClick={() => {}}
            >
              <DoubleArrowOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>

        {/* query builder and query panel */}
        <Box
          sx={{
            display: () => {
              if (queryVisible === true) {
                return "flex";
              } else {
                return "none";
              }
            },
            flexDirection: "column",
            justifyContent: "flex-start",
            mt: -2,
            ml: 2,
            mr: 2,
            mb: 3,
            width: "90%",
            height: "50%",
            overflow: "auto",
          }}
          border={2}
          borderColor={"primary.main"}
          padding={2}
          // marginBottom={"10px"}
        >
          <Stack
            flexDirection='row'
            sx={{
              width: "100%",
            }}
          >
            {/* query builder */}
            <Box
              sx={{
                width: "60%",
              }}
            >
              <Stack
                direction={"row"}
                sx={{
                  ml: 1,
                  mb: 2,
                }}
              >
                {/* run query */}
                <Button
                  id='runQueryBtn'
                  variant='contained'
                  onClick={() => {
                    runQuery();
                  }}
                  size='small'
                  sx={{
                    mt: 2,
                  }}
                >
                  Run Query
                </Button>

                {/* save query */}
                <Button
                  id='saveQueryBtn'
                  variant='contained'
                  size='small'
                  onClick={() => {
                    saveQuery();
                  }}
                  sx={{
                    mt: 2,
                    ml: 5,
                  }}
                >
                  Save Query
                </Button>

                {/* show query */}
                <Button
                  id='showQueryBtn'
                  variant='contained'
                  size='small'
                  onClick={() => {
                    if (queryPanelVisible) {
                      dispatch(setQueryPanelVisible(false));
                    } else {
                      dispatch(setQueryPanelVisible(true));
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
              <QueryBuilderComponent
                id='querybuilder'
                dataSource={rowData}
                ref={queryBuilderRef}
                rule={queryRule}
                sortDirection={"Ascending"}
              >
                <ColumnsDirective>
                  {queryColumns.map((item) => {
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
                            key={item.name}
                            field={item.field}
                            label={item.label}
                            operators={[
                              { key: "Equal", value: "equal" },
                              { key: "Not Equal", value: "notequal" },
                              { key: "Is Null", value: "isnull" },
                              { key: "Is Not Null", value: "isnotnull" },
                            ]}
                            type={item.type}
                            template={checkboxTemplate}
                            enableNotCondition='true'
                          />
                        );
                      }
                      case "currency": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={currencyTemplate}
                            type={item.type}
                          />
                        );
                      }
                      case "date": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={dateTemplate}
                          />
                        );
                      }
                      case "datetime": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={dateTemplate}
                          />
                        );
                      }
                      case "decimal": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={decimalTemplate}
                          />
                        );
                      }
                      case "double": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={decimalTemplate}
                          />
                        );
                      }
                      case "fax": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={textTemplate}
                          />
                        );
                      }
                      case "id": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={textTemplate}
                            type={item.type}
                          />
                        );
                      }
                      case "int": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={integerTemplate}
                          />
                        );
                      }
                      case "long": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={integerTemplate}
                            type={item.type}
                          />
                        );
                      }
                      case "percent": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={percentTemplate}
                            type={item.type}
                          />
                        );
                      }
                      case "phone": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={textTemplate}
                            type={item.type}
                          />
                        );
                      }
                      case "picklist": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            template={selectTemplate}
                          />
                        );
                      }
                      case "reference": {
                        return (
                          <ColumnDirective
                            key={item.name}
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
                            key={item.name}
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
                            template={textTemplate}
                            type={item.type}
                          />
                        );
                      }
                      // default: {
                      //   return (
                      //     <ColumnDirective
                      //       key={item.name}
                      //       field={item.field}
                      //       label={item.label}
                      //       type={item.type}
                      //     />
                      //   );
                      // }
                    }
                  })}
                </ColumnsDirective>
              </QueryBuilderComponent>
            </Box>

            {/* query panel */}
            <Stack
              flexDirection='column'
              display={queryPanelVisible ? "block" : "none"}
              sx={{
                width: "40%",
                ml: 5,
              }}
            >
              {/* json/sql buttons */}
              <Stack
                flexDirection='row'
                sx={{
                  border: 2,
                  borderColor: "blue",
                  mb: 3,
                }}
              >
                {/* json button */}
                <Box
                  sx={{
                    mb: 2,
                  }}
                >
                  <RadioButtonComponent
                    id='jsonButton'
                    label='JSON'
                    name='rule'
                    value='sql'
                    checked={true}
                    change={(args) => changeQueryDisplayType(args)}
                    ref={jsonButton}
                  />
                </Box>
                {/* sql button */}
                <Box
                  sx={{
                    ml: 10,
                  }}
                >
                  <RadioButtonComponent
                    id='sqlButton'
                    label='SQL'
                    marginLeft='10px'
                    name='rule'
                    value='sql'
                    change={(args) => changeQueryDisplayType(args)}
                    ref={sqlButton}
                  />
                </Box>
              </Stack>

              {/* query results */}
              <div>
                <TextField
                  ref={queryRuleContent}
                  multiline
                  fullWidth
                  // rows={queryContentRows}
                  maxRows={8}
                  // maxRows={Infinity}
                  value={queryRuleText}
                />
              </div>
            </Stack>
          </Stack>
        </Box>

        <div style={containerStyle}>
          <div style={gridStyle} className='ag-theme-alpine'>
            <AgGridReact
              defaultColDef={defaultColDef}
              columnDefs={columnDefs}
              enableColResize='true'
              onGridReady={onGridReady}
              onCellValueChanged={gridCellValueChanged}
              onRowDataChanged={gridRowDataChanged}
              onRowSelected={gridRowSelected}
              onSelectionChanged={gridSelectionChanged}
              ref={gridRef}
              rowData={rowData}
              rowBuffer={100}
              rowSelection='multiple'
              suppressColumnVirtualisation={true}
            ></AgGridReact>
          </div>
        </div>
      </Box>
    </LoadingOverlay>
  );
}
