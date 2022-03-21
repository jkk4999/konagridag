import { createSlice } from "@reduxjs/toolkit";

// sets object list state
const initialState = null;

export const mainGridSlice = createSlice({
  name: "mainGrid",
  initialState,
  reducers: {
    setMainGrid: (state, { payload }) => {
      // Construct a new result array immutably and return it
      return payload;
    },
  },
});

export const { setMainGrid } = mainGridSlice.actions;

export default mainGridSlice.reducer;
