import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

import { useSelector, useDispatch } from "react-redux";

// Redux
import { setToolbarState } from "../../features/toolbarStateSlice";

import PubSub from "pubsub-js";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import AgGridCheckbox from "../../components/aggridCheckboxRenderer";
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

// React Spinner
import LoadingOverlay from "react-loading-overlay-ts";
import DotLoader from "react-spinners/DotLoader";

import { setLoadingIndicator } from "../../features/loadingIndicatorSlice";

import * as ghf from "../../components/gridHeader/gridHeaderFuncs";

// Toast
import { toast } from "react-toastify";

// Lodash
import _, { isEqual } from "lodash";

// subviews
import DetailCellRenderer from "../../components/subviewRenderer/subviewRenderer";

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

let showErrors = false;
let changedRowTracking = [];
let newRowTracking = [];

const MainGrid = React.forwardRef((props, ref) => {
  const { gridRef, queryBuilderRef, objectOptions } = props;

  // used to update toast message
  const toastId = useRef(null);

  console.log("Running main grid");

  // redux global state
  const dispatch = useDispatch();
  const toolbarState = useSelector((state) => state.toolbarState);

  // true when user makes changes to selected query
  // const queryChanged = useSelector((state) => state.toolbarState.queryChanged);

  const loadingIndicator = useSelector((state) => state.loadingIndicator);
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const relationPreferences = useSelector(
    (state) => state.toolbarState.relationPreferences
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
  const selectedGridView = useSelector(
    (state) => state.toolbarState.selectedGridView
  );
  const userInfo = useSelector((state) => state.userInfo);

  // AgGrid local state
  // const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);
  const selectedGridRow = useRef(null);

  // Create a lookup array.
  // when a cell value is changed, its id is added here.
  const changedCellIds = useRef([]);

  // local state
  const prevColumnDefs = useRef(null);
  const prevSelectedTemplate = useRef(null);
  const prevSelectedQuery = useRef(null);

  const containerStyle = useMemo(() => ({ width: "95%", height: "90%" }), []);
  const gridStyle = useMemo(
    () => ({ height: "90%", width: "95%", marginLeft: "10px" }),
    []
  );

  const classes = useStyles();

  async function getQueryData() {
    try {
      setLoadingIndicator(true);

      const query = queryBuilderRef.current.getRules();

      if (query.rules.length === 0) {
        return;
      }

      // get object metadata
      const metadataResult = await ghf.getObjectMetadata(
        selectedObject.id,
        userInfo,
        objectMetadata
      );
      const objMetadata = metadataResult.records;

      let objMetadataFields = objMetadata.metadata.fields;

      // get the query
      const sqlResult = await ghf.getQuerySQL(
        query,
        objMetadataFields,
        selectedObject.id
      );

      // run query
      const executeQueryResult = await ghf.runQuery(
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
    } catch (error) {
      console.log(error.message);

      setLoadingIndicator(false);

      // notify user of error
      toast.error("Error executing query", { autoClose: 5000 });
    }
  }

  // PubSub functions
  const clearDataHandler = (msg, data) => {
    switch (msg) {
      case "ClearData":
        // const newToolbarState = { ...toolbarState };
        // newToolbarState.gridData = [];
        // dispatch(setToolbarState(newToolbarState));
        setRowData([]);
        break;
      default:
        break;
    }
  };

  const createDefaultGridColumnsHandler = async (msg, data) => {
    switch (msg) {
      case "CreateDefaultGridColumns": {
        // create default grid columns
        let defaultGridCols = await ghf.createDefaultGridColumns(
          selectedObject.id,
          objectMetadata,
          changedCellIds
        );

        setColumnDefs(defaultGridCols);
        prevColumnDefs.current = defaultGridCols;
        break;
      }
      default:
        break;
    }
  };

  const addRecordHandler = (msg, data) => {
    switch (msg) {
      case "AddRow":
        console.log(data);
        break;
      default:
        break;
    }
  };

  const deleteRecordHandler = (msg, data) => {
    switch (msg) {
      case "DeleteRow":
        console.log(data);
        break;
      default:
        break;
    }
  };

  const saveHandler = (msg, data) => {
    switch (msg) {
      case "Save":
        console.log(data);
        break;
      default:
        break;
    }
  };

  const refreshHandler = (msg, data) => {
    switch (msg) {
      case "Refresh":
        console.log(data);
        break;
      default:
        break;
    }
  };

  const runQueryHandler = (msg, data) => {
    // when user modifies the selected query
    // and hits the Query button to execute
    switch (msg) {
      case "RunQuery":
        getQueryData();
        break;
      default:
        break;
    }
  };

  // clear data event
  useEffect(() => {
    var token = PubSub.subscribe("ClearData", clearDataHandler);
    return () => {
      PubSub.unsubscribe(token);
    };
  }, []);

  // selected template changed
  useEffect(() => {
    // when selected template changes, create the grid columns
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
        `Running mainGrid selected template changed useEffect for template ${selectedTemplate.label}`
      );

      try {
        setLoadingIndicator(true);

        // get the template fields for selected template
        const templateFieldResult = await ghf.getTemplateFields(
          selectedTemplate
        );

        if (templateFieldResult.status === "error") {
          throw new Error(
            `gridView-useEffect() - ${templateFieldResult.errorMessage}`
          );
        }

        const templateFieldData = templateFieldResult.records;

        // create the grid columns
        const gridCols = await ghf.createGridColumns(
          selectedObject.id,
          templateFieldData,
          objectMetadata,
          gridRef,
          changedCellIds
        );

        setColumnDefs(gridCols);

        setLoadingIndicator(false);
      } catch (error) {
        setLoadingIndicator(false);
        // log error and notify user
        console.log(`useEffectTemplateChanged() - ${error.message}`);

        // notify user of error
        toast.error(error.message, { autoClose: 5000 });
      }
    };

    tmpChanged();
  }, [selectedObject, selectedTemplate, gridRef, objectMetadata]);

  // query changed
  useEffect(() => {
    const queryChanged = async () => {
      if (!selectedQuery) {
        return;
      }

      if (_.isEqual(selectedQuery, prevSelectedQuery.current)) {
        return;
      }

      console.log(
        `Running mainGrid queryChanged useEffect for query ${selectedQuery.label}`
      );

      prevSelectedQuery.current = selectedQuery;

      getQueryData();
    };

    queryChanged();
  }, [selectedQuery, getQueryData]);

  // ClearData subscription
  useEffect(() => {
    var clearDataToken = PubSub.subscribe("ClearData", clearDataHandler);
    return () => {
      PubSub.unsubscribe(clearDataToken);
    };
  }, [clearDataHandler]);

  // RunQuery subscription
  useEffect(() => {
    var runQueryToken = PubSub.subscribe("RunQuery", runQueryHandler);
    return () => {
      PubSub.unsubscribe(runQueryToken);
    };
  }, [runQueryHandler]);

  // CreateDefaultGridColumns subscription
  useEffect(() => {
    var createDefaultGridColumnsToken = PubSub.subscribe(
      "CreateDefaultGridColumns",
      createDefaultGridColumnsHandler
    );
    return () => {
      PubSub.unsubscribe(createDefaultGridColumnsToken);
    };
  }, [createDefaultGridColumnsHandler]);

  // AgGrid functions
  const autoGroupColumnDef = useMemo(() => {
    return {
      minWidth: 220,
      cellRendererParams: {
        suppressCount: false,
        checkbox: true,
      },
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

  // custom Autocomplete cell editor
  const [components] = useState({
    // agGridAutoComplete: AgGridAutocomplete,
    autoCompleteEditor: AutoCompleteEditor,
  });

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

  // agGrid passes these values to subGrid
  const detailCellRendererParams = useMemo(() => {
    return {
      masterObject: selectedObject,
      masterGridRef: gridRef.current,
      relationPreferences: relationPreferences,
    };
  });

  const doesExternalFilterPass = useCallback((node) => {
    return node.data.error;
  }, []);

  const getRowId = (params) => {
    return params.data.Id;
  };

  const gridCellValueChanged = useCallback(({ node, data }) => {
    if (!changedCellIds.current.includes(node.id)) {
      // If id is not in array.
      // add to array.
      changedCellIds.current = [...changedCellIds.current, node.id];
    }
    // Also, change the data
    node.setData(data);
  });

  function gridRowClicked(params) {
    selectedGridRow.current = params.data;
  }

  function gridRowDataChanged(params) {
    // The client has set new data into the grid using api.setRowData() or by
    // changing the rowData bound property.
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

  function gridSelectionChanged(params) {
    const api = params.api;
    const columnApi = params.columnApi;
  }

  const isExternalFilterPresent = useCallback(() => {
    return showErrors;
  }, []);

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

  const onRowGroupOpened = (params) => {
    // selectedGridRow.current = params.data;
  };

  function getFieldDataType(fieldName, objFields) {
    let fieldDataType = null;

    const objField = objFields.find((f) => f.name === fieldName);
    fieldDataType = objField.dataType;
    return fieldDataType;
  }

  // configures tool panels
  const sideBar = useMemo(() => {
    return {
      toolPanels: [
        // columns panel
        {
          id: "columns",
          labelDefault: "Columns",
          labelKey: "columns",
          iconKey: "columns",
          toolPanel: "agColumnsToolPanel",
        },
        // objects panel
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
        // relationships panel
        {
          id: "gridRelationships",
          labelDefault: "Relationships",
          labelKey: "relationships",
          iconKey: "linked",
          width: 580,
          toolPanel: GridRelationshipsPanel,
          toolPanelParams: {
            selectedObject: selectedObject,
          },
        },
      ],
    };
  }, [selectedObject, objectOptions]);

  return (
    <Box
      sx={
        {
          // left: () => {
          //   if (sidebarSize === "visible") {
          //     return 60;
          //   } else {
          //     return 0;
          //   }
          // },
        }
      }
      className={classes.gridStyle}
    >
      <div style={containerStyle}>
        <div style={gridStyle} className='ag-theme-alpine'>
          <AgGridReact
            animateRows={true}
            autoGroupColumnDef={autoGroupColumnDef}
            columnDefs={columnDefs}
            columnTypes={columnTypes}
            components={components}
            defaultColDef={defaultColDef}
            detailCellRenderer={DetailCellRenderer}
            detailCellRendererParams={detailCellRendererParams}
            detailRowHeight={500}
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
            rowData={rowData}
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
  );
});

export default MainGrid;
