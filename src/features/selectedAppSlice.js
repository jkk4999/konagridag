import { createSlice } from "@reduxjs/toolkit";

// sets selected app state
const initialState = "grid";
export const selectedAppSlice = createSlice({
  name: "selectedApp",
  initialState,
  reducers: {
    setSelectedApp: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setSelectedApp } = selectedAppSlice.actions;

export default selectedAppSlice.reducer;
