import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

import { useSelector, useDispatch } from "react-redux";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import AgGridCheckbox from "../../components/aggridCheckboxRenderer";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

// grid functions
import * as gf from "../../views/gridView/gridFunctions";

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

function SaveTemplateDialog(props) {
  const {
    saveTemplateFormOpen,
    dialogTitle,
    templateName,
    templateColumns,
    gridData,
    selectedTemplate,
    setSelectedTemplate,
    selectedObject,
    templateOptions,
    setTemplateOptions,
    setColumnDefs,
    gridRef,
  } = props;

  // object references
  const saveTemplateGridRef = useRef(null);
  const templateVisibilityRef = useRef(false);
  const templateNameInput = useRef("");
  const templateVisibility = useRef(false);

  // redux global state
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.userInfo);
  const objectMetadata = useSelector((state) => state.objectMetadata);

  // Snackbar
  const { enqueueSnackbar } = useSnackbar();

  // enable the Public/Private checkbox for admins
  let disableCheckbox = true;
  if (userInfo.profileName === "System Administrator") {
    disableCheckbox = false;
  }

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      enableValue: true, // allow every column to be aggregated
      enableRowGroup: true, // allow every column to be grouped
      enablePivot: true, // allow every column to be pivoted
      filter: "agMultiColumnFilter",
      minWidth: 100,
      resizable: true,
      sortable: true,
    };
  }, []);

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

        enqueueSnackbar("Please enter a template name", snackOptions);
        return;
      }

      // get current template owner
      let templateRec = null;
      if (selectedTemplate) {
        const templateUrl = "/postgres/knexSelect";
        const templateResult = await gf.getTemplate(
          selectedTemplate.id,
          userInfo
        );
        if (templateResult.status !== "ok") {
          throw new Error(
            `onSaveTemplateForm() - ${templateResult.errorMessage}`
          );
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
        !templateRec ||
        selectedTemplate.label !== templateNameInput.current ||
        templateRec.owner !== userInfo.userEmail
      ) {
        // create a new template

        const tmpResult = await gf.createTemplate(
          templateName,
          selectedObject,
          templateVisibility.current,
          userInfo
        );

        if (tmpResult.status === "error") {
          throw new Error("Error creating template");
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
            `onSaveTemplateForm() - error inserting template fields`
          );
        }

        let insertResult = await insertResponse.json();

        if (insertResult.status === "error") {
          throw new Error(
            `onSaveTemplateForm() - error inserting template fields`
          );
        }

        // adds the template to the grid template selector options
        let templateOps = [...templateOptions];
        const newTemplateOption = {
          id: newTemplate.id,
          label: newTemplate.template_name,
        };
        templateOps.push(newTemplateOption);
        setTemplateOptions(templateOps);

        // select the new template option
        setSelectedTemplate(newTemplateOption);
      } else {
        // update existing template

        // delete existing template fields
        const delResult = await gf.deleteTemplateFields(selectedTemplate);

        if (delResult.status !== "ok") {
          throw new Error(
            "onSaveTemplateForm() - error deleting template fields"
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
            `onSaveTemplateForm() - error inserting template fields`
          );
        }

        let insertResult = await insertResponse.json();

        // refresh the template

        // get the template fields for selected template
        const templateFieldResult = await gf.getTemplateFields(
          selectedTemplate
        );

        if (templateFieldResult.status === "error") {
          throw new Error(
            `onSaveTemplateForm() - ${templateFieldResult.errorMessage}`
          );
        }

        const templateFieldData = templateFieldResult.records;

        // create the grid columns
        const gridCols = await gf.createGridColumns(
          selectedObject.id,
          templateFieldData,
          objectMetadata,
          gridRef
        );

        setColumnDefs(gridCols);
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

      enqueueSnackbar("Template Saved", snackOptions);
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

      enqueueSnackbar(error.message, snackOptions);
    }

    props.setSaveTemplateFormOpen(false);
  }

  const onCloseTemplateForm = () => {
    props.setSaveTemplateFormOpen(false);
  };

  return (
    <Dialog open={saveTemplateFormOpen} fullWidth={true} maxWidth='md'>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
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
              defaultValue={templateName}
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
            columnDefs={templateColumns}
            defaultColDef={defaultColDef}
            ref={saveTemplateGridRef}
            rowData={gridData}
          ></AgGridReact>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseTemplateForm}>Cancel</Button>
        <Button onClick={onSaveTemplateForm}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default SaveTemplateDialog;
