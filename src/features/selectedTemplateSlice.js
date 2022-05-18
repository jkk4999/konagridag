import { createSlice } from "@reduxjs/toolkit";

// sets selected template state
let initialState = null;

export const selectedTemplateSlice = createSlice({
  name: "selectedTemplate",
  initialState,
  reducers: {
    setSelectedTemplate: (state, { payload }) => {
      return payload;
    },
  },
});

export const { setSelectedTemplate } = selectedTemplateSlice.actions;

export default selectedTemplateSlice.reducer;
