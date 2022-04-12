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

// React Spinner
import LoadingOverlay from "react-loading-overlay-ts";

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
import { Select } from "@mui/material/Select";
import { Stack } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Toolbar from "@mui/material/Toolbar";
import { Typography } from "@mui/material/styles/createTypography";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

// MUI icons
import AddOutlinedIcon from "@mui/icons-material/Add";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DoubleArrowOutlinedIcon from "@mui/icons-material/DoubleArrowOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SaveTemplateIcon from "@mui/icons-material/ViewColumn";

import { getThemeProps } from "@mui/styles";
import { setGridColumns } from "../../features/gridColumnsSlice";

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
  const loadingIndicator = useSelector((state) => state.loadingIndicator);

  const { masterObject, childObject, masterGridRef, selectedGridRow } = props;

  // only allow 1 expanded row
  masterGridRef.api.forEachNode((node) => {
    if (node.data.Id !== selectedGridRow.Id) {
      node.setExpanded(false);
    } else {
      node.setExpanded(true);
    }
  });

  const classes = useStyles();

  // local state
  const [colDefs, setColDefs] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateOptions, setTemplateOptions] = useState([]);
  // const [loading, setLoading] = useState[false];

  // previous state values
  const prevViewState = useRef([]);

  // redux global state
  const dispatch = useDispatch();
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const userInfo = useSelector((state) => state.userInfo);
  const gridViewState = useSelector((state) => state.childGridState);

  // get the child grid state
  const viewState = gridViewState.find((s) => s.childGrid === childObject);

  // local object references
  const gridRef = useRef(null);
  const saveTemplateGridRef = useRef(null);
  const templateVisibilityRef = useRef(null);
  const templateSelectorRef = useRef(null);

  // template form
  const [templateFormHeader, setTemplateFormHeader] = useState("");
  const [templateFormFields, setTemplateFormFields] = useState([]);
  const [templateFormData, setTemplateFormData] = useState([]);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const templateNameInput = useRef("");
  const templateVisibility = useRef(false);

  // Snackbar
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const containerStyle = useMemo(() => ({ width: "95%", height: "90%" }), []);

  const gridStyle = useMemo(
    () => ({ height: "90%", width: "95%", marginLeft: "10px" }),
    []
  );

  // statically fix row height for all detail grids
  const detailRowHeight = 500;

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

  function TemplateGridRecs() {
    // used in save template dialog
    // checkbox value is false for non-admin users
    let checkboxVal = false;

    // enable the Public/Private checkbox for admins
    let disableCheckbox = true;
    if (userInfo.profileName === "System Administrator") {
      disableCheckbox = false;
    }

    return (
      <Box
        className='ag-theme-alpine'
        sx={{
          width: 800,
          height: 400,
          mt: 2,
        }}
      >
        <Stack direction='row'>
          <TextField
            sx={{
              mb: 2,
              width: 300,
            }}
            id='templateNameInput'
            label='Template Name'
            variant='standard'
            defaultValue={templateNameInput.current}
            size='small'
            required
            onChange={(e) => {
              templateNameInput.current = e.target.value;
            }}
          />
          <FormControlLabel
            control={<Checkbox size='small' />}
            label='Public'
            ref={templateVisibilityRef}
            sx={{
              ml: 4,
            }}
            disabled={disableCheckbox}
            onChange={(e) => {
              // store value in useRef - needed when creating new templates
              templateVisibility.current = e.target.checked;
            }}
          />
        </Stack>

        <AgGridReact
          animateRows={true}
          columnDefs={templateFormFields}
          defaultColDef={defaultColDef}
          onFirstDataRendered={onFirstDataRendered}
          ref={saveTemplateGridRef}
          rowData={templateFormData}
        ></AgGridReact>
      </Box>
    );
  }

  async function onSaveTemplateClose(args) {
    setTemplateFormOpen(false);
  }

  async function onSaveTemplateForm(args) {
    try {
      const { api, columnApi } = saveTemplateGridRef.current;

      const templateName = templateNameInput.current;

      if (templateName === "") {
        // prompt user for template name
        const snackOptions = {
          variant: "error",
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
          TransitionComponent: Slide,
        };

        const key = enqueueSnackbar(
          "Please enter a template name",
          snackOptions
        );

        return;
      }

      // get current template owner
      let templateRec = null;

      if (viewState.selectedTemplate !== null) {
        const templateUrl = "/postgres/knexSelect";
        const templateResult = await gf.getTemplate(
          viewState.selectedTemplate.id,
          userInfo
        );

        if (templateResult.status !== "ok") {
          throw new Error(`Error retrieving template owner`);
        }

        // always returns 1 record
        templateRec = templateResult.records[0];
      }

      /* template rules order

        1 - non-admin users can only create private templates

        2 - only the owner of the template can update it
        
        3 - if the templateInputName is different from the selectedTemplate name
        then create a new template, else update existing template

        4 - if a non-admin user is not the owner of the template, then
        create a private template

        5 - if an admin user is not the owner of the template, then create
        a new template which has visibility determined by the public checkbox.
        the public checkbox is enabled for sys admins only

      */

      if (
        viewState.selectedTemplate === null ||
        templateRec === null ||
        viewState.selectedTemplate.label !== templateNameInput.current ||
        templateRec.owner !== userInfo.userEmail
      ) {
        // create a new template

        const tmpResult = await gf.createTemplate(
          templateName,
          childObject,
          templateVisibility.current,
          userInfo
        );

        if (tmpResult.status === "error") {
          throw new Error(`Error creating template for ${childObject}`);
        }

        const newTemplate = tmpResult.records[0];
        const newTemplateId = newTemplate.id;

        // get the template recs from the grid
        const templateRecs = saveTemplateGridRef.current.props.rowData;

        // change templateid to the new value
        templateRecs.forEach((t) => {
          t.templateid = newTemplateId;
        });

        const insertUrl = "/postgres/knexInsert";

        const insertPayload = {
          table: "template_field",
          values: templateRecs,
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
          throw new Error(
            `Error inserting template fields for template ${templateName}`
          );
        }

        let insertResult = await insertResponse.json();

        // adds the template to the grid template selector options
        let templateOps = [...templateOptions];

        const newTemplateOption = {
          id: newTemplate.id,
          label: newTemplate.template_name,
        };

        templateOps.push(newTemplateOption);

        const newState = {
          childGrid: childObject,
          templateOptions: templateOps,
          selectedTemplate: newTemplateOption,
          colDefs: viewState.colDefs,
          rowData: viewState.rowData,
        };

        dispatch(updateGridState(newState));
      } else {
        // update existing template

        // delete existing template fields
        const delResult = await gf.deleteTemplateFields(
          viewState.selectedTemplate
        );

        if (delResult.status !== "ok") {
          throw new Error(
            `Error deleting template fields for template ${templateName}`
          );
        }

        const deletedRecs = delResult.records;

        // get the template recs from the grid
        const templateRecs = saveTemplateGridRef.current.props.rowData;

        const insertUrl = "/postgres/knexInsert";

        const insertPayload = {
          table: "template_field",
          values: templateRecs,
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
          throw new Error(
            `Error inserting template fields for template ${templateName}`
          );
        }

        let insertResult = await insertResponse.json();

        // refresh the template

        // get the template fields for selected template
        const templateFieldResult = await gf.getTemplateFields(
          viewState.selectedTemplate
        );

        if (templateFieldResult.status === "error") {
          throw new Error(
            `Error retrieving template fields for template ${templateName}`
          );
        }

        const templateFieldData = templateFieldResult.records;

        // create the grid columns
        const gridCols = await gf.createGridColumns(
          masterObject.id,
          templateFieldData,
          objectMetadata,
          gridRef
        );

        setColDefs(gridCols);
      }

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

      const key = enqueueSnackbar("Template Saved", snackOptions);
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

      const key = enqueueSnackbar(error.message, snackOptions);
    }

    setTemplateFormOpen(false);
  }

  function onCloseTemplateForm() {
    setTemplateFormOpen(false);
  }

  function SaveTemplateDialog() {
    return (
      <Dialog open={templateFormOpen} fullWidth={true} maxWidth='md'>
        <DialogTitle>Save Tempate</DialogTitle>
        <DialogContent>
          <TemplateGridRecs />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseTemplateForm}>Cancel</Button>
          <Button onClick={onSaveTemplateForm}>Save</Button>
        </DialogActions>
      </Dialog>
    );
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
      if (viewState.selectedTemplate) {
        const templateUrl = "/postgres/knexSelect";

        const templateResult = await gf.getTemplate(
          viewState.selectedTemplate.id,
          userInfo
        );

        if (templateResult.status !== "ok") {
          throw new Error(`Error retrieving selected template`);
        }

        // always returns 1 record
        const templateRec = templateResult.records[0];

        templateNameInput.current = "";
        if (templateRec.owner === userInfo.userEmail) {
          templateNameInput.current = viewState.selectedTemplate.label;
        }
      } else {
        // no templates found
        templateNameInput.current = "";
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
      setTemplateFormFields(saveTemplateGridCols);
      setTemplateFormData(templateRecs);
      setTemplateFormHeader("Save Template");
      setTemplateFormOpen(true);

      return;
    } catch (error) {
      console.log(error.message);
      return;
    }
  }

  /*  
      1 - load the template options
      2 - set selected template based on preferences or defaults
      3 - create the grid columns
      4 - get the related records
  */
  useEffect(() => {
    const objChanged = async () => {
      setLoadingIndicator(true);

      let templateFields = [];
      let gridCols = [];

      // if viewState hasn't changed, do nothing
      if (_.isEqual(viewState, prevViewState.current)) {
        setLoadingIndicator(false);
        return;
      }

      // create the state

      const newState = {
        childGrid: childObject,
      };

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

        newState.templateOptions = tmpOptions;

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
          newState.selectedTemplate = tmpOption;
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

          newState.selectedTemplate = defaultTemplateOption;
        }

        if (defaultTemplates.length === 0 && tmpOptions.length > 0) {
          // no default template, so pick the first template
          newState.selectedTemplate = tmpOptions[0];
        }

        if (newState.selectedTemplate === undefined) {
          // create default grid columns

          gridCols = await gf.createDefaultGridColumns(
            childObject,
            objectMetadata
          );
        } else {
          const result = await gf.getTemplateFields(newState.selectedTemplate);

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
        }

        newState.colDefs = gridCols;

        // get the data
        const whereClause = `${masterObject.id}Id = '${selectedGridRow.Id}'`;

        const response = await gf.runQuery(childObject, whereClause);

        if (response.status === "error") {
          throw new Error(
            `Error retrieving related records for ${childObject}`
          );
        }

        const data = response.records[0];

        newState.rowData = data;

        // store the view state
        prevViewState.current = { ...newState };

        setLoadingIndicator(false);

        dispatch(addGridState(newState));
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

        const key = enqueueSnackbar(error.message, snackOptions);
      }
    };

    objChanged();
  });

  // compare arrays
  function getDifference(array1, array2) {
    return array1.filter((object1) => {
      return !array2.some((object2) => {
        return object1.id === object2.id;
      });
    });
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

  return (
    <Box
      sx={{
        height: 400,
      }}
      className={classes.gridStyle}
    >
      <SaveTemplateDialog />

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
          options={viewState === undefined ? [] : viewState.templateOptions}
          value={viewState === undefined ? "" : viewState.selectedTemplate}
          ref={templateSelectorRef}
          renderInput={(params) => (
            <TextField {...params} label='Templates' variant='standard' />
          )}
          onChange={async (event, newValue) => {
            setSelectedTemplate = newValue;
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
            columnDefs={viewState === undefined ? [] : viewState.colDefs}
            columnTypes={columnTypes}
            enableColResize='true'
            getRowId={getRowId}
            groupDisplayType={"singleColumn"}
            onFirstDataRendered={onFirstDataRendered}
            ref={gridRef}
            rowData={viewState === undefined ? [] : viewState.rowData}
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
