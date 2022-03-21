import { createSlice } from "@reduxjs/toolkit";

// sets template list state
const initialState = [];
export const templateListSlice = createSlice({
  name: "templateList",
  initialState,
  reducers: {
    setTemplateList: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setTemplateList } = templateListSlice.actions;

export default templateListSlice.reducer;
