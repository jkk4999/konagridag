// React
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

import { useSelector, useDispatch } from "react-redux";

import PubSub from "pubsub-js";

// Redux
import { setGridData } from "../../features/gridDataSlice";

// React Spinner
import LoadingOverlay from "react-loading-overlay-ts";
import DotLoader from "react-spinners/DotLoader";

// Lodash
import _ from "lodash";

// subviews
import DetailCellRenderer from "../../components/subviewRenderer/subviewRenderer";

// Redux
import { addMetadata } from "../../features/objectMetadataSlice";
import { setLoadingIndicator } from "../../features/loadingIndicatorSlice";

import { setQueryRule } from "../../features/queryRuleSlice";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import CheckboxRenderer from "../aggrid/cellRenderers/checkboxRenderer";
import GridRelationshipsPanel from "../../components/gridRelationshipsPanel/gridRelationshipsPanel";
import ObjectPreferencesPanel from "../../components/objectPreferencesPanel/objectPreferencesPanel";
import AgGridAutocomplete from "../../components/aggridAutoComplete";
import AutoCompleteEditor from "../../components/autoCompleteEditor";

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
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SaveTemplateIcon from "@mui/icons-material/ViewColumn";
import SaveIcon from "@mui/icons-material/CheckOutlined";

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

import * as tgf from "./transpositionGridFunctions";
import * as gf from "../../views/gridView/gridFunctions";

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

const getRowId = (params) => {
  return params.data.Id;
};

let showErrors = false;
// change row tracking state
let changedRowTracking = [];
let newRowTracking = [];

// event topics
const AddRow = Symbol("addRow");
const DeleteRow = Symbol("deleteRow");
const Save = Symbol("save");
const RunQuery = Symbol("runQuery");
const Refresh = Symbol("refresh");

const addRecordHandler = (msg, data) => {
  switch (msg) {
    case AddRow:
      console.log(data);
      break;
    default:
      break;
  }
};

const deleteRecordHandler = (msg, data) => {
  switch (msg) {
    case DeleteRow:
      console.log(data);
      break;
    default:
      break;
  }
};

const runQueryHandler = (msg, data) => {
  switch (msg) {
    case RunQuery:
      console.log(data);
      break;
    default:
      break;
  }
};

const saveHandler = (msg, data) => {
  switch (msg) {
    case Save:
      console.log(data);
      break;
    default:
      break;
  }
};

const refreshHandler = (msg, data) => {
  switch (msg) {
    case Refresh:
      console.log(data);
      break;
    default:
      break;
  }
};

// subscribe to parent events and save token to unsubscribe
var addRowToken = PubSub.subscribe(AddRow, addRecordHandler);
var deleteRowToken = PubSub.subscribe(DeleteRow, deleteRecordHandler);
var runQueryToken = PubSub.subscribe(RunQuery, runQueryHandler);
var refreshToken = PubSub.subscribe(Refresh, refreshHandler);
var saveToken = PubSub.subscribe(Save, saveHandler);

