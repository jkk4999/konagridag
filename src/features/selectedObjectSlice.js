import { createSlice } from "@reduxjs/toolkit";

// sets selected object state
let initialState = null;

export const selectedObjectSlice = createSlice({
  name: "selectedObject",
  initialState,
  reducers: {
    setSelectedObject: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setSelectedObject } = selectedObjectSlice.actions;

export default selectedObjectSlice.reducer;
