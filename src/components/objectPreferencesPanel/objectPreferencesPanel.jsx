// React
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

// redux
import { addMetadata } from "../../features/objectMetadataSlice";

import { setToolbarState } from "../../features/toolbarStateSlice";

import { useSelector, useDispatch } from "react-redux";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import CheckboxRenderer from "../aggrid/cellRenderers/checkboxRenderer";

// Toast
import { toast } from "react-toastify";

import * as gf from "../../views/gridView/gridFunctions";

// MUI
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { makeStyles } from "@mui/styles";
import { Stack } from "@mui/material";

const totalStyle = { paddingBottom: "15px" };

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

export default (props) => {
  // used to update toast message
  const toastId = useRef(null);

  // redux global state
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const userInfo = useSelector((state) => state.userInfo);
  const toolbarState = useSelector((state) => state.toolbarState);
  const objPreferences = props.objPreferences;
  const selectedObject = props.selectedObject;
  const objectOptions = props.objectOptions;

  // local object references
  const objectPreferencesGridRef = useRef(null);

  // local state
  const [colDefs, setColDefs] = useState([]);
  const [gridData, setGridData] = useState([]);

  const dispatch = useDispatch();

  // display object preferences grid
  useEffect(() => {
    const getObjectPreferences = async () => {
      try {
        if (!objectOptions || objectOptions.current.length === 0) {
          return;
        }

        if (objPreferences.data.length === 0) {
          return;
        }

        // create a grid record for each org object
        const objArray = [];

        objectOptions.current.forEach((r) => {
          const newObj = {
            id: r.id,
            selected: false,
            transpositionView: false,
            ganttView: false,
            kanbanView: false,
            scheduleView: false,
          };
          objArray.push(newObj);
        });

        // always returns a single record
        const prefRec = objPreferences.data[0];

        const allObjectPrefs = prefRec.preferences; // array of json

        allObjectPrefs.forEach((p) => {
          // find the object in the grid
          const rec = objArray.find((f) => f.id === p.object);
          if (rec) {
            rec.selected = true;
            rec.transpositionView = p.transpositionView;
            rec.ganttView = p.ganttView;
            rec.kanbanView = p.kanbanView;
            rec.scheduleView = p.scheduleView;
          }
        });

        // supply data to the grid
        setGridData(objArray);

        // create the grid columns
        const gridCols = [];

        const nameCol = {
          cellStyle: { textAlign: "left" },
          editable: false,
          field: "id",
          filter: true,
          headerName: "Name",
          sortable: true,
          width: 200,
        };

        gridCols.push(nameCol);

        const selectedCol = {
          cellRenderer: "checkboxRenderer",
          editable: true,
          field: "selected",
          filter: true,
          headerName: "Selected",
          sortable: true,
          width: 125,
        };

        gridCols.push(selectedCol);

        const transpositionViewCol = {
          cellRenderer: "checkboxRenderer",
          editable: true,
          field: "transpositionView",
          filter: true,
          headerName: "Transposition",
          sortable: true,
          width: 150,
        };

        gridCols.push(transpositionViewCol);

        const ganttViewCol = {
          cellRenderer: "checkboxRenderer",
          editable: true,
          field: "ganttView",
          filter: true,
          headerName: "Gantt",
          sortable: true,
          width: 125,
        };

        gridCols.push(ganttViewCol);

        const kanbanViewCol = {
          cellRenderer: "checkboxRenderer",
          editable: true,
          field: "kanbanView",
          filter: true,
          headerName: "Kanban",
          sortable: true,
          width: 125,
        };

        gridCols.push(kanbanViewCol);

        const scheduleViewCol = {
          cellRenderer: "checkboxRenderer",
          editable: true,
          field: "scheduleView",
          filter: true,
          headerName: "Schedule",
          sortable: true,
          width: 125,
        };

        gridCols.push(scheduleViewCol);

        // supply column definitions to grid
        setColDefs(gridCols);
      } catch (error) {
        // log error and notify user
        console.log(error.message);

        // notify user of error
        toast.error(error.message, { autoClose: 5000 });
      }
    };

    getObjectPreferences();
  }, [selectedObject, objectOptions, objPreferences, userInfo]);

  // register AgGrid components
  const components = {
    checkboxRenderer: CheckboxRenderer,
  };

  return (
    <Stack style={{ textAlign: "center", height: "100%" }}>
      <Box
        className='ag-theme-alpine'
        style={{ height: "100%", width: "580px" }}
        sx={{
          ml: 2,
          mr: 5,
          mt: 2,
        }}
      >
        <AgGridReact
          animateRows={true}
          columnDefs={colDefs}
          enableColResize='false'
          components={components}
          ref={objectPreferencesGridRef}
          rowData={gridData}
        ></AgGridReact>
      </Box>
      <Box
        sx={{
          justifyContent: "center",
        }}
      >
        <Button
          sx={{
            ml: 2,
            mt: 2,
            mb: 2,
            width: 150,
          }}
          onClick={async (e) => {
            // store object preferences
            const visibleColumns = [];
            const selectedObjectPrefs = [];

            let rec = null;

            // get selected objects
            objectPreferencesGridRef.current.api.forEachNode((n) => {
              // a object prefs record
              const rec = { ...n.data };

              if (rec.selected === true) {
                const newPref = {
                  object: rec.id,
                  transpositionView: rec.transpositionView,
                  ganttView: rec.ganttView,
                  kanbaniew: rec.kanbanView,
                  scheduleView: rec.scheduleView,
                };
                selectedObjectPrefs.push(newPref);
              }
            });

            try {
              const values = {
                username: userInfo.userEmail,
                preferences: JSON.stringify(selectedObjectPrefs),
                orgid: userInfo.organizationId,
              };

              // store in database
              const insertUrl = "/postgres/knexInsert";

              const insertPayload = {
                table: "user_object_prefs",
                values: values,
                key: "username",
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
                  "Network error occurred when creating user object preferences"
                );
              }

              const insertResult = await insertResponse.json();

              if (insertResult.status !== "ok") {
                throw new Error(
                  "Error occurred when creating user object preferences"
                );
              }

              const userPrefRec = insertResult.records[0];

              // update the object options list
              const filteredObjects = [];
              selectedObjectPrefs.forEach((p) => {
                // get the option
                const opt = objectOptions.find((f) => f.id === p.object);
                if (opt) {
                  filteredObjects.push(opt);
                }
              });

              // create copy of app state
              const newState = { ...toolbarState };
              newState.objectPreferences = userPrefRec.preferences;
              newState.objectOptionsFiltered = [...filteredObjects];

              dispatch(setToolbarState(newState));
            } catch (error) {
              // notify user of error
              toast.error(error.message, { autoClose: 5000 });
            }
          }}
          variant='contained'
        >
          Apply
        </Button>
      </Box>
    </Stack>
  );
};
