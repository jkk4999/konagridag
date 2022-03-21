import { createSlice } from "@reduxjs/toolkit";

// sets template list state
const initialState = [];
export const relatedTemplateFieldsSlice = createSlice({
  name: "relatedTemplateFields",
  initialState,
  reducers: {
    setRelatedTemplateFields: (state, { payload }) => {
      // mutate existing state
      state.relatedTemplateFields = payload;
    },
  },
});

export const { setRelatedTemplateFields } = relatedTemplateFieldsSlice.actions;

export default relatedTemplateFieldsSlice.reducer;
