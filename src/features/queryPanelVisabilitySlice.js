import { createSlice } from "@reduxjs/toolkit";

// sets selected app state
const initialState = false;
export const queryPanelVisabilitySlice = createSlice({
  name: "queryPanelVisible",
  initialState,
  reducers: {
    setQueryPanelVisible: (state, { payload }) => {
      return payload;
    },
  },
});

export const { setQueryPanelVisible } = queryPanelVisabilitySlice.actions;

export default queryPanelVisabilitySlice.reducer;
