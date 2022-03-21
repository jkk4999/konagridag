import { createSlice } from "@reduxjs/toolkit";

// example sort setting
/*
  let sortSettings = {
    columns: [{ field: "EmployeeID", direction: "Ascending" }],
  };
*/

// sets related grid sort state
const initialState = {};
export const relatedGridSortSlice = createSlice({
  name: "relatedSortSettings",
  initialState,
  reducers: {
    setRelatedSortSettings: (state, { payload }) => {
      // mutate existing state
      state.relatedSortSettings = payload;
    },
  },
});

export const { setRelatedSortSettings } = relatedGridSortSlice.actions;

export default relatedGridSortSlice.reducer;
