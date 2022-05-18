import { createSlice } from "@reduxjs/toolkit";

// sets selected template state
let initialState = null;

export const selectedGridViewSlice = createSlice({
  name: "selectedGridView",
  initialState,
  reducers: {
    setSelectedGridView: (state, { payload }) => {
      return payload;
    },
  },
});

export const { setSelectedGridView } = selectedGridViewSlice.actions;

export default selectedGridViewSlice.reducer;
