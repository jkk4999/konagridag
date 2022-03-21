import { createSlice } from "@reduxjs/toolkit";

// sets related template state
const initialState = {};
export const selectedRelatedTemplateSlice = createSlice({
  name: "relatedTemplate",
  initialState,
  reducers: {
    setRelatedTemplate: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setRelatedTemplate } = selectedRelatedTemplateSlice.actions;

export default selectedRelatedTemplateSlice.reducer;
