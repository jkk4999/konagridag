import { createSlice } from "@reduxjs/toolkit";

// sets query list state
const initialState = [];
export const queryListSlice = createSlice({
  name: "queryList",
  initialState,
  reducers: {
    setQueryList: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setQueryList } = queryListSlice.actions;

export default queryListSlice.reducer;
