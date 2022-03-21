import { createSlice } from "@reduxjs/toolkit";

// example sort setting
/*
  let sortSettings = {
    columns: [{ field: "EmployeeID", direction: "Ascending" }],
  };
*/

// sets main grid sort state
const initialState = {};
export const sortSettingsSlice = createSlice({
  name: "sortSettings",
  initialState,
  reducers: {
    setSortSettings: (state, { payload }) => {
      // mutate existing state
      state.sortSettings = payload;
    },
  },
});

export const { setSortSettings } = sortSettingsSlice.actions;

export default sortSettingsSlice.reducer;
