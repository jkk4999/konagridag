import { createSlice } from "@reduxjs/toolkit";

/* state schema
  [
    {
       childGrid: "Account",
       templateOptions: [
         {
           id: 
           label:
         }
       ],
       selectedTemplate: {},
       colDefs: [],
       rowData: []
    },
    {
    },
  ]

*/

// note: immer allows us to mutate state
const initialState = [];
export const childGridStateSlice = createSlice({
  name: "childGridState",
  initialState,
  reducers: {
    addGridState: (state, { payload }) => {
      // mutating state
      state.push(payload);
    },
    removeGridState: (state, { payload }) => {
      // mutating state
      state.filter((s) => s.childGrid !== payload.childGrid);
    },
    updateGridState: (state, { payload }) => {
      // mutating state
      const gridStateIndex = state.findIndex(
        (s) => s.childGrid === payload.childGrid
      );
      state[gridStateIndex] = payload;
    },
  },
});

// Extract and export each action creator by name
export const { addGridState, removeGridState, updateGridState } =
  childGridStateSlice.actions;

// Export the reducer, either as a default or named export
export default childGridStateSlice.reducer;
