import { createSlice } from "@reduxjs/toolkit";

// sets metadata state
const initialState = [];
export const gridColumnsSlice = createSlice({
  name: "gridColumns",
  initialState,
  reducers: {
    setGridColumns: (state, { payload }) => {
      // Construct a new result array immutably and return it
      return payload;
    },
  },
});

// Extract and export each action creator by name
export const { setGridColumns } = gridColumnsSlice.actions;

// Export the reducer, either as a default or named export
export default gridColumnsSlice.reducer;
