// React
import React, { useState, useRef, useEffect, useCallback } from "react";

import { useSelector, useDispatch } from "react-redux";

import GridViewRenderer from "../gridViewRenderer/gridViewRenderer";

// PubSubJS
import PubSub from "pubsub-js";

// React Spinner
import LoadingOverlay from "react-loading-overlay-ts";
import DotLoader from "react-spinners/DotLoader";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

// functions
import * as ghf from "./gridHeaderFuncs";

// Redux
import { addMetadata } from "../../features/objectMetadataSlice";
import { setLoadingIndicator } from "../../features/loadingIndicatorSlice";
import { setQueryPanelVisible } from "../../features/queryPanelVisabilitySlice";
import { setToolbarState } from "../../features/toolbarStateSlice";

// AgGrid
import AgGridCheckbox from "../../components/aggridCheckboxRenderer";

// save template dialog
import SaveTemplateDialog from "../../components/saveTemplateDialog/saveTemplateDialog";

// Lodash
import _ from "lodash";

// MUI icons
import AddOutlinedIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SaveTemplateIcon from "@mui/icons-material/ViewColumn";
import SaveIcon from "@mui/icons-material/CheckOutlined";

// Mui
import { makeStyles } from "@mui/styles";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { IconButton } from "@mui/material";
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

// Syncfusion
import {
  QueryBuilderComponent,
  ColumnsDirective,
  ColumnDirective,
} from "@syncfusion/ej2-react-querybuilder";

import { RadioButtonComponent } from "@syncfusion/ej2-react-buttons";
import { ConstructionOutlined } from "@mui/icons-material";

// change row tracking state
// let changedRowTracking = [];
// let newRowTracking = [];

let showErrors = false;

