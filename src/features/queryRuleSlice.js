import { createSlice } from "@reduxjs/toolkit";

// sets selected query state
const initialState = {};
export const queryRuleSlice = createSlice({
  name: "queryRule",
  initialState,
  reducers: {
    // payload is an object
    setQueryRule: (state, { payload }) => {
      // replace existing state
      return payload;
    },
  },
});

export const { setQueryRule } = queryRuleSlice.actions;

export default queryRuleSlice.reducer;
