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
import { addMetadata } from "../../features/objectMetadataSlice";

// react query hooks
import useObjMetadata from "../../hooks/getObjMetadataHook";
import useRelatedGridData from "../../hooks/getRelatedGridDataHook";

// save template dialog
import SaveTemplateDialog from "../../components/saveTemplateDialog/saveTemplateDialog";

// Lodash
import _ from "lodash";

// loading spinner
import { setLoadingIndicator } from "../../features/loadingIndicatorSlice";

// grid functions
import * as ghf from "../../components/gridHeader/gridHeaderFuncs";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import CheckboxRenderer from "../aggrid/cellRenderers/checkboxRenderer";

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
  const {
    childObject,
    gridPreferences,
    masterGridRef,
    objTemplates,
    relationPreferences,
    selectedGridRow,
    selectedObject,
    templateFields,
  } = props;

  const dispatch = useDispatch();

  // used to update toast message
  const toastId = useRef(null);

  // only allow 1 expanded row
  // masterGridRef.api.forEachNode((node) => {
  //   if (node.data.Id !== selectedGridRow.Id) {
  //     node.setExpanded(false);
  //   }
  // });

  const classes = useStyles();

  // redux global state
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const userInfo = useSelector((state) => state.userInfo);

  // react query
  const objMetadata = useObjMetadata(childObject, userInfo);

  const relatedGridData = useRelatedGridData(
    selectedObject,
    selectedGridRow,
    childObject,
    userInfo
  );

  // local state
  const templateOptions = useRef([]);
  const prevTemplateOptions = useRef(null);

  const [selectedTemplate, setSelectedTemplate] = useState();
  const prevSelectedTemplate = useRef(null);

  const [selectedView, setSelectedView] = useState("Grid");
  const prevSelectedView = useRef(null);

  const [viewOptions, setViewOptions] = useState([]);
  const prevViewOptions = useRef(null);

  const prevRelationPrefs = useRef(null);

  const [objMetadataLoaded, setObjMetadataLoaded] = useState(false);

  // aggrid state
  const [rowData, setRowData] = useState([]);
  const prevRowData = useRef(null);

  const [columnDefs, setColumnDefs] = useState([]);
  const prevColumnDefs = useRef(null);

  const [changedRows, setChangedRows] = useState(null);

  const prevSelectedGridRow = useRef(null);
  const prevChildObject = useRef(null);

  // Create a lookup array.
  // when a cell value is changed, its id is added here.
  const changedCellIds = useRef([]);

  // local object references
  const gridRef = useRef(null);
  const templateSelectorRef = useRef(null);
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
        const templateResult = await ghf.getTemplate(
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
      const templateRecs = ghf.createSaveTemplateRecords(
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
          cellRenderer: CheckboxRenderer,
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
          cellRenderer: CheckboxRenderer,
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
          cellRenderer: CheckboxRenderer,
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

  // REACT QUERY

  if (objMetadata.isError) {
    // log error and notify user
    console.log(`ChildGridView() - ${objMetadata.error.message}`);

    // notify user of error
    toast.error("Error retrieving metadata", { autoClose: 5000 });
  }

  function loadTemplateOptions() {
    const options = [];
    // load template options for this object
    objTemplates.data.forEach((t) => {
      if (t.object === childObject && t.is_related === true) {
        const newOpt = {
          id: t.id,
          value: t.template_name,
        };
        options.push(newOpt);
      }
    });

    console.log(`template options loaded`);

    templateOptions.current = options;
    prevTemplateOptions.current = options;

    return options;
  }

  function getTemplate(tmpOptions) {
    if (tmpOptions.length === 0) {
      // no templates defined for this object

      // notify user of error
      toast.warn(`No templates defined for ${childObject}!`, {
        autoClose: 3000,
      });

      setSelectedTemplate(null);

      // create default grid columns
      let defaultGridCols = ghf.createDefaultGridColumns2(
        childObject,
        objMetadata,
        changedCellIds
      );
      setColumnDefs(defaultGridCols);
      prevColumnDefs.current = defaultGridCols;
      console.log(`default grid columns created`);
      return null;
    }

    // get template and query preferences for selectedObject
    const gridPref = gridPreferences.data.find(
      (p) => p.object === childObject && p.is_related === true
    );

    if (gridPref) {
      // find the template option with this Id
      const tmpOption = tmpOptions.current.find(
        (o) => o.id === gridPref.templateid
      );

      // use this template
      setSelectedTemplate(tmpOption);

      console.log(
        `useEffect childGridView templateChanged() - Found user template preference for ${childObject}.  Setting selectedTemplate state to ${tmpOption.value}`
      );
      return tmpOption;
    }

    if (!gridPref) {
      // check for default template preference
      let defaultTemplate = objTemplates.data.find(
        (t) =>
          t.object === childObject &&
          t.is_related === true &&
          t.default === true
      );

      if (defaultTemplate) {
        const defaultPref = {
          id: defaultTemplate.id,
          value: defaultTemplate.template_name,
        };
        setSelectedTemplate(defaultPref);
        console.log(
          `ChildGridView - Found default template for ${childObject}.  Setting selectedTemplate state to ${defaultPref.value}`
        );
      }

      if (!defaultTemplate) {
        // use the first one
        setSelectedTemplate(tmpOptions[0]);
        return tmpOptions[0];
      }
    }
  }

  // load template options
  // set selectedTemplate based on preferences or defaults
  if (
    objMetadata.isSuccess &&
    !_.isEqual(templateOptions.current, prevTemplateOptions.current) &&
    !_.isEqual(columnDefs, prevColumnDefs.current)
  ) {
    try {
      const tmpOptions = loadTemplateOptions();

      const template = getTemplate(tmpOptions);
    } catch (error) {
      setLoadingIndicator(false);

      // log error and notify user
      console.log(error.message);

      // notify user of error
      toast.error(error.message, { autoClose: 5000 });
    }
  }

  // selected template changed - create the grid columns
  if (
    objMetadata.isSuccess &&
    templateFields.isSuccess &&
    selectedTemplate &&
    !_.isEqual(selectedTemplate, prevSelectedTemplate.current)
  ) {
    // get the template fields for selected template
    const tempFields = [];
    templateFields.data.forEach((f) => {
      if (f.templateid === selectedTemplate.id) {
        tempFields.push(f);
      }
    });

    if (tempFields.length > 0) {
      const gridCols = ghf.createGridColumns2(
        childObject,
        tempFields,
        objMetadata,
        changedCellIds
      );

      setColumnDefs([...gridCols]);
      prevSelectedTemplate.current = selectedTemplate;
      console.log(`Grid columns created for ${selectedTemplate.value}`);
    } else {
      // log error and notify user
      console.log(
        `No template fields found for ${selectedTemplate.template_name}`
      );

      // notify user of error
      toast.error(
        `No template fields found for ${selectedTemplate.template_name}`,
        { autoClose: 5000 }
      );
    }
  }

  if (relatedGridData.isError) {
    // log error and notify user
    console.log(`ChildGridView() - ${relatedGridData.error.message}`);

    // notify user of error
    toast.error("Error retrieving grid records", { autoClose: 5000 });
  }

  if (
    relatedGridData.isSuccess &&
    !_.isEqual(prevRowData.current, relatedGridData.data)
  ) {
    prevRowData.current = relatedGridData.data;
    setRowData(relatedGridData.data[0]);
    console.log("row data created");
  }

  // set view preferences
  if (
    relationPreferences.isSuccess &&
    !_.isEqual(relationPreferences.data, prevRelationPrefs.current)
  ) {
    prevRelationPrefs.current = relationPreferences.data;

    const viewPrefs = [];
    const objPref = relationPreferences.data.preferences.find(
      (f) => f.object === selectedObject.id
    );

    if (objPref) {
      // found the prefs for this object
      const pref = objPref.relations.find((f) => f.id === childObject);

      if (pref) {
        if (pref.selected) {
          viewPrefs.push("Grid");
        }
        if (pref.transpositionView) {
          viewPrefs.push("Transpostion");
        }
        if (pref.ganttView) {
          viewPrefs.push("Gantt");
        }
        if (pref.kanbanView) {
          viewPrefs.push("Kanban");
        }
        if (pref.scheduleView) {
          viewPrefs.push("Schedule");
        }
      }
    }

    setViewOptions(viewPrefs);
    prevViewOptions.current = viewPrefs;
  }

  // selectedViewPrefernce changed
  if (!_.isEqual(selectedView, prevSelectedView.current)) {
    prevSelectedView.current = selectedView;

    switch (selectedView) {
      case "Grid": {
        break;
      }
      case "Gantt": {
        break;
      }
      case "Kanban": {
        break;
      }
      case "Schedule": {
        break;
      }
      case "Transposition": {
        break;
      }
    }
  }

  const autoGroupColumnDef = useMemo(() => {
    return {
      minWidth: 220,
      cellRendererParams: {
        suppressCount: false,
        checkbox: true,
      },
    };
  }, []);

  // register AgGrid components
  const components = {
    // agGridAutoComplete: AgGridAutocomplete,
    // autoCompleteEditor: AutoCompleteEditor,
    checkboxRenderer: CheckboxRenderer,
  };

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
          getOptionLabel={(option) => (option ? option.value : "")}
          includeInputInList
          isOptionEqualToValue={(option, value) => option.id === value.id}
          options={templateOptions.current}
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

      {/* add view router */}

      <div style={containerStyle}>
        <div style={gridStyle} className='ag-theme-alpine'>
          <AgGridReact
            animateRows={true}
            autoGroupColumnDef={autoGroupColumnDef}
            defaultColDef={defaultColDef}
            columnDefs={columnDefs}
            columnTypes={columnTypes}
            components={components}
            enableColResize='true'
            getRowId={getRowId}
            groupDisplayType={"singleColumn"}
            masterDetail={false}
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

export default ChildGridView;
