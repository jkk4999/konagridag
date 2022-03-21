import { createSlice } from "@reduxjs/toolkit";

// group settings example
/*
let groupOptions = {
    columns: ['CustomerID', 'ShipCity']
  };
*/

// sets main grid group state
const initialState = {};
export const relatedGridGroupSlice = createSlice({
  name: "relatedGroupSettings",
  initialState,
  reducers: {
    setRelatedGroupSettings: (state, { payload }) => {
      // mutate existing state
      state.relatedGroupSettings = payload;
    },
  },
});

export const { setRelatedGroupSettings } = relatedGridGroupSlice.actions;

export default relatedGridGroupSlice.reducer;
