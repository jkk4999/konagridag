import { createSlice } from "@reduxjs/toolkit";

// sets selected Query state
let initialState = null;

export const selectedQuerySlice = createSlice({
  name: "selectedQuery",
  initialState,
  reducers: {
    setSelectedQuery: (state, { payload }) => {
      // replace existing state
      return payload;
    },
  },
});

export const { setSelectedQuery } = selectedQuerySlice.actions;

export default selectedQuerySlice.reducer;
