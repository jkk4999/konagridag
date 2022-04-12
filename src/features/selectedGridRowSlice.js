import { createSlice } from "@reduxjs/toolkit";

// sets selected app state
const initialState = "";
export const selectedGridRowSlice = createSlice({
  name: "selectedGridRow",
  initialState,
  reducers: {
    setSelectedGridRow: (state, { payload }) => {
      // replace existing state
      return payload;
    },
  },
});

export const { setSelectedGridRow } = selectedGridRowSlice.actions;

export default selectedGridRowSlice.reducer;
