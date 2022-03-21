import { createSlice } from "@reduxjs/toolkit";

// sets sidebar state
const initialState = "visible";
export const sidebarSizeSlice = createSlice({
  name: "sidebarSize",
  initialState,
  reducers: {
    setSidebarSize: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setSidebarSize } = sidebarSizeSlice.actions;

export default sidebarSizeSlice.reducer;
