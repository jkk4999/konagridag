// React
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useSelector, useDispatch } from "react-redux";

// React Spinner
import LoadingOverlay from "react-loading-overlay-ts";
import DotLoader from "react-spinners/DotLoader";

// save template dialog
import SaveTemplateDialog from "../../components/saveTemplateDialog/saveTemplateDialog";

// Lodash
import _ from "lodash";

// subviews
import DetailCellRenderer from "../../components/subviewRenderer/subviewRenderer";

// Redux
import { addMetadata } from "../../features/objectMetadataSlice";
import { setLoadingIndicator } from "../../features/loadingIndicatorSlice";

import { setQueryPanelVisible } from "../../features/queryPanelVisabilitySlice";
import { setQueryRule } from "../../features/queryRuleSlice";
import { setRelationPreferences } from "../../features/relationPreferencesSlice";
// must use global statue for selectedObject because
// QueryBuilder templates need access to this state
import { setSelectedObject } from "../../features/selectedObjectSlice";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import AgGridCheckbox from "../../components/aggridCheckboxRenderer";
import GridRelationshipsPanel from "../../components/gridRelationshipsPanel/gridRelationshipsPanel";

// Mui
import { makeStyles } from "@mui/styles";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import { IconButton } from "@mui/material";
import Button from "@mui/material/Button";
import { Checkbox } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { FormControlLabel } from "@mui/material";
import { Stack } from "@mui/material";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Toolbar from "@mui/material/Toolbar";

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

// MUI icons
import AddOutlinedIcon from "@mui/icons-material/Add";
// import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DoubleArrowOutlinedIcon from "@mui/icons-material/DoubleArrowOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SaveTemplateIcon from "@mui/icons-material/ViewColumn";

// Syncfusion
import {
  QueryBuilderComponent,
  ColumnsDirective,
  ColumnDirective,
  // ColumnsModel,
  // RuleModel,
  // RuleChangeEventArgs,
} from "@syncfusion/ej2-react-querybuilder";

import { RadioButtonComponent } from "@syncfusion/ej2-react-buttons";

