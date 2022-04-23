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

import { setObjectPreferences } from "../../features/objectPreferencesSlice";

import { useSelector, useDispatch } from "react-redux";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import AgGridCheckbox from "../../components/aggridCheckboxRenderer";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

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
  const orgObjects = props.orgObjects;

  // Snackbar
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // redux global state
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const userInfo = useSelector((state) => state.userInfo);
  const objectPreferences = useSelector((state) => state.objectPreferences);

  // local object references
  const objectPreferencesGridRef = useRef(null);

  // local state
  const [colDefs, setColDefs] = useState([]);
  const [gridData, setGridData] = useState([]);
  const selectedObject = useSelector((state) => state.selectedObject);

  const dispatch = useDispatch();

  // display object preferences grid
  useEffect(() => {
    const getObjectPreferences = async () => {
      try {
        if (!orgObjects || orgObjects.length === 0) {
          return;
        }

        // create a grid record for each org object
        const objArray = [];

        orgObjects.forEach((r) => {
          const newObj = {
            id: r.id,
            selected: false,
            ganttView: false,
            timeSeriesView: false,
          };
          objArray.push(newObj);
        });

        // get user object preferences
        const preferencesUrl = "/postgres/knexSelect";

        // get all columns
        let columns = null;

        // get the object preferences from the database
        const values = {
          username: userInfo.userEmail,
        };

        const prefPayload = {
          table: "user_object_prefs",
          columns: columns,
          values: values,
          rowIds: [],
          idField: null,
        };

        const prefResponse = await fetch(preferencesUrl, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(prefPayload),
        });

        if (!prefResponse.ok) {
          throw new Error(
            `Network error - Error getting user object preferences`
          );
        }

        const prefResult = await prefResponse.json();

        if (prefResult.status !== "ok") {
          throw new Error("Error getting user object preferences");
        }

        if (prefResult.records.length === 0) {
          // no object preferences found
          return;
        }

        if (prefResult.records.length > 1) {
          // application error
          throw new Error("Error retrieving org object preferences");
        }

        // always returns a single record
        const prefRec = prefResult.records[0];

        const allObjectPrefs = prefRec.preferences; // array of json

        allObjectPrefs.forEach((p) => {
          // find the object in the grid
          const rec = objArray.find((f) => f.id === p.object);
          if (rec) {
            rec.selected = true;
            rec.ganttView = p.ganttView;
            rec.timeSeriesView = p.timeSeriesView;
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
          cellRenderer: AgGridCheckbox,
          editable: true,
          field: "selected",
          filter: true,
          headerName: "Selected",
          sortable: true,
          width: 125,
        };

        gridCols.push(selectedCol);

        const ganttViewCol = {
          cellRenderer: AgGridCheckbox,
          editable: true,
          field: "ganttView",
          filter: true,
          headerName: "Gantt",
          sortable: true,
          width: 100,
        };

        gridCols.push(ganttViewCol);

        const timeSeriesViewCol = {
          cellRenderer: AgGridCheckbox,
          editable: true,
          field: "timeSeriesView",
          filter: true,
          headerName: "Time Series",
          sortable: true,
          width: 150,
        };

        gridCols.push(timeSeriesViewCol);

        // supply column definitions to grid
        setColDefs(gridCols);
      } catch (error) {
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

    getObjectPreferences();
  }, [selectedObject]);

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
                  ganttView: rec.ganttView,
                  timeSeriesView: rec.timeSeriesView,
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

              dispatch(setObjectPreferences(userPrefRec.preferences));
            } catch (error) {
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
          }}
          variant='contained'
        >
          Apply
        </Button>
      </Box>
    </Stack>
  );
};
