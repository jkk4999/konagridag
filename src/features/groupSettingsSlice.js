import { createSlice } from "@reduxjs/toolkit";

// group settings example
/*
let groupOptions = {
    columns: ['CustomerID', 'ShipCity']
  };
*/

// sets main grid group state
export const groupSettingsSlice = createSlice({
  name: "groupSettings",
  initialState: {
    groupSettings: null,
  },
  reducers: {
    setGroupSettings: (state, { payload }) => {
      state.groupSettings = payload;
    },
  },
});

export const { setGroupSettings } = groupSettingsSlice.actions;

export default groupSettingsSlice.reducer;
