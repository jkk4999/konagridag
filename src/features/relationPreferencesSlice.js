import { createSlice } from "@reduxjs/toolkit";

// filter settings example
/*
let filterOptions = {
  columns: [
    {
      field: "ShipCity",
      matchCase: false,
      operator: "startswith",
      predicate: "and",
      value: "reims",
    },
    {
      field: "ShipName",
      matchCase: false,
      operator: "startswith",
      predicate: "and",
      value: "Vins et alcools Chevalier",
    },
  ],
};
*/

// sets main grid filter state
const initialState = [];
export const relationPreferencesSlice = createSlice({
  name: "relationPreferences",
  initialState,
  reducers: {
    setRelationPreferences: (state, { payload }) => {
      // Construct a new json immutably and return it
      return payload;
    },
  },
});

export const { setRelationPreferences } = relationPreferencesSlice.actions;

export default relationPreferencesSlice.reducer;
