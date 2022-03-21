import { createSlice } from "@reduxjs/toolkit";

// sets selected query state
const initialState = null;
export const querySlice = createSlice({
  name: "selectedQuery",
  initialState,
  reducers: {
    setSelectedQuery: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setSelectedQuery } = querySlice.actions;

export default querySlice.reducer;
