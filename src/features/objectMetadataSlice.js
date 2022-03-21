import { createSlice } from "@reduxjs/toolkit";

/* metadata schema
  metadata: [
    {
    name: "Account",
    data: {}
    },
    {
    name: "Contact",
    data: {}
    },
  ]
  };
*/

// sets metadata state
const initialState = [];
export const objectMetadataSlice = createSlice({
  name: "objectMetadata",
  initialState,
  reducers: {
    addMetadata: (state, { payload }) => {
      /*
        dispatch(addMetata(
          {
            objName:  "someObjectName",
            metadata: {}  // metadata object
          }
        )
      */

      state.push(payload);
    },
    deleteMetadata: (state, { payload }) => {
      /*
        dispatch(deleteMetadata('objectName'))
      */
      return {
        // spreading the existing state
        ...state,
        // returns a new filtered metadata array
        objectMetadata: [
          ...state,
          state.filter((metadata) => metadata.name !== payload),
        ],
      };
    },
    updateMetadata: (state, { payload }) => {
      /*
        dispatch(updateMetata(
          {
            objName:  "someObjectName",
            metadata: {}  // metadata object
          }
        )
      */

      // finding index of the item
      const index = state.findIndex(
        (metadata) => metadata.name !== payload.objName
      );

      // making a new array from existing state
      const newMetadataArray = [...state];

      // update the state for a given object
      newMetadataArray[index] = payload;

      return {
        ...state,
        objectMetadata: newMetadataArray,
      };
    },
  },
});

// Extract and export each action creator by name
export const { addMetadata, updateMetadata, deleteMetadata } =
  objectMetadataSlice.actions;

// Export the reducer, either as a default or named export
export default objectMetadataSlice.reducer;
