import { createSlice } from "@reduxjs/toolkit";

// sets query list state
const initialState = [];
export const templateOptionsSlice = createSlice({
  name: "templateOptions",
  initialState,
  reducers: {
    setTemplateOptions: (state, { payload }) => {
      // replace existing state
      return payload;
    },
  },
});

export const { setTemplateOptions } = templateOptionsSlice.actions;

export default templateOptionsSlice.reducer;
