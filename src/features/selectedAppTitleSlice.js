import { createSlice } from "@reduxjs/toolkit";

// sets selected app title state
const initialState = "KonaGrid";
export const selectedAppTitleSlice = createSlice({
  name: "selectedAppTitle",
  initialState,
  reducers: {
    setSelectedAppTitle: (state, { payload }) => {
      // mutate existing state
      state.selectedAppTitle = payload;
    },
  },
});

export const { setSelectedAppTitle } = selectedAppTitleSlice.actions;

export default selectedAppTitleSlice.reducer;
