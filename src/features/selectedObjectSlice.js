import { createSlice } from "@reduxjs/toolkit";

// sets selected object state
let initialState = null;

export const selectedObjectSlice = createSlice({
  name: "selectedObject",
  initialState,
  reducers: {
    setSelectedObject: (state, { payload }) => {
      return payload;
    },
  },
});

export const { setSelectedObject } = selectedObjectSlice.actions;

export default selectedObjectSlice.reducer;
