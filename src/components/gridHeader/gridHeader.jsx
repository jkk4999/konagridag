// React
import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

// conditional renderer
import GridViewRenderer from "../gridViewRenderer/gridViewRenderer";

// react query hooks
import useGridPreferences from "../../hooks/getGridPreferencesHook";
import useObjPreferences from "../../hooks/getObjPreferencesHook";
import useObjQueries from "../../hooks/getObjQueriesHook";
import useObjTemplates from "../../hooks/getObjTemplatesHook";
import useTemplateFields from "../../hooks/getTemplateFieldsHook";
import useOrgObjects from "../../hooks/getOrgObjectsHook";
import useRelationPreferences from "../../hooks/getRelationshipPreferencesHook";

// PubSubJS
import PubSub from "pubsub-js";

// React Spinner
import LoadingOverlay from "react-loading-overlay-ts";
import DotLoader from "react-spinners/DotLoader";

// Toast
import { toast } from "react-toastify";

// functions
import * as ghf from "./gridHeaderFuncs";

// Redux
import { addMetadata } from "../../features/objectMetadataSlice";
import { setLoadingIndicator } from "../../features/loadingIndicatorSlice";
import { setQueryPanelVisible } from "../../features/queryPanelVisabilitySlice";
import { setToolbarState } from "../../features/toolbarStateSlice";

// AgGrid

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

// change row tracking state
// let changedRowTracking = [];
// let newRowTracking = [];

let showErrors = false;

