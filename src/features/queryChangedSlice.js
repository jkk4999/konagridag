import { createSlice } from "@reduxjs/toolkit";

let initialState = false;

export const queryChangedSlice = createSlice({
  name: "queryChanged",
  initialState,
  reducers: {
    setQueryChanged: (state, { payload }) => {
      return payload;
    },
  },
});

export const { setQueryChanged } = queryChangedSlice.actions;

export default queryChangedSlice.reducer;
