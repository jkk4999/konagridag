import { createSlice } from "@reduxjs/toolkit";

// sets selected app state
const initialState = true;
export const queryBuilderVisabilitySlice = createSlice({
  name: "queryBuilderVisible",
  initialState,
  reducers: {
    setQueryBuilderVisible: (state, { payload }) => {
      return payload;
    },
  },
});

export const { setQueryBuilderVisible } = queryBuilderVisabilitySlice.actions;

export default queryBuilderVisabilitySlice.reducer;