function GridHeader() {
  const startTime = useRef(new Date());
  const endTime = useRef(null);

  if (!startTime.current) {
    console.log(`Start time is ${startTime.current.toUTCString()}`);
  }

  // Toast
  const toastId = React.useRef(null);

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
  const loadingIndicator = useSelector((state) => state.loadingIndicator);
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const queryPanelVisible = useSelector((state) => state.queryPanelVisible);
  const sidebarSize = useSelector((state) => state.sidebarSize);
  const toolbarState = useSelector((state) => state.toolbarState);
  const userInfo = useSelector((state) => state.userInfo);

  // toolbar local state
  let prevGridPreferences = useRef(null);
  let prevObjectOptions = useRef(null);
  let prevObjectPreferences = useRef(null);
  let prevOrgObjects = useRef(null);
  let prevQueryOptions = useRef(null);
  let prevRelationPreferences = useRef(null);
  let prevSelectedObject = useRef(null);
  let prevSelectedTemplate = useRef(null);
  let prevSelectedQuery = useRef(null);
  let prevTemplateOptions = useRef(null);
  let prevTemplateFields = useRef(null);
  let prevObjTemplates = useRef(null);
  let prevTemplates = useRef(null);
  let prevObjQueries = useRef(null);
  let prevQueries = useRef(null);

  let gridPreference = useRef(null);
  let objectOptions = useRef([]);
  let objectOptionsFiltered = useRef([]);
  let [templateOptions, setTemplateOptions] = useState([]);
  let templates = useRef([]);
  let [queryOptions, setQueryOptions] = useState([]);
  let queries = useRef([]);
  let [selectedObject, setSelectedObject] = useState(null);
  let [selectedGridView, setSelectedGridView] = useState(null);
  let [selectedTemplate, setSelectedTemplate] = useState(null);
  let [selectedQuery, setSelectedQuery] = useState(null);
  let gridViewOptions = useRef([]);

  // queryBuilder local state
  // let [queryColumns, setQueryColumns] = useState([]);
  let queryColumns = useRef([]);
  const [queryRule, setQueryRule] = useState(null);
  const [queryRuleText, setQueryRuleText] = useState("");

  // react query

  const orgObjects = useOrgObjects(userInfo);
  const objTemplates = useObjTemplates(userInfo);
  const templateFields = useTemplateFields(userInfo);
  const objQueries = useObjQueries(userInfo);
  const gridPreferences = useGridPreferences(false, userInfo);
  const objPreferences = useObjPreferences(userInfo, objectOptions);
  const relationPreferences = useRelationPreferences(userInfo);

  // maps to store templates and queries associated to an object
  // const [templateMap, setTemplateMap] = React.useState(new Map());
  // const [queryMap, setQueryMap] = React.useState(new Map());
  // const [userPreferencesMap, setUserPreferencesMap] = React.useState(new Map());
  // const [gridPreferencesMap, setGridPreferencesMap] = React.useState(new Map());

  // functions to update maps
  // const addTemplateMap = (key, value) => {
  //   setTemplateMap((prev) => new Map([...prev, [key, value]]));
  // };

  // const upsertTemplateMap = (key, value) => {
  //   setTemplateMap((prev) => new Map(prev).set(key, value));
  // };

  // const addQueryMap = (key, value) => {
  //   setQueryMap((prev) => new Map([...prev, [key, value]]));
  // };

  // const upsertQueryMap = (key, value) => {
  //   setQueryMap((prev) => new Map(prev).set(key, value));
  // };

  // const addGridPreferencesMap = (key, value) => {
  //   setGridPreferencesMap((prev) => new Map([...prev, [key, value]]));
  // };

  // const upsertGridPreferencesMap = (key, value) => {
  //   setGridPreferencesMap((prev) => new Map(prev).set(key, value));
  // };

  // const addUserPreferencesMap = (key, value) => {
  //   setUserPreferencesMap((prev) => new Map([...prev, [key, value]]));
  // };

  // const upsertUserPreferencesMap = (key, value) => {
  //   setUserPreferencesMap((prev) => new Map(prev).set(key, value));
  // };

  // react-query state
  const fetchOrgObjects = useRef(true);
  const fetchUserPrefs = useRef(true);

  // AgGrid local state
  const [setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [childRowData, setChildRowData] = useState([]);

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

  // SYNCFUSION QUERY TEMPLATES

  function checkboxTemplate(props) {
    return <CheckboxTemplate {...props} setQueryRule={setQueryRule} />;
  }

  function currencyTemplate(props) {
    return <CurrencyTemplate {...props} setQueryRule={setQueryRule} />;
  }

  function dateTemplate(props) {
    return <DateTemplate {...props} setQueryRule={setQueryRule} />;
  }

  function decimalTemplate(props) {
    return <DecimalTemplate {...props} setQueryRule={setQueryRule} />;
  }

  function integerTemplate(props) {
    return <IntegerTemplate {...props} setQueryRule={setQueryRule} />;
  }

  function percentTemplate(props) {
    return <PercentTemplate {...props} setQueryRule={setQueryRule} />;
  }

  function selectTemplate(props) {
    return (
      <SelectTemplate
        {...props}
        selectedObject={selectedObject}
        objectMetadata={objectMetadata}
        setQueryRule={setQueryRule}
      />
    );
  }

  function textTemplate(props) {
    return (
      <TextTemplate
        {...props}
        selectedObject={selectedObject}
        objectMetadata={objectMetadata}
        setQueryRule={setQueryRule}
      />
    );
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
          cellRenderer: "checkboxRenderer",
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
          cellRenderer: "checkboxRenderer",
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
          cellRenderer: "checkboxRenderer",
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

      toast.success("Query Saved", { autoClose: 3000 });

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

      queryRule.current = validRule;
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

  // get the org objects

  // if (orgObjects.isLoading) {
  //   dispatch(setLoadingIndicator(true));
  // } else {
  //   dispatch(setLoadingIndicator(false));
  // }

  if (orgObjects.isError) {
    // log error and notify user
    console.log(`gridHeader() - ${orgObjects.error.message}`);

    // notify user of error
    toast.error("Error retrieving org objects", { autoClose: 5000 });

    dispatch(setLoadingIndicator(false));

    // disable query
    fetchOrgObjects.current = false;
  }

  if (
    orgObjects.isSuccess &&
    !_.isEqual(orgObjects.data, prevOrgObjects.current)
  ) {
    prevOrgObjects.current = orgObjects.data;

    // create the org options list
    const options = [];
    orgObjects.data.forEach((d) => {
      const newOpt = {
        id: d.id,
        value: d.value,
      };
      options.push(newOpt);
    });

    objectOptions.current = [...options];
    prevObjectOptions.current = [...options];
    console.log("Setting object options");
  }

  // get the user object preferences - dependent on orgObjects query
  // if (objPreferences.isLoading) {
  //   dispatch(setLoadingIndicator(true));
  // } else {
  //   dispatch(setLoadingIndicator(false));
  // }

  if (objPreferences.isError) {
    // log error and notify user
    console.log(`gridHeader() - ${objPreferences.error.message}`);

    // notify user of error
    toast.error(objPreferences.error.message, { autoClose: 5000 });

    dispatch(setLoadingIndicator(false));
  }

  if (
    objPreferences.isSuccess &&
    !_.isEqual(objPreferences.data, prevObjectPreferences.current)
  ) {
    prevObjectPreferences.current = objPreferences.data;
    console.log("Object preferences loaded");

    // create the filtered object list
    const filteredList = [];
    const objPref = objPreferences.data[0];
    objPref.preferences.forEach((p) => {
      // get id from main obj list
      const obj = objectOptions.current.find((f) => f.id === p.object);
      if (obj) {
        filteredList.push(obj);
      }
    });

    if (filteredList.length > 0) {
      objectOptionsFiltered.current = [...filteredList];
    } else {
      objectOptionsFiltered.current = [...objectOptions.current];
    }

    // set selected object to first result
    setSelectedObject(objectOptionsFiltered.current[0]);

    console.log(
      `Selected object changed to ${objectOptionsFiltered.current[0].id}`
    );

    // dispatch(setLoadingIndicator(false));
  }

  // get the user grid preferences - dependent on selectedObject
  // if (gridPreferences.isLoading) {
  //   dispatch(setLoadingIndicator(true));
  // } else {
  //   dispatch(setLoadingIndicator(false));
  // }

  if (gridPreferences.isError) {
    // log error and notify user
    console.log(`gridHeader() - ${gridPreferences.error.message}`);

    // notify user of error
    toast.error(gridPreferences.error.message, { autoClose: 5000 });

    dispatch(setLoadingIndicator(false));
  }

  if (
    gridPreferences.isSuccess &&
    !_.isEqual(gridPreferences.data, prevGridPreferences.current)
  ) {
    prevGridPreferences.current = gridPreferences.data;
    console.log("Grid preferences loaded");

    // dispatch(setLoadingIndicator(false));
  }

  // get template options
  // if (objTemplates.isLoading) {
  //   dispatch(setLoadingIndicator(true));
  // } else {
  //   dispatch(setLoadingIndicator(false));
  // }

  if (objTemplates.isError) {
    // log error and notify user
    console.log(`gridHeader() - ${objTemplates.error.message}`);

    // notify user of error
    toast.error(objTemplates.error.message, { autoClose: 5000 });

    dispatch(setLoadingIndicator(false));
  }

  if (
    objTemplates.isSuccess &&
    !_.isEqual(objTemplates.data, prevTemplates.current)
  ) {
    prevTemplates.current = objTemplates.data;
    console.log("Templates loaded");
  }

  // get query options

  // if (objQueries.isLoading) {
  //   dispatch(setLoadingIndicator(true));
  // } else {
  //   dispatch(setLoadingIndicator(false));
  // }

  if (objQueries.isError) {
    // log error and notify user
    console.log(`gridHeader() - ${objQueries.error.message}`);

    // notify user of error
    toast.error(objQueries.error.message, { autoClose: 5000 });

    dispatch(setLoadingIndicator(false));
  }

  if (
    objQueries.isSuccess &&
    !_.isEqual(objQueries.data, prevQueries.current)
  ) {
    prevQueries.current = objQueries.data;
    console.log("Queries loaded");
  }

  // get the user relation preferences - dependent on userInfo
  /*
    if (relationPreferences.isLoading) {
        dispatch(setLoadingIndicator(true));
    } else {
        dispatch(setLoadingIndicator(false));
    }
  */

  if (relationPreferences.isError) {
    // log error and notify user
    console.log(`gridHeader() - ${relationPreferences.error.message}`);

    // notify user of error
    toast.error(relationPreferences.error.message, { autoClose: 5000 });

    dispatch(setLoadingIndicator(false));
  }

  if (
    relationPreferences.isSuccess &&
    !_.isEqual(relationPreferences.data, prevRelationPreferences.current)
  ) {
    prevRelationPreferences.current = relationPreferences.data;
    console.log("Relation preferences loaded");
  }

  if (templateFields.isError) {
    // log error and notify user
    console.log(`gridHeader() - ${templateFields.error.message}`);

    // notify user of error
    toast.error(templateFields.error.message, { autoClose: 5000 });
  }

  if (
    templateFields.isSuccess &&
    !_.isEqual(templateFields.data, prevTemplateFields.current)
  ) {
    prevTemplateFields.current = templateFields.data;
    console.log("Template fields loaded");
  }

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
      if (!selectedObject) {
        return;
      }

      // if selectedObject hasn't changed, return
      if (_.isEqual(selectedObject, prevSelectedObject.current)) {
        dispatch(setLoadingIndicator(false));
        return;
      }

      // dispatch(setLoadingIndicator(true));

      prevSelectedObject.current = { ...selectedObject };

      console.log(
        `UseEffect SelectecdObjectChanged - Running gridHeader selected object changed for object ${selectedObject.id}`
      );

      let objMetadata = null;

      try {
        // get or create the objectMetadata
        objMetadata = objectMetadata.find(
          (f) => f.objName === selectedObject.id
        );

        if (objMetadata === undefined) {
          // get object metadata
          console.log(
            `UseEffect SelectecdObjectChanged - Getting object metadata for ${selectedObject.id}`
          );
          const metadataResult = await ghf.getObjectMetadata(
            selectedObject.id,
            userInfo,
            objectMetadata
          );

          if (metadataResult.status !== "ok") {
            throw new Error(
              `UseEffect SelectecdObjectChanged - Error retrieving metadata for ${selectedObject.id}`
            );
          }

          // store object metadata in global state
          objMetadata = {
            objName: selectedObject.id,
            metadata: metadataResult.records,
          };

          dispatch(addMetadata(objMetadata));
        }

        // load template options for this object
        let tmpOptions = [];
        objTemplates.data.forEach((t) => {
          if (t.object === selectedObject.id) {
            const newOpt = {
              id: t.id,
              value: t.template_name,
            };
            tmpOptions.push(newOpt);
          }
        });

        if (tmpOptions.length === 0) {
          // no templates defined for this object

          // notify user of error
          toast.warn(`No templates defined for ${selectedObject.id}`, {
            autoClose: 5000,
          });

          setSelectedTemplate(null);
          prevSelectedTemplate.current = null;
        } else {
          setTemplateOptions(tmpOptions);
        }

        // create the query options list
        const qryOptions = [];
        objQueries.data.forEach((q) => {
          if (q.object === selectedObject.id) {
            const newOpt = {
              id: q.id,
              value: q.name,
            };
            qryOptions.push(newOpt);
          }
        });

        if (qryOptions.length === 0) {
          // no queries defined for this object

          // notify user of error
          toast.warn(`No queries defined for ${selectedObject.id}`, {
            autoClose: 5000,
          });

          setSelectedQuery(null);
          prevSelectedQuery.current = null;
          setQueryRule([]);
          setQueryRuleText("");
          queryBuilderRef.current.setRules([]);

          // send event to grid to clear data
          PubSub.publish("ClearData", true);

          console.log(
            `UseEffect SelectecdObjectChanged - No queries found for ${selectedObject.value}`
          );
        } else {
          setQueryOptions(qryOptions);
        }

        // create QueryBuilder columns
        const qbColumns = await ghf.createQueryBuilderColumns(
          objMetadata.metadata
        );

        // setQueryColumns([...qbColumns]);
        queryColumns.current = qbColumns;
        console.log("UseEffect SelectecdObjectChanged - Query columns loaded");

        // get template and query preferences for selectedObject
        const gridPref = gridPreferences.data.find(
          (p) => p.object === selectedObject.id
        );
        let preferenceData = null;
        let userPref = null;

        if (gridPref) {
          // find the template option with this Id
          const tmpOption = templateOptions.find(
            (o) => o.id === gridPref.templateid
          );

          // use this template
          setSelectedTemplate(tmpOption);

          console.log(
            `UseEffect SelectecdObjectChanged - Found user template preference for ${selectedObject.id}.  Setting selectedTemplate state to ${tmpOption.value}`
          );

          // find the query option with this id
          const qryOption = queryOptions.find((o) => o.id === gridPref.queryid);

          // use this query
          setSelectedQuery(qryOption);

          console.log(
            `UseEffect SelectecdObjectChanged - Found query user preference for ${selectedObject.id}.  Setting selectedQuery state to ${qryOption.value}`
          );

          // no need to run useEffect for selectedQuery changed
          prevSelectedQuery.current = qryOption;

          // set the query rule
          const query = objQueries.data.find((q) => q.id === qryOption.id);
          const rule = query.query_rules;
          setQueryRule(rule);
          console.log("UseEffect SelectecdObjectChanged - Query rule loaded");
        }

        if (!gridPref) {
          // check for default template preference
          let defaultTemplate = objTemplates.data.find(
            (t) => t.object === selectedObject.id && t.default === true
          );

          if (defaultTemplate) {
            const defaultPref = {
              id: defaultTemplate.id,
              value: defaultTemplate.template_name,
            };
            setSelectedTemplate(defaultPref);
            console.log(
              `UseEffect SelectecdObjectChanged - Found default template for ${selectedObject.value}.  Setting selectedTemplate state to ${defaultPref.value}`
            );
          } else {
            if (tmpOptions.length === 0) {
              // create default grid columns
              // we don't care about the payload
              // at any given time, only 1 gridView (MainGrid or TranspositionGrid) will be
              // mounted and receive the event
              PubSub.publish("CreateDefaultGridColumns", true);
            } else {
              // use the first template
              setSelectedTemplate(tmpOptions[0]);
              console.log(
                `UseEffect SelectecdObjectChanged - No default template found for ${selectedObject.value}.  Setting selectedTemplate to ${tmpOptions[0].value}`
              );
            }
          }

          // check for default query preference
          let defaultQuery = objQueries.data.find(
            (t) => t.object === selectedObject.id && t.default === true
          );

          if (defaultQuery) {
            const defaultQueryPref = {
              id: defaultQuery.id,
              value: defaultQuery.name,
            };
            setSelectedQuery(defaultQueryPref);

            // no need to run useEffect for selectedQuery changed
            prevSelectedQuery.current = defaultQueryPref;

            console.log(
              `UseEffect SelectecdObjectChanged - Found default query preference for ${selectedObject.value}.  Setting selectedQuery to ${defaultQueryPref.value}`
            );

            // set the query rule
            const query = objQueries.data.find(
              (q) => q.id === defaultQueryPref.id
            );
            const rule = query.query_rules;
            setQueryRule(rule);

            console.log("UseEffect SelectecdObjectChanged - Query rule loaded");
          } else {
            if (qryOptions.length > 0) {
              // use the first query
              setSelectedQuery(qryOptions[0]);

              // no need to run useEffect for selectedQuery changed
              prevSelectedQuery.current = qryOptions[0];

              console.log(
                `UseEffect SelectecdObjectChanged - No default query preference found for ${selectedObject.value}. Setting selectedQuery to ${qryOptions[0].value}`
              );

              // set the query rule
              const query = objQueries.data.find(
                (q) => q.id === qryOptions[0].id
              );
              const rule = query.query_rules;
              setQueryRule(rule);

              // set the query rule

              console.log(
                "UseEffect SelectecdObjectChanged - Query rule loaded"
              );
            } else {
              setQueryRule([]);
            }
          }
        }

        // find the relationship preferences for the selected object
        const objRelPrefs = relationPreferences.data.preferences.find(
          (p) => p.object === selectedObject.id
        );

        // get metadata for relationships
        // if (objRelPrefs) {
        //   const prefs = objRelPrefs.relations;

        //   // get metadata if needed
        //   for (const p of prefs) {
        //     let metadata = objectMetadata.find((f) => f.objName === p.id);

        //     if (!metadata) {
        //       console.log(`getting object metadata for ${p.id}`);
        //       metadata = await ghf.getObjectMetadata(
        //         p.id,
        //         userInfo,
        //         objectMetadata
        //       );

        //       const newObjMetadata = {
        //         objName: p.id,
        //         metadata: metadata.records,
        //       };

        //       dispatch(addMetadata(newObjMetadata));
        //     }
        //   }
        // }

        // set view options
        const prefRec = objPreferences.data[0];

        const objectViewPrefs = prefRec.preferences.find(
          (p) => p.object === selectedObject.id
        );

        let optionsList = ["Grid"];

        if (objectViewPrefs) {
          if (objectViewPrefs.ganttView === true) {
            optionsList.push("Gantt");
          }

          if (objectViewPrefs.kanbanView === true) {
            optionsList.push("Kanban");
          }

          if (objectViewPrefs.scheduleView === true) {
            optionsList.push("Schedule");
          }

          if (objectViewPrefs.transpositionView === true) {
            optionsList.push("Transposition");
          }
        }

        gridViewOptions.current = [...optionsList];

        setSelectedGridView(optionsList[0]);

        // dispatch(setLoadingIndicator(false));
      } catch (error) {
        dispatch(setLoadingIndicator(false));

        // log error and notify user
        console.log(error.message);

        // notify user of error
        toast.error(error.message, { autoClose: 5000 });
      }
    };

    objChanged();
  }, [
    selectedObject,
    objectOptions,
    objectMetadata,
    gridPreferences,
    objPreferences,
    objQueries,
    objTemplates,
    queryOptions,
    relationPreferences,
    templateOptions,
    selectedGridView,
    dispatch,
    userInfo,
  ]);

  useEffect(() => {
    // update the QueryBuilder rules when the selected query changes
    // get child grid data
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
          `UseEffect SelectecdQueryChanged - Running gridHeader useEffect for query ${selectedQuery.value}`
        );

        prevSelectedQuery.current = { ...selectedQuery };

        const query = objQueries.data.find((q) => q.id === selectedQuery.id);

        // const queryResult = await ghf.getSelectedQuery(selectedQuery, userInfo);

        // if (queryResult.status === "error") {
        //   throw new Error(`gridView-useEffect() - ${queryResult.errorMessage}`);
        // }

        // const query = queryResult.records[0];

        const rule = query.query_rules;

        setQueryRule(rule);

        // update the query text after rule change
        let queryContent = null;
        if (jsonButton.current.checked) {
          queryContent = JSON.stringify(rule, null, 4);
        } else {
          queryContent = queryBuilderRef.current.getSqlFromRules(rule);
        }

        setQueryRuleText(queryContent);
        console.log(
          `UseEffect SelectecdQueryChanged - QueryBuilder rule updated`
        );

        // load the rule into the QueryBuilder
        queryBuilderRef.current.setRules(rule);

        // dispatch(setLoadingIndicator(false));
      } catch (error) {
        dispatch(setLoadingIndicator(false));
        console.log(error.message);

        // notify user of error
        toast.error(error.message, { autoClose: 5000 });
      }
    };

    queryChanged();
  }, [
    dispatch,
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
            getOptionLabel={(option) => (option ? option.value : "")}
            options={objectOptionsFiltered.current}
            ref={objectSelectorRef}
            value={selectedObject}
            renderInput={(params) => (
              <TextField {...params} label='Org Objects' variant='standard' />
            )}
            onChange={async (event, newValue) => {
              console.log(`Selected object changed to ${newValue.id}`);

              setSelectedObject(newValue);
              queryColumns.current = [];
              // queryBuilderRef.current.reset();

              // let qbColumns = null;

              // let objMetadata = objectMetadata.find(
              //   (f) => f.objName === newValue.id
              // );

              // if (objMetadata === undefined) {
              //   // get object metadata
              //   const metadataResult = await ghf.getObjectMetadata(
              //     newValue.id,
              //     userInfo,
              //     objectMetadata
              //   );

              //   if (metadataResult.status !== "ok") {
              //     throw new Error(
              //       `Error retrieving metadata for ${selectedObject.id}`
              //     );
              //   }

              //   // store object metadata in global state
              //   objMetadata = {
              //     objName: newValue.id,
              //     metadata: metadataResult.records,
              //   };

              //   dispatch(addMetadata(objMetadata));
              // }
              // // create QueryBuilder columns
              // qbColumns = ghf.createQueryBuilderColumns(objMetadata.metadata);

              // // setQueryColumns(qbColumns);
              // queryColumns.current = qbColumns;
            }}
            sx={{ width: 175 }}
          />

          <Autocomplete
            id='templateSelector'
            autoComplete
            includeInputInList
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => (option ? option.value : "")}
            options={templateOptions}
            value={selectedTemplate}
            ref={templateSelectorRef}
            renderInput={(params) => (
              <TextField {...params} label='Templates' variant='standard' />
            )}
            onChange={async (event, newValue) => {
              setSelectedTemplate({ ...newValue });
            }}
            sx={{ ml: 5, width: 225 }}
          />

          <Autocomplete
            id='querySelector'
            autoComplete
            includeInputInList
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => (option ? option.value : "")}
            options={queryOptions}
            value={selectedQuery}
            ref={querySelectorRef}
            renderInput={(params) => (
              <TextField {...params} label='Queries' variant='standard' />
            )}
            onChange={(event, newValue) => {
              setSelectedQuery({ ...newValue });
            }}
            sx={{ ml: 5, width: 225 }}
          />

          <Autocomplete
            id='viewSelector'
            autoComplete
            includeInputInList
            // getOptionLabel={(option) => (option ? option.label : "")}
            options={gridViewOptions.current}
            ref={viewSelectorRef}
            renderInput={(params) => (
              <TextField {...params} label='View Type' variant='standard' />
            )}
            value={selectedGridView}
            onChange={(event, newValue) => {
              setSelectedGridView({ ...newValue });
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
                    const rule = queryBuilderRef.current.getRules();
                    setQueryRule(rule);
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
                  {queryColumns.current.map((item) => {
                    const objMetadata = objectMetadata.find(
                      (m) => m.objName === selectedObject.id
                    );
                    if (objMetadata === undefined) {
                      return;
                    }
                    const metadataFields = objMetadata.metadata.fields;
                    const metadataField = metadataFields.find(
                      (f) => f.name === item.field
                    );

                    if (!metadataField) {
                      const a = 1;
                    }
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
            gridPreferences={gridPreferences}
            mainGridRef={mainGridRef}
            objectOptions={objectOptions}
            objPreferences={objPreferences}
            objQueries={objQueries}
            objTemplates={objTemplates}
            queryBuilderRef={queryBuilderRef}
            relationPreferences={relationPreferences}
            selectedGridView={selectedGridView}
            selectedObject={selectedObject}
            selectedQuery={selectedQuery}
            selectedTemplate={selectedTemplate}
            templateFields={templateFields}
            transpositionGridRef={transpositionGridRef}
            startTime={startTime}
            endTime={endTime}
            prevSelectedObject={prevSelectedObject}
            prevSelectedTemplate={prevSelectedTemplate}
            prevSelectedQuery={prevSelectedQuery}
          />
        </Box>
      </Box>
    </LoadingOverlay>
  );
}

export default React.memo(GridHeader);