function GridHeader() {
  // Snackbar
  const { enqueueSnackbar } = useSnackbar();

  // local object references
  const objectSelectorRef = useRef(null);
  const querySelectorRef = useRef(null);
  const templateSelectorRef = useRef(null);
  const viewSelectorRef = useRef(null);
  const jsonButton = useRef(null);
  const sqlButton = useRef(null);
  const queryRuleContent = useRef(null);
  const queryBuilderRef = useRef(null);

  // redux global state
  const dispatch = useDispatch();
  const gridViewOptions = useSelector(
    (state) => state.toolbarState.gridViewOptions
  );
  const loadingIndicator = useSelector((state) => state.loadingIndicator);
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const objectOptions = useSelector(
    (state) => state.toolbarState.objectOptions
  );
  const objectOptionsFiltered = useSelector(
    (state) => state.toolbarState.objectOptionsFiltered
  );
  const queryColumns = useSelector((state) => state.toolbarState.queryColumns);
  const queryOptions = useSelector((state) => state.toolbarState.queryOptions);
  const queryPanelVisible = useSelector((state) => state.queryPanelVisible);
  const queryRule = useSelector((state) => state.toolbarState.queryRule);

  const selectedGridView = useSelector(
    (state) => state.toolbarState.selectedGridView
  );

  const selectedObject = useSelector(
    (state) => state.toolbarState.selectedObject
  );
  const selectedQuery = useSelector(
    (state) => state.toolbarState.selectedQuery
  );
  const selectedTemplate = useSelector(
    (state) => state.toolbarState.selectedTemplate
  );
  const sidebarSize = useSelector((state) => state.sidebarSize);
  const templateOptions = useSelector(
    (state) => state.toolbarState.templateOptions
  );
  const toolbarState = useSelector((state) => state.toolbarState);
  const userInfo = useSelector((state) => state.userInfo);
  const gridData = toolbarState.gridData;

  // local state
  const prevObjectOptions = useRef(null);
  const prevObjectOptionsFiltered = useRef(null);
  const prevSelectedObject = useRef(null);
  const prevSelectedQuery = useRef(null);

  // AgGrid local state
  const [setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);

  const queryRuleText = useSelector(
    (state) => state.toolbarState.queryRuleText
  );

  const [queryVisible, setQueryVisible] = useState(false);

  const [queryContentRows, setQueryContentRows] = useState(5);

  const [saveTemplateGridCols, setSaveTemplateGridCols] = useState([]);
  const [saveTemplateGridData, setSaveTemplateGridData] = useState([]);
  const [saveTemplateFormOpen, setSaveTemplateFormOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");

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

  const classes = useStyles();

  // create mainGrid ref
  const mainGridRef = useRef(null);

  // create transpositionGrid ref
  const transpositionGridRef = useRef(null);

  // GRID FUNCTIONS
  const externalFilterChanged = (newValue) => {
    showErrors = newValue;
    mainGridRef.current.api.onFilterChanged();
  };

  // QUERYBUILDER EVENT HANDLERS

  function changeQueryDisplayType(args) {
    const validRule = queryBuilderRef.current.getRules();
    let queryContent = null;

    if (jsonButton.current.checked) {
      queryContent = JSON.stringify(validRule, null, 4);
    } else {
      queryContent = queryBuilderRef.current.getSqlFromRules(validRule);
    }

    // create copy of toolbar state
    const newToolbarState = { ...toolbarState };

    let rows = queryContent.split("\n").length;

    // setQueryRuleText(queryContent);
    newToolbarState.queryContent = queryContent;
    dispatch(setToolbarState(newToolbarState));

    setQueryContentRows(rows);
  }

  const runQuery = async function () {
    try {
      dispatch(setLoadingIndicator(true));

      // executes query based on queryBuilder rule
      const query = queryBuilderRef.current.getRules();

      // get object metadata
      const metadataResult = await ghf.getObjectMetadata(
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
      const sqlResult = ghf.getQuerySQL(
        query,
        objMetadataFields,
        selectedObject.id
      );

      const executeQueryResult = await ghf.runQuery(
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

      dispatch(setLoadingIndicator(false));
    } catch (error) {
      console.log(error.message);

      dispatch(setLoadingIndicator(false));

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
  };

  // SYNCFUSION QUERY TEMPLATES

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
      if (selectedTemplate) {
        const templateResult = await ghf.getTemplate(
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
      const gridColumns = mainGridRef.current.columnApi.getAllGridColumns();
      gridColumns.forEach((g) => {
        // get column def
        const def = mainGridRef.current.columnApi.getColumn(g.colId);
        if (def.colDef.field === "error") {
          return;
        }

        if (
          def.colDef.field &&
          (def.visible || def.colDef.rowGroup || def.rowGroupActive)
        ) {
          visibleColumns.push(g);
        }
      });

      // create the template records
      const templateRecs = ghf.createSaveTemplateRecords(
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
      // const queryResult = await ghf.getQuery(selectedQuery.id, userInfo);
      // if (queryResult.status !== "ok") {
      //   throw new Error(`gridView-saveQuery() - ${queryResult.errorMessage}`);
      // }

      const currentRule = queryBuilderRef.current.getRules();

      // always returns 1 record
      // const queryRec = queryResult.records[0];

      // upsert the query
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

      // let insertResult = await insertResponse.json();
      // const newQuery = insertResult.records[0];

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

      enqueueSnackbar("Query Saved", snackOptions);

      // update query text
      let queryContent = null;
      if (jsonButton.current.checked) {
        queryContent = queryBuilderRef.current.getSqlFromRules(currentRule);
      } else {
        queryContent = JSON.stringify(currentRule, null, 4);
      }

      // setQueryRuleText(queryContent);

      // create a copy of toolbarState
      const newToolbarState = { ...toolbarState };
      newToolbarState.queryRule = queryContent;
      dispatch(setToolbarState(newToolbarState));
    } catch (error) {
      console.log(error.message);
      return;
    }
  }

  function ruleChanged(event) {
    if (event.type === "deleteRule") {
      const validRule = queryBuilderRef.current.getRules();
      // dispatch(setQueryRule(validRule));

      // create a copy of toolbarState
      const newToolbarState = { ...toolbarState };
      newToolbarState.queryRule = validRule;
      dispatch(setToolbarState(newToolbarState));
    }
  }

  async function getUserPreferences(selectedObject, isRelated, userInfo) {
    const prefResult = await ghf.getGridPreferences(
      selectedObject.id,
      isRelated,
      userInfo
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
      return {
        userPref: prefData[0],
      };
    }

    if (prefData.length === 0) {
      return {
        userPref: null,
      };
    }
  }

  async function getDefaultTemplatePreference(
    selectedObject,
    userInfo,
    isDefault,
    isActive,
    isPublic,
    isRelated,
    owner
  ) {
    const defaultTemplateResult = await ghf.getDefaultTemplates(
      selectedObject.id,
      userInfo.orgid,
      isDefault,
      isActive,
      isPublic,
      isRelated,
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
      return {
        defaultTemplate: defaultTemplates[0],
      };
    }

    if (defaultTemplates.length === 0) {
      return {
        defaultTemplate: null,
      };
    }
  }

  // get org objects after user login
  useEffect(() => {
    const loadInitialData = async () => {
      // wait until user has logged in
      if (Object.keys(userInfo).length === 0) {
        return;
      }

      if (_.isEqual(objectOptions, prevObjectOptions.current)) {
        return;
      }

      console.log(`Running gridHeader get org objects useEffect`);

      dispatch(setLoadingIndicator(true));

      // get all org objects users have permissions for
      const result = await ghf.getObjectOptions(userInfo);

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

      if (result.records.length === 0) {
        throw new Error("No org objects found");
      }

      // create object list based on preferences
      // get user object preferences
      const preferencesUrl = "/postgres/knexSelect";

      // get all columns
      let columns = null;

      // get the object preferences from the database
      const values = {
        username: userInfo.userEmail,
      };

      const prefPayload = {
        table: "user_object_prefs",
        columns: columns,
        values: values,
        rowIds: [],
        idField: null,
      };

      const prefResponse = await fetch(preferencesUrl, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prefPayload),
      });

      if (!prefResponse.ok) {
        throw new Error(
          `Network error - Error getting user object preferences`
        );
      }

      const prefResult = await prefResponse.json();

      if (prefResult.status !== "ok") {
        throw new Error("Error getting user object preferences");
      }

      if (prefResult.records.length > 1) {
        // application error
        throw new Error("Error retrieving org object preferences");
      }

      const filteredObjects = [];
      if (prefResult.records.length === 1) {
        // always returns a single record
        const prefList = prefResult.records[0].preferences;

        prefList.forEach((p) => {
          // get id from main obj list
          const obj = result.records.find((f) => f.id === p.object);
          if (obj) {
            filteredObjects.push(obj);
          }
        });
      }

      // create copy of toolbar state
      const newToolbarState = { ...toolbarState };

      newToolbarState.objectOptions = [...result.records];

      newToolbarState.objectOptionsFiltered = [...filteredObjects];

      newToolbarState.selectedObject = result.records[0];

      dispatch(setToolbarState(newToolbarState));

      prevObjectOptions.current = result.records;

      dispatch(setLoadingIndicator(false));
    };

    loadInitialData();
  }, [toolbarState, objectOptions, dispatch, userInfo, enqueueSnackbar]);

  // selectedObject changed
  useEffect(() => {
    /*  when the selected object changes
      1 - get metadata for selected object
      2 - create the queryBuilder columns
      3 - load the template options
      4 - load the query options
      5 - set selected template & query based on preferences or defaults
      6 - get the relationship preferences
      7 - create the subviews based on user relationship preferences
      8 - set the view options based on the user object preference
  */
    const objChanged = async () => {
      if (!selectedObject || objectOptions.length === 0) {
        return;
      }

      // if selectedObject hasn't changed, return
      if (_.isEqual(selectedObject, prevSelectedObject.current)) {
        dispatch(setLoadingIndicator(false));
        return;
      }

      prevSelectedObject.current = { ...selectedObject };

      console.log(
        `Running gridHeader selected object changed useEffect for object ${selectedObject.id}`
      );

      // create copy of toolbar state
      const newToolbarState = { ...toolbarState };

      let objMetadata = null;

      try {
        // get or create the objectMetadata
        objMetadata = objectMetadata.find(
          (f) => f.objName === selectedObject.id
        );

        if (objMetadata === undefined) {
          // get object metadata
          console.log(`Getting object metadata for ${selectedObject.id}`);
          const metadataResult = await ghf.getObjectMetadata(
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
        const qbColumns = await ghf.createQueryBuilderColumns(
          objMetadata.metadata
        );

        newToolbarState.queryColumns = [...qbColumns];

        // get templates for selected object
        const templateResult = await ghf.getTemplateRecords(
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

        newToolbarState.templateOptions = [...tmpOptions];

        // get user preferences
        const userPrefResult = await ghf.getGridPreferences(
          selectedObject,
          false, //isRelated
          userInfo
        );

        if (userPrefResult.status === "error") {
          throw new Error(
            `Error retreiving user preferences for ${selectedObject.label}`
          );
        }

        if (userPrefResult.records.length > 1) {
          throw new Error(
            `More than 1 user preference for ${selectedObject.label} found`
          );
        }

        const userPref =
          userPrefResult.records.length > 0 ? userPrefResult.records[0] : null;

        if (templateData.length === 0) {
          // no templates defined for this object - create default grid columns
          PubSub.publish("CreateDefaultGridColumns", true);

          newToolbarState.templateOptions = [];
          newToolbarState.selectedTemplate = null;
          console.log(
            `No templates found for ${selectedObject.label}.  Creatintg default grid columns.`
          );
        }

        if (templateData.length > 0) {
          // check for template user preference
          if (userPref) {
            // find the template option with this Id
            const tmpOption = tmpOptions.find(
              (o) => o.id === userPref.templateid
            );

            // use this template
            newToolbarState.selectedTemplate = tmpOption;

            console.log(
              `Found template user preference for ${tmpOption.label}`
            );
          }

          if (!userPref) {
            // check for default template preference
            let hasDefaultPref = templateData.find((t) => t.default === true);
            if (hasDefaultPref) {
              const defaultPref = {
                id: hasDefaultPref.id,
                label: hasDefaultPref.template_name,
              };
              newToolbarState.selectedTemplate = defaultPref;
              console.log(
                `Found template default preference for ${defaultPref.label}`
              );
            }

            // no defaults found
            if (!hasDefaultPref) {
              // use the first template
              newToolbarState.selectedTemplate = tmpOptions[0];
              console.log(
                `No user or default template preferences found for ${selectedObject.label}`
              );
            }
          }
        }

        // create the query options list
        const queryResult = await ghf.getQueryOptions(
          selectedObject.id,
          userInfo
        );

        if (queryResult.status === "error") {
          console.log(
            `Error getting query options for ${selectedObject.label}`
          );
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

        newToolbarState.queryOptions = [...qryOptions];

        if (queryData.length === 0) {
          // no queries defined for this object

          // notify user of error
          const snackOptions = {
            variant: "info",
            autoHideDuration: 5000,
            anchorOrigin: {
              vertical: "top",
              horizontal: "right",
            },
            TransitionComponent: Slide,
          };

          enqueueSnackbar(
            `No queries defined for ${selectedObject.id}`,
            snackOptions
          );

          newToolbarState.selectedQuery = null;
          newToolbarState.queryRule = [];
          newToolbarState.queryRuleText = "";
          queryBuilderRef.current.setRules([]);

          // send event to grid to clear data
          PubSub.publish("ClearData", true);

          console.log(`No queries found for ${selectedObject.label}`);
        }

        // use the query preference if found
        if (userPref && queryData.length > 0) {
          // get query preferenceId
          const queryPrefId = Number(userPref.queryid);

          // find the query option with this Id
          const queryOption = qryOptions.find((o) => o.id === queryPrefId);

          // use this query
          newToolbarState.selectedQuery = queryOption;

          // set query rule state
          const query = queryData.find((f) => f.id === queryOption.id);

          const rule = query.query_rules;

          newToolbarState.queryRule = rule;

          dispatch(setToolbarState(newToolbarState));

          console.log(
            `Found user query preference for ${selectedObject.label}`
          );
        } else {
          console.log(
            `No user query preference found for ${selectedObject.label}`
          );
        }

        // check for default query if no user preference found
        if (!userPref && queryData.length > 0) {
          const defaultQueryResult = queryData.find((q) => q.default === true);

          if (defaultQueryResult) {
            // find the query option with this Id
            const queryOption = qryOptions.find(
              (t) => t.id === defaultQueryResult.id
            );

            // use this query
            newToolbarState.selectedQuery = queryOption;

            console.log(`Found default query for ${selectedObject.label}`);

            // set query rule state
            const query = queryData.find((f) => f.id === queryOption.id);

            const rule = query.query_rules;

            newToolbarState.queryRule = rule;
          }

          if (!defaultQueryResult) {
            console.log(`No default query found for ${selectedObject.label}`);

            // use the first query found
            newToolbarState.selectedQuery = qryOptions[0];

            // set query rule state
            const query = queryData.find((f) => f.id === qryOptions[0].id);

            const rule = query.query_rules;

            newToolbarState.queryRule = rule;

            console.log(
              `Setting query to first option for ${selectedObject.label}`
            );
          }
        }

        // create the sub views
        const result = await ghf.getRelationshipPreferences(userInfo);
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

          if (objRelPrefs) {
            const prefs = objRelPrefs.relations;

            // get metadata if needed
            for (const p of prefs) {
              let metadata = objectMetadata.find((f) => f.objName === p.id);

              if (!metadata) {
                console.log(`getting object metadata for ${p.id}`);
                metadata = await ghf.getObjectMetadata(
                  p.id,
                  userInfo,
                  objectMetadata
                );

                const newObjMetadata = {
                  objName: p.id,
                  metadata: metadata.records,
                };

                dispatch(addMetadata(newObjMetadata));
              }
            }

            newToolbarState.relationPreferences = result.records[0].preferences;
          }
        }

        // set view options
        const objPrefResult = await ghf.getObjectPreferences(userInfo);

        if (objPrefResult.status === "error") {
          throw new Error("Error retrieving user object preferences");
        }

        if (objPrefResult.records.length > 1) {
          throw new Error(
            "More than 1 object preferences record found for user"
          );
        }

        if (objPrefResult.records.length === 1) {
          const userObjPrefRec = objPrefResult.records[0];

          const prefArray = userObjPrefRec.preferences;

          const objectViewOptions = prefArray.find(
            (p) => p.object === selectedObject.id
          );

          let optionsList = ["Grid"];
          if (objectViewOptions.length > 0) {
            if (objectViewOptions.ganttView === true) {
              optionsList.push("Gantt");
            }

            if (objectViewOptions.kanbanView === true) {
              optionsList.push("Kanban");
            }

            if (objectViewOptions.scheduleView === true) {
              optionsList.push("Schedule");
            }

            if (objectViewOptions.transpositionView === true) {
              optionsList.push("Transposition");
            }
          }

          newToolbarState.gridViewOptions = [...optionsList];

          newToolbarState.selectedGridView = optionsList[0];
        }

        dispatch(setToolbarState(newToolbarState));

        dispatch(setLoadingIndicator(false));
      } catch (error) {
        dispatch(setLoadingIndicator(false));

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
  }, [
    toolbarState,
    selectedObject,
    objectOptions,
    enqueueSnackbar,
    objectMetadata,
    dispatch,
    userInfo,
  ]);

  useEffect(() => {
    // update the QueryBuilder rules when the selected query changes
    // childGrid will execute query
    const queryChanged = async () => {
      try {
        if (!selectedObject || !selectedQuery) {
          return;
        }

        // if selected query hasn't changed, return
        if (_.isEqual(selectedQuery, prevSelectedQuery.current)) {
          return;
        }

        console.log(
          `Running gridHeader useEffect for query ${selectedQuery.label}`
        );

        prevSelectedQuery.current = { ...selectedQuery };

        // create copy of toolbar state
        const newToolbarState = { ...toolbarState };

        // get query from database
        const queryResult = await ghf.getSelectedQuery(selectedQuery, userInfo);

        if (queryResult.status === "error") {
          throw new Error(`gridView-useEffect() - ${queryResult.errorMessage}`);
        }

        const query = queryResult.records[0];

        const rule = query.query_rules;

        newToolbarState.queryRule = rule;

        // update the query text after rule change
        let queryContent = null;
        if (jsonButton.current.checked) {
          queryContent = JSON.stringify(rule, null, 4);
        } else {
          queryContent = queryBuilderRef.current.getSqlFromRules(rule);
        }

        newToolbarState.queryRuleText = queryContent;

        // load the rule into the QueryBuilder
        queryBuilderRef.current.setRules(rule);

        // dispatch(setToolbarState(newToolbarState));

        // dispatch(setLoadingIndicator(false));
      } catch (error) {
        dispatch(setLoadingIndicator(false));
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
    toolbarState,
    selectedObject,
    selectedQuery,
    userInfo,
  ]);

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
          setSelectedTemplate={setToolbarState}
          selectedObject={selectedObject ? selectedObject.id : null}
          templateOptions={templateOptions}
          setTemplateOptions={setToolbarState}
          setColumnDefs={setColumnDefs}
          mainGridRef={mainGridRef}
        />

        {/* object, template, query and view selectors */}
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
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => (option ? option.label : "")}
            options={objectOptionsFiltered}
            ref={objectSelectorRef}
            value={selectedObject ? selectedObject : null}
            renderInput={(params) => (
              <TextField {...params} label='Org Objects' variant='standard' />
            )}
            onChange={async (event, newValue) => {
              // console.log("Selected object changed");

              let qbColumns = null;

              let objMetadata = objectMetadata.find(
                (f) => f.objName === newValue.id
              );

              if (objMetadata === undefined) {
                // get object metadata
                const metadataResult = await ghf.getObjectMetadata(
                  newValue.id,
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
                  objName: newValue.id,
                  metadata: metadataResult.records,
                };

                dispatch(addMetadata(objMetadata));

                // create QueryBuilder columns
                qbColumns = await ghf.createQueryBuilderColumns(
                  objMetadata.metadata
                );
              } else {
                // create QueryBuilder columns
                qbColumns = await ghf.createQueryBuilderColumns(
                  objMetadata.metadata
                );
              }

              // setQueryColumns(qbColumns);

              // store selected object in global state
              // dispatch(setSelectedObject(newValue));

              // create copy of toolbar state
              const newToolbarState = { ...toolbarState };

              newToolbarState.queryColumns = qbColumns;
              newToolbarState.selectedObject = newValue;

              dispatch(setToolbarState(newToolbarState));

              return;
            }}
            sx={{ width: 175 }}
          />

          <Autocomplete
            id='templateSelector'
            autoComplete
            includeInputInList
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => (option ? option.label : "")}
            options={templateOptions}
            value={selectedTemplate ? selectedTemplate : null}
            ref={templateSelectorRef}
            renderInput={(params) => (
              <TextField {...params} label='Templates' variant='standard' />
            )}
            onChange={async (event, newValue) => {
              // dispatch(setSelectedTemplate(newValue));

              // create copy of toolbar state
              const newToolbarState = { ...toolbarState };
              newToolbarState.selectedTemplate = newValue;

              dispatch(setToolbarState(newToolbarState));
              return;
            }}
            sx={{ ml: 5, width: 225 }}
          />

          <Autocomplete
            id='querySelector'
            autoComplete
            includeInputInList
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => (option ? option.label : "")}
            options={queryOptions}
            value={selectedQuery ? selectedQuery : null}
            ref={querySelectorRef}
            renderInput={(params) => (
              <TextField {...params} label='Queries' variant='standard' />
            )}
            onChange={(event, newValue) => {
              // dispatch(setSelectedQuery(newValue));

              // create copy of toolbar state
              const newToolbarState = { ...toolbarState };
              newToolbarState.selectedQuery = newValue;
              dispatch(setToolbarState(newToolbarState));
              return;
            }}
            sx={{ ml: 5, width: 225 }}
          />

          <Autocomplete
            id='viewSelector'
            autoComplete
            includeInputInList
            // getOptionLabel={(option) => (option ? option.label : "")}
            options={gridViewOptions}
            ref={viewSelectorRef}
            renderInput={(params) => (
              <TextField {...params} label='View Type' variant='standard' />
            )}
            value={selectedGridView ? selectedGridView : null}
            onChange={(event, newValue) => {
              // create copy of toolbar state
              const newToolbarState = { ...toolbarState };
              newToolbarState.selectedGridView = newValue;
              dispatch(setToolbarState(newToolbarState));
            }}
            sx={{ ml: 5, width: 150 }}
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
              onClick={(e) => {
                // we don't care about the payload
                // at any given time, only 1 gridView (MainGrid or TranspositionGrid) will be
                // mounted and receive the event
                PubSub.publish("AddRow", true);
              }}
            >
              <AddOutlinedIcon />
            </IconButton>
          </Tooltip>

          {/* save button */}
          <Tooltip title='Save' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
              }}
              aria-label='Save'
              size='medium'
              onClick={() => {
                PubSub.publish("Save", true);
              }}
            >
              <SaveIcon />
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
              onClick={(e) => {
                // we don't care about the payload
                // at any given time, only 1 gridView (MainGrid or TranspositionGrid) will be
                // mounted and receive the event
                PubSub.publish("DeleteRow", true);
              }}
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

          {/* refresh button */}
          <Tooltip title='Refresh' placement='top'>
            <IconButton
              sx={{
                color: "#354868",
                "&:hover": {
                  color: "whitesmoke",
                },
              }}
              aria-label='Relationships'
              size='medium'
              onClick={() => {
                // we don't care about the payload
                // at any given time, only 1 gridView (MainGrid or TranspositionGrid) will be
                // mounted and receive the event
                PubSub.publish("Refresh", true);
              }}
            >
              <ReplayOutlinedIcon />
            </IconButton>
          </Tooltip>

          {/* error status */}
          <Box
            sx={{
              ml: 5,
              color: "primary.error",
              display: showErrors ? "block" : "none",
            }}
          >
            Showing Save Errors
          </Box>
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
                    // we don't care about the payload
                    // at any given time, only 1 gridView (MainGrid or TranspositionGrid) will be
                    // mounted and receive the event
                    PubSub.publish("RunQuery", true);
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
                  rows={queryContentRows}
                  // maxRows={8}
                  // maxRows={Infinity}
                  value={queryRuleText}
                />
              </div>
            </Stack>
          </Stack>
        </Box>

        {/* main grid or transposition grid displayed based on selected view */}
        <Box>
          <GridViewRenderer
            queryBuilderRef={queryBuilderRef}
            mainGridRef={mainGridRef}
            transpositionGridRef={transpositionGridRef}
            objectOptions={objectOptions}
            selectedGridView={toolbarState.selectedGridView}
          />
        </Box>
      </Box>
    </LoadingOverlay>
  );
}

export default React.memo(GridHeader);
