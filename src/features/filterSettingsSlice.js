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
export const filterSettingsSlice = createSlice({
  name: "filterSettings",
  initialState,
  reducers: {
    setFilterSettings: (state, { payload }) => {
      // Construct a new result array immutably and return it
      return payload;
    },
  },
});

export const { setFilterSettings } = filterSettingsSlice.actions;

export default filterSettingsSlice.reducer;