import * as gf from "./gridFunctions";

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
  const { enqueueSnackbar } = useSnackbar();

  const onClickDismiss = (key) => () => {
    notistackRef.current.closeSnackbar(key);
  };

  const notistackRef = React.createRef();

  // local object references
  const gridRef = useRef(null);
  const saveTemplateGridRef = useRef(null);
  const objectSelectorRef = useRef(null);
  const templateVisibilityRef = useRef(null);
  const templateSelectorRef = useRef(null);
  const querySelectorRef = useRef(null);
  const jsonButton = useRef(null);
  const saveTemplateTextField = useRef(null);
  const saveQueryTextField = useRef(null);
  const selectedGridRow = useRef(null);
  const sqlButton = useRef(null);
  const queryRuleContent = useRef(null);
  const queryBuilderRef = useRef(null);

  // redux global state
  const dispatch = useDispatch();
  const loadingIndicator = useSelector((state) => state.loadingIndicator);
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const queryPanelVisible = useSelector((state) => state.queryPanelVisible);
  const queryRule = useSelector((state) => state.queryRule);
  const relationPreferences = useSelector((state) => state.relationPreferences);
  const selectedObject = useSelector((state) => state.selectedObject);
  const userInfo = useSelector((state) => state.userInfo);

  // grid view local state
  const prevObjectOptions = useRef(null);
  const prevQueryOptions = useRef(null);
  const prevSelectedGridRow = useRef(null);
  const prevSelectedObject = useRef(null);
  const prevSelectedTemplate = useRef(null);
  const prevSelectedQuery = useRef(null);
  const prevTemplateOptions = useRef(null);

  // AgGrid local state
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);

  const [objectOptions, setObjectOptions] = useState([]);
  const [templateOptions, setTemplateOptions] = useState([]);
  const [queryOptions, setQueryOptions] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);

  // QueryBuilder local state
  const prevQueryColumns = useRef(null);
  const [queryColumns, setQueryColumns] = useState([]);

  const [queryRuleText, setQueryRuleText] = useState();
  const [queryVisible, setQueryVisible] = useState(false);

  const [queryContentRows, setQueryContentRows] = useState(5);
  const [saveQueryText, setSaveQueryText] = useState("");
  const [saveTemplateText, setSaveTemplateText] = useState("");

  // save template form
  const [saveTemplateGridCols, setSaveTemplateGridCols] = useState([]);
  const [saveTemplateGridData, setSaveTemplateGridData] = useState([]);
  const [saveTemplateFormOpen, setSaveTemplateFormOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const templateVisibility = useRef(false);

  const sidebarSize = useSelector((state) => state.sidebarSize);
  const isLoggedIn = useSelector((state) => state.isLoggedIn);

  const containerStyle = useMemo(() => ({ width: "95%", height: "90%" }), []);
  const gridStyle = useMemo(
    () => ({ height: "90%", width: "95%", marginLeft: "10px" }),
    []
  );

  const autoGroupColumnDef = useMemo(() => {
    return {
      minWidth: 220,
      cellRendererParams: {
        suppressCount: false,
        checkbox: true,
      },
    };
  }, []);

  // get org objects after user login
  // and set the selected object
  useEffect(() => {
    const loadInitialData = async () => {
      // wait until user has logged in
      if (Object.keys(userInfo).length === 0) {
        return;
      }

      if (_.isEqual(objectOptions, prevObjectOptions.current)) {
        return;
      }

      console.log(`Running get org objects useEffect for userInfo ${userInfo}`);

      setLoadingIndicator(true);
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

        enqueueSnackbar("Error retrieving org objects", snackOptions);

        return "error";
      }

      const data = result.records;
      prevObjectOptions.current = data;
      setObjectOptions(data);

      const selectedObj = data[0];

      // set the selectedObject
      dispatch(setSelectedObject(selectedObj));

      setLoadingIndicator(false);
    };

    loadInitialData();
  }, [objectOptions, userInfo, enqueueSnackbar]);

  /*  when the selected object changes
      1 - get metadata for selected object
      2 - create the queryBuilder columns
      3 - load the template options
      4 - load the query options
      5 - set selected template & query based on preferences or defaults
      6 - get the relationship preferences
      7 - create the subviews based on user relationship preferences
  */
  useEffect(() => {
    const objChanged = async () => {
      if (selectedObject === null || selectedObject.id === "") {
        // setLoadingIndicator(false);
        return;
      }

      // if selectedObject hasn't changed, return
      if (_.isEqual(selectedObject, prevSelectedObject.current)) {
        setLoadingIndicator(false);
        return;
      }

      prevSelectedObject.current = { ...selectedObject };

      console.log(
        `Running selected object changed useEffect for object ${selectedObject.id}`
      );

      let objMetadata = null;

      try {
        objMetadata = objectMetadata.find(
          (f) => f.objName === selectedObject.id
        );

        if (objMetadata === undefined) {
          // get object metadata
          const metadataResult = await gf.getObjectMetadata(
            selectedObject.id,
            userInfo,
            objectMetadata
          );

          if (metadataResult.status !== "ok") {
            throw new Error(
              `Error retrieving metadata for ${selectedObject.id}`
            );
          }

          // store object metadata in global state
          objMetadata = {
            objName: selectedObject.id,
            metadata: metadataResult.records,
          };

          dispatch(addMetadata(objMetadata));
        }

        // create QueryBuilder columns
        const qbColumns = await gf.createQueryBuilderColumns(
          objMetadata.metadata
        );

        setQueryColumns(qbColumns);

        // get templates for selected object
        const templateResult = await gf.getTemplateRecords(
          selectedObject.id,
          userInfo
        );

        if (templateResult.status === "error") {
          throw new Error(`Error getting templates for  ${selectedObject.id}`);
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
        setTemplateOptions(tmpOptions);

        // create the query options list
        const queryResult = await gf.getQueryOptions(
          selectedObject.id,
          userInfo
        );

        if (queryResult.status === "error") {
          throw new Error(
            `Error getting query options for ${selectedObject.id}`
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
        setQueryOptions(qryOptions);

        // check for grid preferences
        const prefResult = await gf.getGridPreferences(
          selectedObject.id, // selectedObject
          false, // is_related
          userInfo // userInfo
        );

        if (prefResult.status === "error") {
          throw new Error(
            `Error retrieving grid preferences for ${selectedObject.id}`
          );
        }

        const prefData = prefResult.records;

        if (prefData.length > 1) {
          throw new Error(
            `Error - Found more than 1 grid preference for ${selectedObject.id}`
          );
        }

        if (prefData.length === 1) {
          // get template preferenceId
          const templatePrefId = Number(prefData[0].templateid);

          // find the template option with this Id
          const tmpOption = tmpOptions.find((o) => o.id === templatePrefId);

          // use this template
          setSelectedTemplate(tmpOption);

          // get query preferenceId
          const queryPrefId = Number(prefData[0].queryid);

          // find the query option with this Id
          const queryOption = qryOptions.find((o) => o.id === queryPrefId);

          // use this template
          setSelectedQuery(queryOption);

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
            `Error retrieving template defaults for ${selectedObject.id}`
          );
        }

        const defaultTemplates = defaultTemplateResult.records;

        if (defaultTemplates.length > 1) {
          // default templates only valid for public templates
          // there should only be 1 default template per object
          throw new Error(
            `Error - found more than 1 default template for ${selectedObject.id}`
          );
        }

        if (defaultTemplates.length === 1) {
          const defaultTemplate = defaultTemplates[0];

          // find the template option with this Id
          const templateOption = tmpOptions.find(
            (t) => t.id === Number(defaultTemplate.id)
          );

          // use this template
          setSelectedTemplate(templateOption);
        }

        if (defaultTemplates.length === 0) {
          // pick the first option
          // use this template
          setSelectedTemplate(tmpOptions[0]);
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
            `Error retrieving query defaults for ${selectedObject.id}`
          );
        }

        const defaultQueries = defaultQueryResult.records;

        if (defaultQueries.length > 1) {
          // default queries only valid for public queries
          // there should only be 1 default query per object
          throw new Error(
            `Error - found more than 1 default query for ${selectedObject.id}`
          );
        }

        if (defaultQueries.length === 1) {
          const defaultQuery = defaultQueries[0];

          // find the query option with this Id
          const queryOption = qryOptions.find(
            (t) => t.id === Number(defaultQuery.id)
          );

          // use this query
          setSelectedTemplate(queryOption);
        }

        if (defaultQueries.length === 0) {
          // pick the first one
          setSelectedQuery(qryOptions[0]);
        }

        // create the sub views
        const result = await gf.getRelationshipPreferences(userInfo);
        if (result.status === "error") {
          throw new Error(result.errorMessage);
        }

        const relPreferences = result.records;

        if (relPreferences.length === 1) {
          const allObjPrefs = relPreferences[0].preferences; // array

          // find the relationship preferences for the selected object
          const objRelPrefs = allObjPrefs.find(
            (p) => p.object === selectedObject.id
          );

          if (!objRelPrefs) {
            return;
          }

          const prefs = objRelPrefs.relations;

          // get metadata if needed
          prefs.forEach((p) => {
            // get metadata if needed
            gf.getObjectMetadata(p.obj, userInfo, objectMetadata)
              .then((res) => {
                if (res.status === "error") {
                  throw new Error(
                    "Error retrieving metadata for grid relationships"
                  );
                }

                const objMetadata = res.records;

                const hasMetadata = objectMetadata.find(
                  (f) => f.objName === p.obj
                );

                if (hasMetadata === undefined) {
                  const newObjMetadata = {
                    objName: p.obj,
                    metadata: objMetadata,
                  };

                  dispatch(addMetadata(newObjMetadata));
                }
              })
              .catch((error) => {
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

                enqueueSnackbar(error.message, snackOptions);
              });
          });

          dispatch(setRelationPreferences(result.records[0].preferences));
        }

        setLoadingIndicator(false);
      } catch (error) {
        setLoadingIndicator(false);

        // log error and notify user
        console.log(error.message);

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

        enqueueSnackbar(error.message, snackOptions);
      }
    };

    objChanged();
  }, [selectedObject, enqueueSnackbar, objectMetadata, dispatch, userInfo]);

  /*  when the selectedTemplate changes
    1 - create the grid columns
  */
  useEffect(() => {
    const tmpChanged = async () => {
      if (!selectedTemplate || Object.keys(selectedTemplate).length === 0) {
        setLoadingIndicator(false);
        return;
      }

      // if selected template hasn't changed, return
      if (_.isEqual(selectedTemplate, prevSelectedTemplate.current)) {
        setLoadingIndicator(false);
        return;
      }

      prevSelectedTemplate.current = { ...selectedTemplate };

      console.log(
        `Running selected template changed useEffect for template ${selectedTemplate.label}`
      );

      try {
        setLoadingIndicator(true);

        // get the template fields for selected template
        const templateFieldResult = await gf.getTemplateFields(
          selectedTemplate
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
          objectMetadata,
          gridRef
        );

        setColumnDefs(gridCols);

        setLoadingIndicator(false);
      } catch (error) {
        setLoadingIndicator(false);
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

        enqueueSnackbar(error.message, snackOptions);
      }
    };

    tmpChanged();
  });

  // update the QueryBuilder rules when the selected query changes
  // and run the query
  useEffect(() => {
    const queryChanged = async () => {
      const getQuerySQL = (query, objFields, objName) => {
        let result = [];

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
      };

      const processGroup = (ruleGroup, objFields, objName, result) => {
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
      };

      const processRule = (rule, objFields) => {
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
          } else if (operator === "between" || operator === "notBetween") {
            filterStartValue = value[0];
            filterEndValue = value[1];
          } else {
            filterValue = value;
          }

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
            case "in":
              // soql in clause needs comma-seperated list of values
              // get the values

              return { sql: `${field} IN (${filterValues})` };
            case "notin":
              // soql in clause needs comma-seperated list of values
              // get the values

              return { sql: `NOT ${field} IN (${filterValues})` };
            case "contains":
              // convert to LIKE
              return { sql: `${field} LIKE '%${filterValue}%'` };
            case "notcontains":
              // convert to LIKE
              return {
                sql: `NOT ${field} LIKE '%${filterValue}%'`,
              };
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
            case "beginswith":
              // valid for text
              return { sql: `${field} LIKE '${filterValue}%'` };
            case "notbeginswith":
              // valid for text
              return {
                sql: `NOT ${field} LIKE '${filterValue}%'`,
              };
            case "endswith":
              // valid for text
              return { sql: `${field} LIKE '%${filterValue}'` };
            case "notendswith":
              // valid for text
              return {
                sql: `NOT ${field} LIKE '%${filterValue}'`,
              };
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
              } else if (fieldDataType === "datetime") {
                const startDate = new Date(filterStartValue);
                const startDateLiteral = JSON.stringify(startDate);
                const endDate = new Date(filterEndValue);
                const endDateLiteral = JSON.stringify(endDate);
                return {
                  sql: `${field} < ${startDateLiteral} OR ${field} > ${endDateLiteral}`,
                };
              }
            }
            case "isnull": {
              return { sql: `${field} = null` };
            }
            case "isnotnull": {
              return { sql: `${field} != null` };
            }
            default: {
              // revisit this as we want to filter out queries with blobs, etc.
              return { sql: `${field} = '${filterValue}'` };
            }
          }
        } catch (error) {
          return { status: "error", errorMessage: error.message };
        }
      };

      try {
        if (
          !selectedObject ||
          !selectedQuery ||
          Object.keys(selectedObject).length === 0 ||
          Object.keys(selectedQuery).length === 0
        ) {
          return;
        }

        // if selected query hasn't changed, return
        if (_.isEqual(selectedQuery, prevSelectedQuery.current)) {
          return;
        }

        console.log(
          `Running QueryBuilder useEffect for query ${selectedQuery.id}`
        );

        prevSelectedQuery.current = { ...selectedQuery };

        // get query from database
        const queryResult = await gf.getSelectedQuery(selectedQuery, userInfo);

        if (queryResult.status === "error") {
          throw new Error(`gridView-useEffect() - ${queryResult.errorMessage}`);
        }

        const query = queryResult.records[0];

        const rule = query.query_rules;

        // store query rule in local state
        dispatch(setQueryRule(rule));

        // update the query text after rule change
        let queryContent = null;
        if (jsonButton.current.checked) {
          queryContent = JSON.stringify(rule, null, 4);
        } else {
          queryContent = queryBuilderRef.current.getSqlFromRules(rule);
        }

        setQueryRuleText(queryContent);

        // load the rule into the QueryBuilder
        queryBuilderRef.current.setRules(rule);

        // execute the query
        // const executeQueryResult = await runQuery();
        // get object metadata
        const metadataResult = await gf.getObjectMetadata(
          selectedObject.id,
          userInfo,
          objectMetadata
        );

        if (metadataResult.status !== "ok") {
          throw new Error(
            `Error retrieving object metadata in Query useEffect`
          );
        }

        const objMetadata = metadataResult.records;

        let objMetadataFields = objMetadata.metadata.fields;

        const sqlResult = getQuerySQL(
          rule,
          objMetadataFields,
          selectedObject.id
        );

        const executeQueryResult = await gf.runQuery(
          selectedObject.id,
          sqlResult
        );

        if (executeQueryResult.status !== "ok") {
          throw new Error(`Error executing query for ${selectedQuery.id}`);
        }

        let queryData = executeQueryResult.records[0];

        // update grid row state
        setRowData(queryData);
        setLoadingIndicator(false);

        selectedGridRow.current = queryData[0];
      } catch (error) {
        setLoadingIndicator(false);
        console.log(error.message);

        // notify user
        const snackOptions = {
          variant: "error",
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
          TransitionComponent: Slide,
        };

        enqueueSnackbar(error.message, snackOptions);
      }
    };

    queryChanged();
  }, [
    dispatch,
    enqueueSnackbar,
    objectMetadata,
    selectedObject,
    selectedQuery,
    userInfo,
  ]);

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
    // called from the QueryBuilder run query button
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
      } else if (operator === "between" || operator === "notBetween") {
        filterStartValue = value[0];
        filterEndValue = value[1];
      } else {
        filterValue = value;
      }

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
        case "in":
          // soql in clause needs comma-seperated list of values
          // get the values

          return { sql: `${field} IN (${filterValues})` };
        case "notin":
          // soql in clause needs comma-seperated list of values
          // get the values

          return { sql: `NOT ${field} IN (${filterValues})` };
        case "contains":
          // convert to LIKE
          return { sql: `${field} LIKE '%${filterValue}%'` };
        case "notcontains":
          // convert to LIKE
          return {
            sql: `NOT ${field} LIKE '%${filterValue}%'`,
          };
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
        case "beginswith":
          // valid for text
          return { sql: `${field} LIKE '${filterValue}%'` };
        case "notbeginswith":
          // valid for text
          return {
            sql: `NOT ${field} LIKE '${filterValue}%'`,
          };
        case "endswith":
          // valid for text
          return { sql: `${field} LIKE '%${filterValue}'` };
        case "notendswith":
          // valid for text
          return {
            sql: `NOT ${field} LIKE '%${filterValue}'`,
          };
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
          } else if (fieldDataType === "datetime") {
            const startDate = new Date(filterStartValue);
            const startDateLiteral = JSON.stringify(startDate);
            const endDate = new Date(filterEndValue);
            const endDateLiteral = JSON.stringify(endDate);
            return {
              sql: `${field} < ${startDateLiteral} OR ${field} > ${endDateLiteral}`,
            };
          }
        }
        case "isnull": {
          return { sql: `${field} = null` };
        }
        case "isnotnull": {
          return { sql: `${field} != null` };
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

  const runQuery = useCallback(async () => {
    function getQuerySQL(query, objFields, objName) {
      let result = [];

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

    try {
      // executes query based on queryBuilder rule
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

      const sqlResult = getQuerySQL(
        query,
        objMetadataFields,
        selectedObject.id
      );

      const executeQueryResult = await gf.runQuery(
        selectedObject.id,
        sqlResult
      );

      if (executeQueryResult.status !== "ok") {
        console.log(executeQueryResult.errorMessage);
        throw new Error("Error executing query");
      }

      let queryData = executeQueryResult.records[0];

      // update grid row state
      setRowData(queryData);
    } catch (error) {
      console.log(error.message);

      // notify user
      const snackOptions = {
        variant: "error",
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
        TransitionComponent: Slide,
      };

      enqueueSnackbar("Error executing query", snackOptions);
    }
  }, [
    enqueueSnackbar,
    objectMetadata,
    selectedObject,
    userInfo,
    processGroup,
    processRule,
  ]);

  // TEMPLATE FUNCTIONS

  async function saveTemplate() {
    // called from Grid toolbar

    /* template rules order

        1 - non-admin users can only create private templates

        2 - only the owner of the template can update it
        
        3 - if the templateInputName is different from the selectedTemplate name
        then create a new template, else update existing template

        4 - if a non-admin user is not the owner of the template, then
        create a private template

        5 - if an admin user is not the owner of the template, then create
        a new template which has visibility determined by the public checkbox in
        the save template dialog.  the public checkbox is enabled for sys admins only

    */

    try {
      // get the selected template and determine if the current user is the owner
      let templateName = "";

      if (selectedTemplate) {
        const templateUrl = "/postgres/knexSelect";
        const templateResult = await gf.getTemplate(
          selectedTemplate.id,
          userInfo
        );
        if (templateResult.status !== "ok") {
          throw new Error(
            `gridView-saveTemplate() - ${templateResult.errorMessage}`
          );
        }

        // always returns 1 record
        const templateRec = templateResult.records[0];

        if (templateRec.owner === userInfo.userEmail) {
          setSaveTemplateName(templateRec.template_name);
        } else {
          setSaveTemplateName("");
        }
      }

      // get the visible grid columns
      const visibleColumns = [];
      const gridColumns = gridRef.current.columnApi.getAllGridColumns();
      gridColumns.forEach((g) => {
        // get column def
        const def = gridRef.current.columnApi.getColumn(g.colId);
        if (
          def.colDef.field &&
          (def.visible || def.colDef.rowGroup || def.rowGroupActive)
        ) {
          visibleColumns.push(g);
        }
      });

      // create the template records
      const templateRecs = gf.createSaveTemplateRecords(
        selectedObject.id,
        visibleColumns,
        objectMetadata,
        selectedTemplate
      );

      // create the save template grid columns
      const saveTemplateGridCols = [
        {
          field: "name",
          headerName: "Name",
          editable: false,
          minWidth: 200,
          pinned: "left",
        },
        {
          field: "sort",
          headerName: "Sort",
          cellEditor: "agRichSelectCellEditor",
          cellEditorPopup: true,
          cellEditorParams: {
            values: ["", "asc", "desc"],
            cellHeight: 30,
            searchDebounceDelay: 500,
            formatValue: (value) => value.text,
          },
          editable: true,
          filterParams: {
            // can be 'windows' or 'mac'
            excelMode: "mac",
          },
          resizable: false,
          width: 125,
        },
        {
          field: "split",
          headerName: "Split",
          cellRenderer: AgGridCheckbox,
          editable: true,
          filterParams: {
            excelMode: "mac",
          },
          resizable: false,
          width: 125,
        },
        {
          field: "group",
          headerName: "Group",
          cellRenderer: AgGridCheckbox,
          editable: true,
          filterParams: {
            excelMode: "mac",
          },
          resizable: false,
          width: 125,
        },
        {
          field: "aggregation",
          headerName: "Agg Func",
          cellEditor: "agRichSelectCellEditor",
          cellEditorPopup: true,
          cellEditorParams: {
            values: ["", "sum", "min", "max", "avg", "count"],
            cellHeight: 30,
            searchDebounceDelay: 500,
            formatValue: (value) => value.text,
          },
          editable: true,
          filterParams: {
            // can be 'windows' or 'mac'
            excelMode: "mac",
          },
          resizable: false,
          width: 150,
        },
        {
          field: "sort_index",
          headerName: "Sort Index",
          hide: true,
          resizable: false,
          width: 150,
        },
        {
          field: "filter",
          headerName: "Filter",
          cellRenderer: AgGridCheckbox,
          editable: true,
          filterParams: {
            excelMode: "mac",
          },
          hide: true,
          resizable: false,
          width: 100,
        },
        {
          field: "column_order",
          headerName: "Column Order",
          editable: false,
          hide: true,
          resizable: false,
          minWidth: 150,
        },
        {
          field: "templateid",
          headerName: "Template Id",
          editable: false,
          hide: true,
          resizable: false,
          minWidth: 100,
        },
        {
          field: "datatype",
          headerName: "Data Type",
          editable: false,
          hide: true,
          resizable: false,
          minWidth: 150,
        },
      ];

      // opens the save template dialog form
      setSaveTemplateGridCols(saveTemplateGridCols);
      setSaveTemplateGridData(templateRecs);
      setSaveTemplateFormOpen(true);
    } catch (error) {
      console.log(error.message);
      return;
    }
  }

  async function saveQuery() {
    try {
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
        key: "id",
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
    } catch (error) {
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

  function ruleChanged(event) {
    if (event.type === "deleteRule") {
      const validRule = queryBuilderRef.current.getRules();
      dispatch(setQueryRule(validRule));
      // let queryContent = null;

      // if (jsonButton.current.checked) {
      //   queryContent = JSON.stringify(validRule, null, 4);
      // } else {
      //   queryContent = queryBuilderRef.current.getSqlFromRules(validRule);
      // }

      // setQueryRuleText(queryContent);
    }
  }

  // GRID EVENT HANDLERS

  function gridCellValueChanged(params) {
    const rowIndex = params.rowIndex;
    const columnName = params.column;
    const columnDef = params.columnDef;
    const oldValue = params.oldValue;
    const newValue = params.newValue;
  }

  function gridRowClicked(params) {
    selectedGridRow.current = params.data;
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

    selectedGridRow.current = data;
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

    return;

    const id = params.data.id;

    const rowNode = api.getRowNode(id);

    // resends row data to subview
    rowNode.setRowData(params.data);
  }

  function expandOrCollapseAll(params) {
    const api = params.api;
    const columnApi = params.columnApi;
  }

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      enableValue: true, // allow every column to be aggregated
      enableRowGroup: true, // allow every column to be grouped
      enablePivot: true, // allow every column to be pivoted
      filter: "agMultiColumnFilter",
      minWidth: 100,
      resizable: true,
      sortable: true,
      // filterParams: {
      //   buttons: ["apply", "clear"],
      // },
    };
  }, []);

  const columnTypes = {
    dateColumn: {
      // filter: "agMultiColumnFilter",
      filterParams: {
        // provide comparator function
        comparator: (dateFromFilter, cellValue) => {
          // In the example application, dates are stored as dd/mm/yyyy
          // We create a Date object for comparison against the filter date
          const dateParts = cellValue.split("/");
          const day = Number(dateParts[0]);
          const month = Number(dateParts[1]) - 1;
          const year = Number(dateParts[2]);
          const cellDate = new Date(year, month, day);
          // Now that both parameters are Date objects, we can compare
          if (cellDate < dateFromFilter) {
            return -1;
          } else if (cellDate > dateFromFilter) {
            return 1;
          } else {
            return 0;
          }
        },
      },
    },
  };

  function onFirstDataRendered(params) {
    const allColumnIds = [];
    const skipHeader = false;
    gridRef.current.columnApi.getAllColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);
  }

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
  const [openSaveTemplateDialog, setOpenSaveTemplateDialog] =
    React.useState(false);

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
      key: "id",
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

    enqueueSnackbar("Query Saved", snackOptions);

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

  // Implementation of Query setTextValue method
  function setQueryTextValue(event) {
    setSaveQueryText(event.target.value);
  }

  // Implementation of Template setTextValue method
  function setTemplateTextValue(event) {
    setSaveTemplateText(event.target.value);
  }

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

  const sideBar = useMemo(() => {
    return {
      toolPanels: [
        {
          id: "columns",
          labelDefault: "Columns",
          labelKey: "columns",
          iconKey: "columns",
          toolPanel: "agColumnsToolPanel",
        },
        {
          id: "gridRelationships",
          labelDefault: "Relationships",
          labelKey: "relationships",
          iconKey: "custom-stats",
          width: 385,
          toolPanel: GridRelationshipsPanel,
          toolPanelParams: {
            selectedObject: selectedObject,
          },
        },
      ],
    };
  }, [selectedObject]);

  // agGrid passes these values to subGrid
  const detailCellRendererParams = {
    masterObject: selectedObject,
    masterGridRef: gridRef.current,
    relationPreferences: relationPreferences,
    // selectedGridRow: selectedGridRow.current,
  };

  // use application id as the grid row id
  const getRowId = useCallback((params) => params.data.id, []);

  const onRowGroupOpened = (params) => {
    // selectedGridRow.current = params.data;
  };

  return (
    <LoadingOverlay
      active={loadingIndicator}
      spinner={<DotLoader />}
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
        <SaveTemplateDialog
          saveTemplateFormOpen={saveTemplateFormOpen}
          setSaveTemplateFormOpen={setSaveTemplateFormOpen}
          templateName={saveTemplateName}
          templateColumns={saveTemplateGridCols}
          gridData={saveTemplateGridData}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          selectedObject={selectedObject}
          templateOptions={templateOptions}
          setTemplateOptions={setTemplateOptions}
          setColumnDefs={setColumnDefs}
          gridRef={gridRef}
        />

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
              console.log("Selected object changed");

              let qbColumns = null;

              let objMetadata = objectMetadata.find(
                (f) => f.objName === newValue.id
              );

              if (objMetadata === undefined) {
                // get object metadata
                const metadataResult = await gf.getObjectMetadata(
                  selectedObject.id,
                  userInfo,
                  objectMetadata
                );

                if (metadataResult.status !== "ok") {
                  throw new Error(
                    `Error retrieving metadata for ${selectedObject.id}`
                  );
                }

                // store object metadata in global state
                objMetadata = {
                  objName: selectedObject.id,
                  metadata: metadataResult.records,
                };

                dispatch(addMetadata(objMetadata));

                // create QueryBuilder columns
                qbColumns = await gf.createQueryBuilderColumns(
                  objMetadata.metadata
                );
              } else {
                // create QueryBuilder columns
                qbColumns = await gf.createQueryBuilderColumns(
                  objMetadata.metadata
                );
              }

              dispatch(setQueryColumns(qbColumns));

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
              setSelectedTemplate(newValue);
              return;
            }}
            sx={{ ml: 5, width: 250 }}
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
              setSelectedQuery(newValue);
              return;
            }}
            sx={{ ml: 5, width: 250 }}
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

          {/* save templates button */}
          <Tooltip title='Save Templates' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
              }}
              aria-label='Save Templates'
              size='medium'
              onClick={() => {
                saveTemplate();
              }}
            >
              <SaveTemplateIcon />
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
                ruleChange={(e) => ruleChanged(e)}
                // change={(e) => queryBuilderChanged(e)}
              >
                <ColumnsDirective>
                  {queryColumns.map((item) => {
                    const objMetadata = objectMetadata.find(
                      (m) => m.objName === selectedObject.id
                    );
                    if (objMetadata === undefined) {
                      // const a = 1;
                    }
                    const metadataFields = objMetadata.metadata.fields;
                    const metadataField = metadataFields.find(
                      (f) => f.name === item.field
                    );
                    const fieldDataType = metadataField.dataType;

                    switch (fieldDataType) {
                      case "boolean": {
                        return (
                          <ColumnDirective
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
                            key={item.field}
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
              animateRows={true}
              autoGroupColumnDef={autoGroupColumnDef}
              defaultColDef={defaultColDef}
              detailCellRenderer={DetailCellRenderer}
              detailCellRendererParams={detailCellRendererParams}
              detailRowHeight={500}
              columnDefs={columnDefs}
              columnTypes={columnTypes}
              enableColResize='true'
              getRowId={getRowId}
              groupDisplayType={"singleColumn"}
              masterDetail={true}
              onFirstDataRendered={onFirstDataRendered}
              onGridReady={onGridReady}
              onCellValueChanged={gridCellValueChanged}
              onRowDataChanged={gridRowDataChanged}
              onRowClicked={gridRowClicked}
              onRowGroupOpened={onRowGroupOpened}
              onRowSelected={gridRowSelected}
              onSelectionChanged={gridSelectionChanged}
              ref={gridRef}
              rowData={rowData}
              rowBuffer={100}
              rowGroupPanelShow={"always"}
              rowSelection='multiple'
              showOpenedGroup={true}
              sideBar={sideBar}
              suppressColumnVirtualisation={true}
            ></AgGridReact>
          </div>
        </div>
      </Box>
    </LoadingOverlay>
  );
}
