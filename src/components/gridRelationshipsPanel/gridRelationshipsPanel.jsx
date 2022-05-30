// React
import React, { useState, useRef, useEffect } from "react";

// redux
import { addMetadata } from "../../features/objectMetadataSlice";

import { setRelationPreferences } from "../../features/relationPreferencesSlice";

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
import { Stack } from "@mui/material";

export default function GridRelationshipsPanel(props) {
  const selectedObject = props.selectedObject;
  const relationPreferences = props.relationPreferences;

  // used to update toast message
  const toastId = useRef(null);

  // redux global state
  const objectMetadata = useSelector((state) => state.objectMetadata);
  const userInfo = useSelector((state) => state.userInfo);

  // local object references
  const relationshipGridRef = useRef(null);

  // local state
  const [colDefs, setColDefs] = useState([]);
  const [gridData, setGridData] = useState([]);

  const dispatch = useDispatch();

  // create grid cols and data
  useEffect(() => {
    if (!selectedObject) {
      return;
    }

    const getRelationships = async () => {
      try {
        // get the child relationships for the selected object
        // const objMetadata = objectMetadata.find(
        //   (f) => f.objName === selectedObject.id
        // );

        // if (!objMetadata) {
        //   toast.error(
        //     `mainGrid() - Metadata not found for ${selectedObject.id}`
        //   );
        //   return;
        // }

        // const childRelationships = objMetadata.metadata.childRelationships;

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

        const childRelationships = result.records;

        // create a record for each relationship
        const relArray = [];

        childRelationships.forEach((r) => {
          const newRel = {
            id: r,
            selected: false,
            transpositionView: false,
            ganttView: false,
            kanbanView: false,
            scheduleView: false,
          };
          relArray.push(newRel);
        });

        const prefResult = relationPreferences.data;

        const allPrefs = prefResult.preferences; // array of json

        // get the relation preferences for the selected object
        const objPref = allPrefs.find((f) => f.object === selectedObject.id);

        if (objPref) {
          objPref.relations.forEach((r) => {
            // find the relation in the relation grid
            const rec = relArray.find((f) => f.id === r.id);
            if (rec) {
              rec.selected = true;
              rec.transpositionView = r.transpositionView;
              rec.ganttView = r.ganttView;
              rec.kanbanView = r.kanbanView;
              rec.scheduleView = r.scheduleView;
            }
          });
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

    getRelationships();

    // get the relationships
  }, [selectedObject, userInfo]);

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
            const selectedRelations = [];

            // get selected relations
            relationshipGridRef.current.api.forEachNode((n) => {
              // a relationship record
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
                    toast.error(error.message, { autoClose: 5000 });
                  });
              }
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
                preferences = [
                  {
                    object: selectedObject.id,
                    // relations: objRelationships,
                    relations: selectedRelations,
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
                    // relations: objRelationships,
                    relations: selectedRelations,
                  };
                } else {
                  preferences.push({
                    object: selectedObject.id,
                    // relations: objRelationships,
                    relations: selectedRelations,
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
}
