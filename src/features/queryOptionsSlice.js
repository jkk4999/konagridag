import { createSlice } from "@reduxjs/toolkit";

// sets query list state
const initialState = [];
export const queryOptionsSlice = createSlice({
  name: "queryOptions",
  initialState,
  reducers: {
    setQueryOptions: (state, { payload }) => {
      // replace existing state
      return payload;
    },
  },
});

export const { setQueryOptions } = queryOptionsSlice.actions;

export default queryOptionsSlice.reducer;
