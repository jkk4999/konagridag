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

import { setRelationPreferences } from "../../features/relationPreferencesSlice";

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
  // Snackbar
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // redux global state
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const userInfo = useSelector((state) => state.userInfo);
  const relationPreferences = useSelector((state) => state.relationPreferences);

  // local object references
  const relationshipGridRef = useRef(null);

  // local state
  const [colDefs, setColDefs] = useState([]);
  const [gridData, setGridData] = useState([]);
  const selectedObject = useSelector((state) => state.selectedObject);

  const dispatch = useDispatch();

  // display relationships grid
  useEffect(() => {
    if (!selectedObject) {
      return;
    }

    const getRelationships = async () => {
      try {
        // get the child relationships for the selected object
        const url = "/salesforce/childRelationships";

        const payload = {
          sobject: selectedObject.id,
        };

        const response = await fetch(url, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Network error - Error getting grid relationships`);
        }

        const result = await response.json();

        if (result.status !== "ok") {
          throw new Error("Error getting grid relationships");
        }

        const relationships = result.records;

        // create the relationship grid records
        const relArray = [];

        relationships.forEach((r) => {
          const newRel = {
            id: r,
            selected: false,
          };
          relArray.push(newRel);
        });

        // get user relationship preferences
        const preferencesUrl = "/postgres/knexSelect";

        // get all columns
        let columns = null;

        // get the templates from the database
        const values = {
          username: userInfo.userEmail,
        };

        const prefPayload = {
          table: "user_relation_prefs",
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
            `Network error - Error getting user relation preferences`
          );
        }

        const prefResult = await prefResponse.json();

        if (prefResult.status !== "ok") {
          throw new Error("Error getting user relation preferences");
        }

        if (prefResult.records.length === 1) {
          // always returns a single record
          const prefRec = prefResult.records[0];

          const allPrefs = prefRec.preferences; // array of json

          // get the preferences for the selected object
          const objPref = allPrefs.find((f) => f.object === selectedObject.id);

          if (objPref) {
            objPref.relations.forEach((r) => {
              // find the relation in the relation grid
              const rec = relArray.find((f) => f.id === r.obj);
              rec.selected = true;
            });
          }
        }

        // supply data to the grid
        setGridData(relArray);

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
          width: 125,
        };

        gridCols.push(ganttViewCol);

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

    getRelationships();

    // get the relationships
  }, [selectedObject]);

  return (
    <Stack style={{ textAlign: "center", height: "100%" }}>
      <Box
        className='ag-theme-alpine'
        style={{ height: "100%", width: "500px" }}
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
          ref={relationshipGridRef}
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
            const visibleColumns = [];
            const selectedRelations = [];

            let rec = null;

            // get selected relations
            relationshipGridRef.current.api.forEachNode((n) => {
              const rec = { ...n.data };
              if (rec.selected === true) {
                selectedRelations.push(rec);

                // get metadata if needed
                gf.getObjectMetadata(rec, userInfo, objectMetadata)
                  .then((res) => {
                    if (res.status === "error") {
                      throw new Error(
                        "Error retrieving metadata for grid relationships"
                      );
                    }

                    const objMetadata = res.records;

                    const hasMetadata = objectMetadata.find(
                      (f) => f.objName === rec.id
                    );

                    // add metadata
                    if (hasMetadata === undefined) {
                      const newObjMetadata = {
                        objName: rec.id,
                        metadata: objMetadata,
                      };

                      dispatch(addMetadata(newObjMetadata));
                    }
                  })
                  .catch((error) => {
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
                  });
              }
            });

            const objRelationships = [];
            selectedRelations.forEach((r) => {
              objRelationships.push({ "obj": r.id });
            });

            let values = null;
            let preferences = null;

            try {
              // get the existing user relation preferences
              const relResult = await gf.getRelationshipPreferences(userInfo);
              if (relResult.status === "error") {
                throw new Error("Error retrieving relationship preferences");
              }

              // no preferences found
              if (relResult.records.length === 0) {
                const objRelations = [];

                preferences = [
                  {
                    object: selectedObject.id,
                    relations: objRelationships,
                  },
                ];
              } else {
                // update existing preferences record
                const prefRecord = relResult.records[0];
                preferences = prefRecord.preferences; // array

                // find the element for the selected object
                const prefIndex = preferences.findIndex(
                  (f) => f.object === selectedObject.id
                );

                if (prefIndex !== -1) {
                  preferences[prefIndex] = {
                    object: selectedObject.id,
                    relations: objRelationships,
                  };
                } else {
                  preferences.push({
                    object: selectedObject.id,
                    relations: objRelationships,
                  });

                  preferences.sort((a, b) => a.object < b.object);
                }
              }

              values = {
                username: userInfo.userEmail,
                preferences: JSON.stringify(preferences),
              };

              // store in database
              const insertUrl = "/postgres/knexInsert";

              const insertPayload = {
                table: "user_relation_prefs",
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
                  "Network error occurred when creating user relation preferences"
                );
              }

              const insertResult = await insertResponse.json();

              if (insertResult.status !== "ok") {
                throw new Error(
                  "Error occurred when creating user relation preferences"
                );
              }

              const userPrefRec = insertResult.records[0];

              dispatch(setRelationPreferences(userPrefRec.preferences));
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
