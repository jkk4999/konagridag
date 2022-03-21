import { createSlice } from "@reduxjs/toolkit";

// sets selected query state
const initialState = null;
export const queryRuleTextSlice = createSlice({
  name: "queryRuleText",
  initialState,
  reducers: {
    // payload is an object
    setQueryRuleText: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setQueryRuleText } = queryRuleTextSlice.actions;

export default queryRuleTextSlice.reducer;
