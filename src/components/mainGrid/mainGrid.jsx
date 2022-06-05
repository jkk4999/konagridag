import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "react-query";

// Redux
import { useSelector, useDispatch } from "react-redux";

// react query hooks
// import useSelectedQuery from "../../hooks/getSelectedQueryHook";

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
// import DetailCellRenderer from "../../components/subviewRenderer/subviewRenderer";
import DetailCellRenderer from "../../components/subViewRenderer2/subViewRenderer2";

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
    objMetadata,
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

  // react query
  // const queryData = useSelectedQuery(
  //   selectedObject,
  //   selectedQuery,
  //   queryBuilderRef.current,
  //   userInfo
  // );

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

        const queryRule = queryBuilderRef.current.getRules();

        let objMetadataFields = objMetadata.data.fields;

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
  }, [objMetadata, queryBuilderRef, selectedObject, selectedQuery, userInfo]);

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

  // REACT QUERY

  // if (useSelectedQuery.isLoading) {
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

  // if (objPreferences.isLoading) {
  //   dispatch(setLoadingIndicator(true));
  // } else {
  //   dispatch(setLoadingIndicator(false));
  // }

  // SELECTED TEMPLATE CHANGED
  if (
    !selectedTemplate ||
    !_.isEqual(selectedTemplate, prevSelectedTemplate.current)
  ) {
    prevSelectedTemplate.current = { ...selectedTemplate };

    console.log(
      `MainGrid SelectedTemplateChanged - to template ${selectedTemplate.value}`
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
          `MainGrid SelectedTemplateChanged - No template fields found for template ${selectedTemplate.id}`
        );
      }

      // create the grid columns
      const gridCols = ghf.createGridColumns2(
        tempFields,
        objMetadata,
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
      console.log(`MainGrid SelectedTemplateChanged - ${error.message}`);

      // notify user of error
      toast.error(error.message, { autoClose: 5000 });
    }
  }

  // SELECTED QUERY CHANGED
  const queryData = useQuery(
    ["objQuery", selectedQuery],
    async () => {
      // need to check if the selected query is for the selected object
      // main grid could render while the previous query for a different object is loaded
      // this happens when we have a asyncronous operation like getting metadata
      // const q = objQueries.find((f) => f.id === selectedQuery.id);
      // if (q.object !== selectedObject.id) {
      //   return;
      // }

      console.log(`queryData queryChanged - query is ${selectedQuery.value}`);

      // get query from database
      const query = objQueries.data.find((q) => q.id === selectedQuery.id);

      const queryRule = query.query_rules;

      // const queryRule = queryBuilderRef.current.getRules();

      const objFields = objMetadata.data.fields;

      const querySql = ghf.getQuerySQL(queryRule, objFields, selectedObject.id);

      let objMetadataFields = objMetadata.data.fields;

      const url = "/salesforce/gridQuery";

      const payload = {
        objName: selectedObject.id,
        whereClause: querySql,
      };

      let response = await fetch(url, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`SelectedQueryChanged() - ${response.message}`);
      }

      let result = await response.json();

      if (result.status === "error") {
        throw new Error(`Error executing query ${selectedQuery.value}`);
      }

      return result.records;
    },
    {
      enabled:
        Object.keys(userInfo).length > 0 &&
        selectedObject !== null &&
        selectedQuery !== null,
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );

  if (
    queryData.isSuccess &&
    !_.isEqual(selectedQuery, prevSelectedQuery.current)
  ) {
    const data = queryData.data[0];
    setRowData(data);

    console.log(`Query ${selectedQuery.value} data loaded`);

    prevSelectedQuery.current = selectedQuery;
  }

  if (queryData.isError) {
    // log error and notify user
    console.log(`gridHeader() - ${queryData.error.message}`);

    // notify user of error
    toast.error(queryData.error.message, { autoClose: 5000 });
  }

  // query changed
  // useEffect(() => {
  //   const queryChanged = async () => {
  //     if (!selectedQuery) {
  //       setRowData([]);
  //       console.log(
  //         "MainGrid useEffect queryChanged - returning selected query is null"
  //       );
  //       return;
  //     }

  //     // need to check if the selected query is for the selected object
  //     // main grid could render while the previous query for a different object is loaded
  //     // this happens when we have a asyncronous operation like getting metadata
  //     const q = objQueries.data.find((f) => f.id === selectedQuery.id);
  //     if (q.object !== selectedObject.id) {
  //       return;
  //     }

  //     // if (_.isEqual(selectedQuery, prevSelectedQuery.current)) {
  //     //   console.log("MainGrid useEffect queryChanged - query has not changed");
  //     //   return;
  //     // }

  //     console.log(
  //       `MainGrid UseEffect queryChanged - query is ${selectedQuery.value}`
  //     );

  //     prevSelectedQuery.current = selectedQuery;

  //     getQueryData();
  //   };

  //   queryChanged();
  // }, [selectedQuery, getQueryData, objQueries.data, selectedObject.id]);

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
  }, [getQueryData]);

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
          let defaultGridCols = ghf.createDefaultGridColumns2(
            selectedObject.id,
            objMetadata,
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
      selectedObject: selectedObject,
      masterGridRef: ref,
      relationPreferences: relationPreferences,
      objTemplates: objTemplates,
      gridPreferences: gridPreferences,
      templateFields: templateFields,
    };
  }, [ref, relationPreferences, selectedObject, objTemplates, gridPreferences]);

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
  }, [selectedObject, objectOptions, objPreferences, relationPreferences]);

  // register AgGrid components
  const components = {
    // agGridAutoComplete: AgGridAutocomplete,
    autoCompleteEditor: AutoCompleteEditor,
    checkboxRenderer: CheckboxRenderer,
  };

  if (!columnDefs || !rowData) {
    return <></>;
  }

  const GridChild = (props) => {
    const masterObject = props.masterObject;
    const masterGridRef = props.masterGridRef;
    const relationPreferences = props.relationPreferences;
    const objTemplates = props.objTemplates;
    const gridPreferences = props.gridPreferences;
    const renderCount = useRef(0);
    renderCount.current = renderCount.current + 1;
    console.log(`GridChild render count = ${renderCount.current}`); // fires only once - on initial render

    const tabArray = [];

    const objectPreferences = relationPreferences.data.preferences.find(
      (p) => p.object === masterObject.id
    );

    if (!objectPreferences) {
      return;
    }
    return <div>{`Render count is ${renderCount.current}`}</div>;
  };

  // const GridChildRenderer = React.memo(GridChild);

  const detailCellRenderer = React.memo(DetailCellRenderer);

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
            detailCellRenderer={detailCellRenderer}
            // detailCellRenderer={GridChildRenderer}
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