function TranspositionGrid(props) {
  // props
  const {
    mainGridRef,
    gridRef,
    queryBuilderRef,
    getQuerySQL,
    runQuery,
    objectOptions,
  } = props;

  const objectSelectorRef = props.objectSelectorRef;
  const templateSelectorRef = props.templateSelectorRef;
  const querySelectorRef = props.querySelectorRef;
  const viewSelectorRef = props.viewSelectorRef;
  let templateOptions = props.templateOptions;
  let queryOptions = props.queryOptions;
  let viewOptions = props.viewOptions;

  // Redux global state
  const dispatch = useDispatch();
  const gridData = useSelector((state) => state.gridData);

  // true when user makes changes to selected query
  const queryChanged = useSelector((state) => state.queryChanged);

  const loadingIndicator = useSelector((state) => state.loadingIndicator);
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const selectedObject = useSelector((state) => state.selectedObject);
  const selectedQuery = useSelector((state) => state.selectedQuery);
  const selectedTemplate = useSelector((state) => state.selectedTemplate);
  const selectedGridView = useSelector((state) => state.selectedGridView);
  const userInfo = useSelector((state) => state.userInfo);

  const setQueryRuleText = props.setQueryRuleText;
  const saveQueryText = props.saveQueryText;
  const setSaveTemplateText = props.setSaveTemplateText;
  const setSaveQueryText = props.setSaveQueryText;

  const setTemplateOptions = props.setTemplateOptions;

  // save template form
  const [saveTemplateGridCols, setSaveTemplateGridCols] = useState([]);
  const [saveTemplateGridData, setSaveTemplateGridData] = useState([]);
  const [saveTemplateFormOpen, setSaveTemplateFormOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const templateVisibility = useRef(false);

  // custom Autocomplete cell editor
  const [components] = useState({
    autoCompleteEditor: AutoCompleteEditor,
    checkboxRenderer: CheckboxRenderer,
  });

  // Snackbar
  const { enqueueSnackbar } = useSnackbar();

  const onClickDismiss = (key) => () => {
    notistackRef.current.closeSnackbar(key);
  };

  const notistackRef = React.createRef();

  // local object references
  const selectedGridRow = useRef(null);

  // grid view local state
  const prevColumnDefs = useRef(null);
  const prevObjectOptions = useRef(null);
  const prevQueryOptions = useRef(null);
  const prevSelectedGridRow = useRef(null);
  const prevSelectedObject = useRef(null);
  const prevSelectedTemplate = useRef(null);
  const prevSelectedQuery = useRef(null);
  const prevTemplateOptions = useRef(null);

  // AgGrid local state
  const [transposedColumns, setTransposedColumns] = useState([]);
  const [transposedRows, setTransposedRows] = useState([]);

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

  useEffect(() => {
    // when the selected template changes, create the transposed grid columns
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

        // create the transposed grid columns
        const response = await tgf.createTransposedGridColumns(
          selectedTemplate,
          gridData
        );

        if (response.status === "error") {
          throw new Error(response.errorMessage);
        }

        setTransposedColumns(response.records);

        // create the transposed grid rows
        // create one grid row for each property

        let newRowData = [];

        gridRef.columnApi.columnDefs.forEach((c, index) => {
          // add a special column for the column name
          let row = {
            col0: c.field,
          };

          gridRef.api.forEachNode((node, index) => {
            const rec = node.data;
            const colName = `col${index + 1}`;
            row[colName] = rec[c.field];
            newRowData.push(row);
          });
        });

        setTransposedRows(newRowData);
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
  }, [selectedTemplate]);

  useEffect(() => {
    const queryChanged = async () => {
      try {
        setLoadingIndicator(true);

        const query = queryBuilderRef.current.getRules();

        // get object metadata
        const metadataResult = await gf.getObjectMetadata(
          selectedObject.id,
          userInfo,
          objectMetadata
        );
        const objMetadata = metadataResult.records;

        let objMetadataFields = objMetadata.metadata.fields;

        // get the query
        const sqlResult = getQuerySQL(
          query,
          objMetadataFields,
          selectedObject.id
        );

        // run query
        const executeQueryResult = await gf.runQuery(
          selectedObject.id,
          sqlResult
        );

        if (executeQueryResult.status !== "ok") {
          throw new Error(`Error executing query for ${selectedQuery.id}`);
        }

        let queryData = executeQueryResult.records[0];

        // update grid row state
        setTransposedRows(queryData);

        setLoadingIndicator(false);
      } catch (error) {
        console.log(error.message);

        setLoadingIndicator(false);

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

    queryChanged();
  }, [selectedQuery, queryChanged]);

  const classes = useStyles();

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

  const doesExternalFilterPass = useCallback(
    (node) => {
      return node.data.error;
    },
    [showErrors]
  );

  const isExternalFilterPresent = useCallback(() => {
    return showErrors;
  }, []);

  const externalFilterChanged = useCallback((newValue) => {
    showErrors = newValue;
    gridRef.current.api.onFilterChanged();
  }, []);

  function gridCellValueChanged(params) {
    const rowIndex = params.rowIndex;
    const columnName = params.column;
    const columnDef = params.columnDef;
    const oldValue = params.oldValue;
    const newValue = params.newValue;

    if (params.oldValue !== params.newValue) {
      var column = params.column.colDef.field;
      params.column.colDef.cellStyle = { backgroundColor: "#90EE90" };

      params.api.refreshCells({
        force: true,
        columns: [params.column.getId()],
        rowNodes: [params.node],
      });

      const rowId = params.node.data.Id;

      if (!changedRowTracking.includes(rowId)) {
        changedRowTracking.push(rowId);
      }
    }
  }

  async function saveGridData() {
    var api = gridRef.current.api;

    let changedRows = [];

    changedRowTracking.forEach((r) => {
      const node = api.getRowNode(r);
      changedRows.push(node.data);
    });

    let objMetadata = objectMetadata.find(
      (f) => f.objName === selectedObject.id
    );
    const metadataFields = objMetadata.metadata.fields;

    // store updateable fields in a map
    let fieldUpdateableMap = new Map();

    metadataFields.forEach((field) => {
      if (field.updateable || field.name === "Id") {
        fieldUpdateableMap.set(field.name, field.updateable);
      }
    });

    // delete error field and relationship properties from grid records
    changedRows.forEach((rec) => {
      for (const [key, value] of Object.entries(rec)) {
        // map won't contain read-only or relationship fields
        if (fieldUpdateableMap.get(key) === undefined) {
          delete rec[key];
        }
      }
    });

    // force error to test error filtering
    // changedRows[0].NumberOfEmployees = "/";

    try {
      // do the update
      const url = "/salesforce/sobjectUpdate";

      const payload = {
        sobject: selectedObject.id,
        records: changedRows,
      };

      const response = await fetch(url, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Network error encountered updating ${selectedObject.id} records`
        );
      }

      const result = await response.json();

      // inspect each record to see if it saved
      // add error message to record if operation failed
      let hasErrors = false;
      result.forEach((r) => {
        const node = gridRef.current.api.getRowNode(r.id);
        const rec = node.data;

        if (r.status !== "ok") {
          rec["error"] = r.status;

          //  update grid row with error message
          node.setData(rec);
          hasErrors = true;
        } else {
          api.refreshCells({
            force: true,
            suppressFlash: true,
            rowNodes: [node],
          });
          // remove row from change tracking
          let newArray = changedRowTracking.filter((el) => el !== r.id);
          changedRowTracking = [...newArray];
        }
      });

      // TBD - ADD NEW RECORD PROCESSING
      let newRows = [];

      newRowTracking.forEach((r) => {
        const node = api.getRowNode(r);
        newRows.push(node.data);
      });

      if (!hasErrors) {
        // turn off error filtering
        showErrors = false;

        // requery the data, because triggers could have fired
        runQuery();

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

        enqueueSnackbar("Records saved", snackOptions);
      } else {
        // display rows with errors (by setting filter)
        externalFilterChanged(true);

        // notify user
        const snackOptions = {
          variant: "error",
          autoHideDuration: 3000,
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
          TransitionComponent: Slide,
        };

        enqueueSnackbar("Error saving records", snackOptions);
      }
    } catch (error) {
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
      if (column.colDef.field !== "error") {
        allColumnIds.push(column.getId());
      }
    });
    gridRef.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);
  }

  function onGridReady(e) {
    // gridApi.current = e.api;
    // columnApi.current = e.columnApi;
  }

  const autoSizeAll = useCallback((skipHeader) => {
    const allColumnIds = [];
    gridRef.current.columnApi.getAllColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);
  }, []);

  // configures tool panels
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
          id: "objectPreferences",
          labelDefault: "Objects",
          labelKey: "objects",
          iconKey: "menuPin",
          width: 580,
          toolPanel: ObjectPreferencesPanel,
          toolPanelParams: {
            orgObjects: objectOptions,
          },
        },
        {
          id: "gridRelationships",
          labelDefault: "Relationships",
          labelKey: "relationships",
          iconKey: "linked",
          width: 340,
          toolPanel: GridRelationshipsPanel,
          toolPanelParams: {
            selectedObject: selectedObject,
          },
        },
      ],
    };
  }, [selectedObject]);

  console.log("Rendering Grid View");

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
        <div style={containerStyle}>
          <div style={gridStyle} className='ag-theme-alpine'>
            <AgGridReact
              animateRows={true}
              autoGroupColumnDef={autoGroupColumnDef}
              columnDefs={transposedColumns}
              columnTypes={columnTypes}
              components={components}
              defaultColDef={defaultColDef}
              doesExternalFilterPass={doesExternalFilterPass}
              getRowId={getRowId}
              groupDisplayType={"singleColumn"}
              isExternalFilterPresent={isExternalFilterPresent}
              masterDetail={true}
              onFirstDataRendered={onFirstDataRendered}
              onGridReady={onGridReady}
              onCellValueChanged={gridCellValueChanged}
              onRowDataChanged={gridRowDataChanged}
              onRowClicked={gridRowClicked}
              onRowSelected={gridRowSelected}
              onSelectionChanged={gridSelectionChanged}
              ref={gridRef}
              rowBuffer={100}
              rowData={transposedRows}
              rowGroupPanelShow={"always"}
              rowModelType={"clientSide"}
              rowSelection={"multiple"}
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

export default React.memo(TranspositionGrid);
