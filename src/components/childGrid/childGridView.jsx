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
import { addGridState } from "../../features/childGridStateSlice";
import { removeGridState } from "../../features/childGridStateSlice";
import { updateGridState } from "../../features/childGridStateSlice";

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
import Button from "@mui/material/Button";
import { Checkbox } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { FormControlLabel } from "@mui/material";
import { Stack } from "@mui/material";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Toolbar from "@mui/material/Toolbar";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

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
  const { masterObject, childObject, masterGridRef, selectedGridRow } = props;

  // only allow 1 expanded row
  // masterGridRef.api.forEachNode((node) => {
  //   if (node.data.Id !== selectedGridRow.Id) {
  //     node.setExpanded(false);
  //   }
  // });

  const classes = useStyles();

  // local state
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // redux global state
  const dispatch = useDispatch();
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const userInfo = useSelector((state) => state.userInfo);

  // local state// previous state values
  const [rowData, setRowData] = useState([]);
  const prevRowData = useRef(null);
  const [colDefs, setColDefs] = useState([]);
  const prevColDefs = useRef(null);
  const [templateOptions, setTemplateOptions] = useState(null);

  // local object references
  const gridRef = useRef(null);
  const saveTemplateGridRef = useRef(null);
  const templateVisibilityRef = useRef(null);
  const templateSelectorRef = useRef(null);

  // save template form
  const [saveTemplateGridCols, setSaveTemplateGridCols] = useState([]);
  const [saveTemplateGridData, setSaveTemplateGridData] = useState([]);
  const [saveTemplateFormOpen, setSaveTemplateFormOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const templateVisibility = useRef(false);

  // Snackbar
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const containerStyle = useMemo(() => ({ width: "95%", height: "90%" }), []);

  const gridStyle = useMemo(
    () => ({ height: "90%", width: "95%", marginLeft: "10px" }),
    []
  );

  // use application id as the grid row id
  const getRowId = useCallback((params) => params.data.id, []);

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

  // TEMPLATE FUNCTIONS

  function onCloseTemplateForm() {
    saveTemplateFormOpen(false);
  }

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

  useEffect(() => {
    /*  when no column defs exist
      1 - load the template options
      2 - set selected template based on preferences or defaults
      3 - create the grid columns
  */

    const configureGrid = async () => {
      if (_.isEqual(colDefs, prevColDefs.current)) {
        return;
      }

      console.log(`Configuring child grid ${childObject}`);

      let currentTemplate = null;

      setLoadingIndicator(true);

      let gridCols = [];

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

        // check for grid preferences
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

        if (prefData.length === 1) {
          // get template preferenceId
          const templatePrefId = Number(prefData[0].templateid);

          // find the template option with this Id
          const tmpOption = tmpOptions.find((o) => o.id === templatePrefId);

          // use this template
          setSelectedTemplate(tmpOption);
          currentTemplate = { ...tmpOption };
        }

        // if no preferences, check for defaults
        const defaultTemplateResult = await gf.getDefaultTemplates(
          childObject,
          userInfo.orgid,
          true, // default
          true, // is_active
          true, // is_public
          true, // is_related,
          null // owner
        );

        if (defaultTemplateResult.status === "error") {
          throw new Error(
            `Error retrieving template defaults for ${childObject}`
          );
        }

        const defaultTemplates = defaultTemplateResult.records;

        if (defaultTemplates.length > 1) {
          // default templates only valid for public templates
          // there should only be 1 default template per object
          throw new Error(
            `Error - found more than 1 default template for ${childObject}`
          );
        }

        if (defaultTemplates.length === 1) {
          const defaultTemplate = defaultTemplates[0];

          // find the template option with this Id
          const defaultTemplateOption = tmpOptions.find(
            (t) => t.id === Number(defaultTemplate.id)
          );

          setSelectedTemplate(defaultTemplateOption);
          currentTemplate = { ...defaultTemplateOption };
        }

        if (defaultTemplates.length === 0 && tmpOptions.length > 0) {
          // no default template, so pick the first template
          setSelectedTemplate(tmpOptions[0]);
          currentTemplate = { ...tmpOptions[0] };
        }

        if (tmpOptions.length === 0) {
          // no templates defined for this object

          // create default grid columns
          let defaultGridCols = await gf.createDefaultGridColumns(
            childObject,
            objectMetadata
          );

          setColDefs(defaultGridCols);
          prevColDefs.current = defaultGridCols;

          return;
        }

        if (currentTemplate) {
          const result = await gf.getTemplateFields(currentTemplate);

          if (result.status === "error") {
            throw new Error("Error retrieving temmplate fields");
          }

          // create the grid columns
          gridCols = await gf.createGridColumns(
            childObject,
            result.records,
            objectMetadata,
            gridRef
          );

          setColDefs(gridCols);
          prevColDefs.current = gridCols;
        }

        // get the data
        const whereClause = `${masterObject.id}Id = '${selectedGridRow.Id}'`;

        const response = await gf.runQuery(childObject, whereClause);

        if (response.status === "error") {
          throw new Error(
            `Error retrieving related records for ${childObject}`
          );
        }

        const data = response.records[0];
        setRowData(data);
        prevRowData.current = data;

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

    configureGrid();
  }, [
    childObject,
    masterObject,
    selectedGridRow,
    dispatch,
    colDefs,
    objectMetadata,
    userInfo,
    enqueueSnackbar,
  ]);

  useEffect(() => {
    // get the data when the selected row changes

    const getData = async () => {
      if (_.isEqual(rowData, prevRowData)) {
        return;
      }

      // get the data
      const whereClause = `${masterObject.id}Id = '${selectedGridRow.Id}'`;

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
  }, [
    selectedGridRow,
    childObject,
    colDefs,
    rowData,
    dispatch,
    masterObject.id,
  ]);

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
      <SaveTemplateDialog
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
      />

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
          includeInputInList
          options={templateOptions}
          value={selectedTemplate}
          ref={templateSelectorRef}
          renderInput={(params) => (
            <TextField {...params} label='Templates' variant='standard' />
          )}
          onChange={async (event, newValue) => {
            setSelectedTemplate(newValue);
          }}
          sx={{ ml: 5, width: 350 }}
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
