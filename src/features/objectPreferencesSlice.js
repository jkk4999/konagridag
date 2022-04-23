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

const initialState = [];
export const objectPreferencesSlice = createSlice({
  name: "objectPreferences",
  initialState,
  reducers: {
    setObjectPreferences: (state, { payload }) => {
      // Construct a new json immutably and return it
      return payload;
    },
  },
});

export const { setObjectPreferences } = objectPreferencesSlice.actions;

export default objectPreferencesSlice.reducer;
