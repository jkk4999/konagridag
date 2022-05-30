import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

// Redux
import { useSelector, useDispatch } from "react-redux";

import PubSub from "pubsub-js";

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
import Box from "@mui/material/Box";

// React Spinner
import { setLoadingIndicator } from "../../features/loadingIndicatorSlice";

import * as ghf from "../../components/gridHeader/gridHeaderFuncs";

// Toast
import { toast } from "react-toastify";

// Lodash
import _ from "lodash";

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
  const {
    queryBuilderRef,
    objectOptions,
    objPreferences,
    relationPreferences,
    gridPreferences,
    selectedGridView,
    selectedObject,
    selectedTemplate,
    selectedQuery,
    templateFields,
    objTemplates,
    objQueries,
    startTime,
    endTime,
  } = props;

  // used to update toast message
  const toastId = useRef(null);

  console.log("Running main grid");

  // redux global state
  const dispatch = useDispatch();
  // const toolbarState = useSelector((state) => state.toolbarState);

  const objectMetadata = useSelector((state) => state.objectMetadata);

  const userInfo = useSelector((state) => state.userInfo);

  // AgGrid local state
  const [columnDefs, setColumnDefs] = useState(null);
  const [rowData, setRowData] = useState(null);
  const selectedGridRow = useRef(null);

  // Create a lookup array.
  // when a cell value is changed, its id is added here.
  const changedCellIds = useRef([]);

  // local state
  const prevColumnDefs = useRef(null);
  const prevSelectedObject = useRef(null);
  const prevSelectedTemplate = useRef(null);
  const prevSelectedQuery = useRef(null);

  const containerStyle = useMemo(() => ({ width: "95%", height: "90%" }), []);
  const gridStyle = useMemo(
    () => ({ height: "90%", width: "95%", marginLeft: "10px" }),
    []
  );

  const classes = useStyles();

  const getQueryData = useCallback(() => {
    const getData = async () => {
      try {
        console.log("Main grid - getting query data");

        // dispatch(setLoadingIndicator(true));

        const queryRule = queryBuilderRef.current.getRules();

        // if (queryRule.rules.length === 0) {
        //   console.log("Main grid exiting - query rules are 0");
        //   // dispatch(setLoadingIndicator(false));
        //   return;
        // }

        // // get query from database
        // const query = objQueries.data.find((q) => q.id === selectedQuery.id);

        // const queryRule = query.query_rules;

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
          queryRule,
          objMetadataFields,
          selectedObject.id
        );

        // run query
        const executeQueryResult = await ghf.runQuery(
          selectedObject.id,
          sqlResult
        );

        if (executeQueryResult.status !== "ok") {
          throw new Error(
            `MainGrid - Error executing query for ${selectedQuery.id}`
          );
        }

        let queryData = executeQueryResult.records[0];

        // update grid row state
        setRowData([...queryData]);

        console.log("Main grid data loaded");

        // endTime.current = performance.now();

        // console.log(
        //   `Main grid data created in ${
        //     endTime.current - startTime.current
        //   } milliseconds`
        // );

        // startTime.current = performance.now();

        // dispatch(setLoadingIndicator(false));
      } catch (error) {
        console.log(error.message);

        // dispatch(setLoadingIndicator(false));

        // notify user of error
        toast.error("Error executing query", { autoClose: 5000 });
      }
    };

    getData();
  }, [
    objectMetadata,
    queryBuilderRef,
    selectedObject,
    selectedQuery,
    userInfo,
    dispatch,
  ]);

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

      // dispatch(setLoadingIndicator(true));

      prevSelectedTemplate.current = { ...selectedTemplate };

      console.log(
        `MainGrid UseEffect SelectedTemplateChanged - to template ${selectedTemplate.value}`
      );

      try {
        // get the template fields for selected template
        const tempFields = [];
        templateFields.data.forEach((f) => {
          if (f.templateid === selectedTemplate.id) {
            tempFields.push(f);
          }
        });

        if (tempFields.length === 0) {
          throw new Error(
            `MainGrid UseEffect SelectedTemplateChanged - No template fields found for template ${selectedTemplate.id}`
          );
        }

        // create the grid columns
        const gridCols = ghf.createGridColumns(
          selectedObject.id,
          tempFields,
          objectMetadata,
          changedCellIds
        );

        setColumnDefs([...gridCols]);

        console.log(
          "MainGrid UseEffect SelectedTemplateChanged - grid columns created"
        );

        // endTime.current = performance.now();

        // console.log(
        //   `Main grid templates created in ${
        //     endTime.current - startTime.current
        //   } milliseconds`
        // );

        // startTime.current = performance.now();

        // dispatch(setLoadingIndicator(false));
      } catch (error) {
        // dispatch(setLoadingIndicator(false));

        // log error and notify user
        console.log(
          `MainGrid UseEffect SelectedTemplateChanged - ${error.message}`
        );

        // notify user of error
        toast.error(error.message, { autoClose: 5000 });
      }
    };

    tmpChanged();
  }, [selectedObject, selectedTemplate, ref, objectMetadata]);

  // query changed
  useEffect(() => {
    const queryChanged = async () => {
      if (!selectedQuery) {
        setRowData([]);
        console.log(
          "MainGrid useEffect queryChanged - returning selected query is null"
        );
        return;
      }

      // need to check if the selected query is for the selected object
      // main grid could render while the previous query for a different object is loaded
      // this happens when we have a asyncronous operation like getting metadata
      // find the query
      const q = objQueries.data.find((f) => f.id === selectedQuery.id);
      if (q.object !== selectedObject.id) {
        return;
      }

      // if (_.isEqual(selectedQuery, prevSelectedQuery.current)) {
      //   console.log("MainGrid useEffect queryChanged - query has not changed");
      //   return;
      // }

      console.log(
        `MainGrid UseEffect queryChanged - query is ${selectedQuery.value}`
      );

      prevSelectedQuery.current = selectedQuery;

      getQueryData();
    };

    queryChanged();
  }, [selectedQuery, getQueryData]);

  // RunQuery - subscribe to runQuery toolbar event
  useEffect(() => {
    const runQueryHandler = (msg, data) => {
      switch (msg) {
        case "RunQuery":
          getQueryData();
          break;
        default:
          break;
      }
    };
    var runQueryToken = PubSub.subscribe("RunQuery", runQueryHandler);

    return () => {
      PubSub.unsubscribe(runQueryToken);
    };
  }, []);

  // AddRecord - subscribe to toolbar event
  useEffect(() => {
    const addRecordHandler = (msg, data) => {
      // create a new grid record when user clicks toolbar button
      switch (msg) {
        case "AddRecord":
          // addGridRecord();
          break;
        default:
          break;
      }
    };
    var addRecordToken = PubSub.subscribe("AddRecord", addRecordHandler);

    return () => {
      PubSub.unsubscribe(addRecordToken);
    };
  }, []);

  // ClearData - subscribe to toolbar event
  useEffect(() => {
    // PubSub function
    const clearDataHandler = (msg, data) => {
      switch (msg) {
        case "ClearData":
          setRowData([]);
          break;
        default:
          break;
      }
    };

    var clearDataToken = PubSub.subscribe("ClearData", clearDataHandler);

    return () => {
      PubSub.unsubscribe(clearDataToken);
    };
  }, []);

  // CreateDefaultGridColumns - subscribe to toolbar event
  useEffect(() => {
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

    var createDefaultGridColumnsToken = PubSub.subscribe(
      "CreateDefaultGridColumns",
      createDefaultGridColumnsHandler
    );

    return () => {
      PubSub.unsubscribe(createDefaultGridColumnsToken);
    };
  }, [objectMetadata, selectedObject]);

  // DeleteRecord subscription - subscribe to toolbar event
  useEffect(() => {
    const deleteRecordHandler = (msg, data) => {
      // delete the selected grid records when user clicks toolbar button
      switch (msg) {
        case "DeleteRecords":
          // deleteGridRecords();
          break;
        default:
          break;
      }
    };
    var deleteRecordToken = PubSub.subscribe(
      "DeleteRecords",
      deleteRecordHandler
    );

    return () => {
      PubSub.unsubscribe(deleteRecordToken);
    };
  }, []);

  // SaveRecords - subscribe to toolbar event
  useEffect(() => {
    const saveRecordsHandler = (msg, data) => {
      // save changes to database
      switch (msg) {
        case "SaveRecords":
          getQueryData();
          break;
        default:
          break;
      }
    };
    var saveRecordsToken = PubSub.subscribe("SaveRecords", saveRecordsHandler);

    return () => {
      PubSub.unsubscribe(saveRecordsToken);
    };
  }, [getQueryData]);

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
      masterGridRef: ref,
      relationPreferences: relationPreferences,
      objTemplates: objTemplates,
      gridPreferences: gridPreferences,
    };
  }, [ref, relationPreferences, selectedObject, objTemplates]);

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
  }, []);

  function gridRowClicked(params) {
    selectedGridRow.current = params.data;
  }

  function gridRowDataChanged(params) {
    // The client has set new data into the grid using api.setRowData() or by
    // changing the rowData bound property.
    const api = params.api;
    const columnApi = params.columnApi;

    endTime.current = new Date();
    var duration =
      (endTime.current.getTime() - startTime.current.getTime()) / 1000;

    console.log("Main grid rendering took " + duration + " seconds.");
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
    ref.current.columnApi.getAllColumns().forEach((column) => {
      if (column.colDef.field !== "error") {
        allColumnIds.push(column.getId());
      }
    });
    ref.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);
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
            objPreferences: objPreferences,
            selectedObject: selectedObject,
            objectOptions: objectOptions,
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
            relationPreferences: relationPreferences,
            objectOptions: objectOptions,
          },
        },
      ],
    };
  }, [selectedObject, objectOptions]);

  // register AgGrid components
  const components = {
    // agGridAutoComplete: AgGridAutocomplete,
    autoCompleteEditor: AutoCompleteEditor,
    checkboxRenderer: CheckboxRenderer,
  };

  if (!columnDefs || !rowData) {
    return <></>;
  }

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
            ref={ref}
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
