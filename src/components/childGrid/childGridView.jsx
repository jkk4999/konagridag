// React
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

// Redux
import { useSelector, useDispatch } from "react-redux";

// save template dialog
import SaveTemplateDialog from "../../components/saveTemplateDialog/saveTemplateDialog";

// Lodash
import _ from "lodash";

// loading spinner
import { setLoadingIndicator } from "../../features/loadingIndicatorSlice";

// grid functions
import * as gf from "../../views/gridView/gridFunctions";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import AgGridCheckbox from "../../components/aggridCheckboxRenderer";

// Mui
import { makeStyles } from "@mui/styles";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import { IconButton } from "@mui/material";

import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Toolbar from "@mui/material/Toolbar";

// Toast
import { toast } from "react-toastify";

// MUI icons
import AddOutlinedIcon from "@mui/icons-material/Add";
// import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
// import DoubleArrowOutlinedIcon from "@mui/icons-material/DoubleArrowOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
// import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SaveTemplateIcon from "@mui/icons-material/ViewColumn";
import selectedObjectSlice from "../../features/selectedObjectSlice";

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

function ChildGridView(props) {
  const { masterObject, childObject, selectedGridRow } = props;

  // used to update toast message
  const toastId = useRef(null);

  // only allow 1 expanded row
  // masterGridRef.api.forEachNode((node) => {
  //   if (node.data.Id !== selectedGridRow.Id) {
  //     node.setExpanded(false);
  //   }
  // });

  const classes = useStyles();

  // local state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const prevSelectedTemplate = useRef(null);
  const prevSelectedView = useRef(null);

  // redux global state
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const userInfo = useSelector((state) => state.userInfo);
  const relationPreferences = useSelector(
    (state) => state.toolbarState.relationPreferences
  );

  // local state// previous state values
  const [rowData, setRowData] = useState([]);
  const prevRowData = useRef(null);
  const [colDefs, setColDefs] = useState([]);
  const prevColDefs = useRef(null);
  const [templateOptions, setTemplateOptions] = useState(null);
  const [changedRows, setChangedRows] = useState(null);
  const prevRelationPrefs = useRef(null);
  const prevViewOptions = useRef(null);
  const prevSelectedGridRow = useRef(null);

  // local object references
  const gridRef = useRef(null);
  const templateSelectorRef = useRef(null);
  const [viewOptions, setViewOptions] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  const viewSelectorRef = useRef(null);

  // save template form
  const [saveTemplateGridCols, setSaveTemplateGridCols] = useState([]);
  const [saveTemplateGridData, setSaveTemplateGridData] = useState([]);
  const [saveTemplateFormOpen, setSaveTemplateFormOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");

  const containerStyle = useMemo(() => ({ width: "95%", height: "90%" }), []);

  const gridStyle = useMemo(
    () => ({ height: "90%", width: "95%", marginLeft: "10px" }),
    []
  );

  // use application id as the grid row id
  const getRowId = useCallback(function (params) {
    return params.data.Id;
  }, []);

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      sortable: true,
      resizable: true,
      filter: "agMultiColumnFilter",
      minWidth: 100,
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

  function gridCellValueChanged(params) {
    // const rowIndex = params.rowIndex;
    // const columnName = params.column;
    // const columnDef = params.columnDef;
    // const oldValue = params.oldValue;
    // const newValue = params.newValue;

    // add row ID to row tracking state
    let rows = [];
    if (changedRows) {
      changedRows.forEach((v) => {
        rows.push(v);
      });
    }

    const newRowSet = new Set([...rows, params.node.data.Id]);

    setChangedRows(newRowSet);

    console.log("1");
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
        const templateResult = await gf.getTemplate(
          selectedTemplate.id,
          userInfo
        );

        if (templateResult.status !== "ok") {
          throw new Error(`Error retrieving selected template`);
        }

        // always returns 1 record
        const templateRec = templateResult.records[0];

        if (templateRec.owner === userInfo.userEmail) {
          setSaveTemplateName(selectedTemplate.label);
        }
      } else {
        // no templates found
        setSaveTemplateName("");
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
        childObject,
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

      return;
    } catch (error) {
      console.log(error.message);
      return;
    }
  }

  // populate view selector when relationPreferences changes
  useEffect(() => {
    const getViewOptions = async () => {
      if (_.isEqual(prevViewOptions.current, viewOptions)) {
        return;
      }

      console.log(`${childObject} grid - loading view options`);

      // always have a Grid view
      let optionsList = ["Grid"];

      // get relation preferences for the selected object
      const relationPref = relationPreferences.find(
        (f) => f.object === masterObject.id
      );

      if (relationPref) {
        // find the prefs for the child object
        const objPref = relationPref.relations.find(
          (r) => r.id === childObject
        );

        if (objPref && objPref.gantView) {
          optionsList.push("Gantt");
        }

        if (objPref && objPref.kanbanView) {
          optionsList.push("Kanban");
        }

        if (objPref && objPref.transpositionView) {
          optionsList.push("Transposition");
        }

        if (objPref && objPref.scheduleView) {
          optionsList.push("Schedule");
        }
      }

      setViewOptions([...optionsList]);

      prevViewOptions.current = [...optionsList];

      setSelectedView(optionsList[0]);

      prevSelectedView.current = optionsList[0];
    };

    getViewOptions();
  }, [relationPreferences, viewOptions, childObject, masterObject]);

  useEffect(() => {
    /*  
      1 - load the template options
      2 - set selected template based on preferences or defaults
  */

    const configureGrid = async () => {
      if (_.isEqual(colDefs, prevColDefs.current)) {
        return;
      }

      console.log(`configureGrid useEffect running for ${childObject}`);

      setLoadingIndicator(true);

      try {
        // get template records
        const templateResult = await gf.getTemplateRecords(
          childObject,
          userInfo
        );

        if (templateResult.status === "error") {
          throw new Error(`Error getting template options for ${childObject}}`);
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

        // get user preferences
        const prefResult = await gf.getGridPreferences(
          childObject,
          true, // is_related
          userInfo // userInfo
        );

        if (prefResult.status === "error") {
          throw new Error(
            `Error retrieving grid preferences for ${childObject}`
          );
        }

        const prefData = prefResult.records;

        if (prefData.length > 1) {
          throw new Error(
            `Found more than 1 user preference for ${childObject}`
          );
        }

        const userPref =
          prefResult.records.length > 0 ? prefResult.records[0] : null;

        if (templateData.length === 0) {
          // no templates defined for this object - create default grid columns
          let defaultGridCols = await gf.createDefaultGridColumns(
            childObject,
            objectMetadata
          );

          setColDefs(defaultGridCols);
          prevColDefs.current = defaultGridCols;

          setTemplateOptions([]);
          setSelectedTemplate(null);
          console.log(
            `No templates found for ${childObject}.  Creating default grid columns.`
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
            setSelectedTemplate(tmpOption);

            console.log(
              `Found template user preference for ${tmpOption.label}`
            );
          }

          if (!userPref) {
            // check for default template preference
            let defaultPref = templateData.forEach((t) => t.default === true);
            if (defaultPref !== undefined) {
              defaultPref = {
                id: defaultPref.id,
                label: defaultPref.template_name,
              };
              setSelectedTemplate(defaultPref);
              console.log(
                `Found template default preference for ${defaultPref.label}`
              );
            }

            // no defaults found
            if (defaultPref === undefined) {
              // use the first template
              setSelectedTemplate(tmpOptions[0]);
              console.log(
                `No user or default template preferences found for ${childObject}`
              );
            }
          }
        }

        setLoadingIndicator(false);
      } catch (error) {
        setLoadingIndicator(false);

        // log error and notify user
        console.log(error.message);

        // notify user of error
        toast.error(error.message, { autoClose: 5000 });
      }
    };

    configureGrid();
  }, [
    childObject,
    masterObject,
    selectedGridRow,
    colDefs,
    objectMetadata,
    userInfo,
  ]);

  // selectedTemplate changed
  useEffect(() => {
    /*  when the selected template changes
      1 - create the grid columns
    */

    const createGridColumns = async () => {
      if (_.isEqual(selectedTemplate, prevSelectedTemplate.current)) {
        return;
      }

      console.log(
        `${childObject} grid selectedTemplateChanged() - creating grid columns`
      );

      prevSelectedTemplate.current = selectedTemplate;

      if (selectedTemplate) {
        const result = await gf.getTemplateFields(selectedTemplate);

        if (result.status === "error") {
          throw new Error("Error retrieving temmplate fields");
        }

        // create the grid columns
        let gridCols = await gf.createGridColumns(
          childObject,
          result.records,
          objectMetadata,
          gridRef
        );

        setColDefs(gridCols);
        prevColDefs.current = gridCols;
      }
    };

    createGridColumns();
  }, [selectedTemplate, childObject, objectMetadata, prevSelectedTemplate]);

  // selectedRow changed
  useEffect(() => {
    // get the data when the selected row changes

    const getData = async () => {
      if (_.isEqual(selectedGridRow, prevSelectedGridRow.current)) {
        return;
      }

      prevSelectedGridRow.current = selectedGridRow;

      console.log(`${childObject} grid selectedRowChanged - getData())`);

      // get the data
      let whereClause = null;

      const masterObj = masterObject.id;
      if (masterObj.slice(-3) === "__c") {
        whereClause = `${masterObj} = '${selectedGridRow.Id}'`;
      } else {
        whereClause = `${masterObj}Id = '${selectedGridRow.Id}'`;
      }

      const response = await gf.runQuery(childObject, whereClause);

      if (response.status === "error") {
        throw new Error(`Error retrieving related records for ${childObject}`);
      }

      const data = response.records[0];

      setLoadingIndicator(false);

      setRowData(data);
      prevRowData.current = data;
    };

    getData();
  }, [selectedGridRow, childObject, colDefs, rowData, masterObject.id]);

  // selectedView changed
  useEffect(() => {
    /*
        1 - create the child view based on user input
    */

    const createView = async () => {
      if (!selectedView) {
        return;
      }

      console.log(`${childObject} grid selectedViewChanged())`);

      switch (selectedView) {
        case "Grid": {
          // TBD
          return <h1>Grid View</h1>;
        }
        case "Gantt": {
          // TBD
          return <h1>Gantt View</h1>;
        }
        case "Transposition": {
          // TBD
          return <h1>Transposition View</h1>;
        }
        case "Schedule": {
          // TBD
          return <h1>Schedule View</h1>;
        }
        case "Kanban": {
          // TBD
          return <h1>Kanban View</h1>;
        }
        default: {
          return <h1>No view found</h1>;
        }
      }
    };

    createView();
  }, [selectedView, childObject]);

  const autoGroupColumnDef = useMemo(() => {
    return {
      minWidth: 220,
      cellRendererParams: {
        suppressCount: false,
        checkbox: true,
      },
    };
  }, []);

  return (
    <Box
      sx={{
        height: 400,
      }}
      className={classes.gridStyle}
    >
      {/* <SaveTemplateDialog
        saveTemplateFormOpen={saveTemplateFormOpen}
        setSaveTemplateFormOpen={setSaveTemplateFormOpen}
        templateName={saveTemplateName}
        templateColumns={saveTemplateGridCols}
        gridData={saveTemplateGridData}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        selectedObject={childObject}
        templateOptions={templateOptions}
        setTemplateOptions={setTemplateOptions}
        setColumnDefs={setColDefs}
        gridRef={gridRef}
      /> */}

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

        <Autocomplete
          id='templateSelector'
          autoComplete
          getOptionLabel={(option) => (option ? option.label : "")}
          includeInputInList
          isOptionEqualToValue={(option, value) => option.id === value.id}
          options={templateOptions}
          value={selectedTemplate ? selectedTemplate : null}
          ref={templateSelectorRef}
          renderInput={(params) => (
            <TextField {...params} label='Templates' variant='standard' />
          )}
          onChange={async (event, newValue) => {
            setSelectedTemplate(newValue);
          }}
          sx={{ ml: 5, width: 350 }}
        />

        <Autocomplete
          id='childGridiewSelector'
          autoComplete
          includeInputInList
          options={viewOptions}
          ref={viewSelectorRef}
          renderInput={(params) => (
            <TextField {...params} label='View Type' variant='standard' />
          )}
          value={selectedView}
          onChange={(event, newValue) => {
            setSelectedView(newValue);
          }}
          sx={{ ml: 5, mt: -2, width: 150 }}
        />
      </Toolbar>

      <div style={containerStyle}>
        <div style={gridStyle} className='ag-theme-alpine'>
          <AgGridReact
            animateRows={true}
            autoGroupColumnDef={autoGroupColumnDef}
            defaultColDef={defaultColDef}
            columnDefs={colDefs}
            columnTypes={columnTypes}
            enableColResize='true'
            getRowId={getRowId}
            groupDisplayType={"singleColumn"}
            onCellValueChanged={gridCellValueChanged}
            onFirstDataRendered={onFirstDataRendered}
            ref={gridRef}
            rowData={rowData}
            rowBuffer={100}
            rowGroupPanelShow={"always"}
            rowSelection='multiple'
            showOpenedGroup={true}
            suppressColumnVirtualisation={true}
          ></AgGridReact>
        </div>
      </div>
    </Box>
  );
}

export default React.memo(ChildGridView);
