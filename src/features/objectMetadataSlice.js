import { createSlice } from "@reduxjs/toolkit";

/* metadata schema
  metadata: [
    {
      objName: "Account",
      metadata: {}
    },
    {
      objName: "Contact",
      metadata: {}
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
      // mutating state
      state.push(payload);
    },
  },
});

// Extract and export each action creator by name
export const { addMetadata } = objectMetadataSlice.actions;

// Export the reducer, either as a default or named export
export default objectMetadataSlice.reducer;
