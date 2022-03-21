import { createSlice } from "@reduxjs/toolkit";

/* metadata schema
  columns: [
    {
      "field": "Account",
      "label": "Account"
      "type": "string"
    },
    {
      "field": "Type",
      "label": "Account Type"
      "type": "string"
      "values": ["Customer", "Prospect"]
    },
  ]
  };
*/

// sets metadata state
const initialState = [];
export const queryColumnsSlice = createSlice({
  name: "queryColumns",
  initialState,
  reducers: {
    setQueryColumns: (state, { payload }) => {
      // mutate existing state
      // state.queryColumns = payload;
      return payload;
    },
  },
});

// Extract and export each action creator by name
export const { setQueryColumns } = queryColumnsSlice.actions;

// Export the reducer, either as a default or named export
export default queryColumnsSlice.reducer;
