import { createSlice } from "@reduxjs/toolkit";

// sets template list state
const initialState = [];
export const templateFieldsSlice = createSlice({
  name: "templateFields",
  initialState,
  reducers: {
    setTemplateFields: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setTemplateFields } = templateFieldsSlice.actions;

export default templateFieldsSlice.reducer;
