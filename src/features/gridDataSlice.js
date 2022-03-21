import { createSlice } from "@reduxjs/toolkit";

// sets grid data app state
const initialState = [];
export const gridDataSlice = createSlice({
  name: "gridData",
  initialState,
  reducers: {
    setGridData: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setGridData } = gridDataSlice.actions;

export default gridDataSlice.reducer;
