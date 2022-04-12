import { createSlice } from "@reduxjs/toolkit";

// note: immer allows us to mutate state
const initialState = false;
export const loadingIndicatorSlice = createSlice({
  name: "loadingIndicator",
  initialState,
  reducers: {
    setLoadingIndicator: (state, { payload }) => {
      // replace existing state
      return payload;
    },
  },
});

// Extract and export each action creator by name
export const { setLoadingIndicator } = loadingIndicatorSlice.actions;

// Export the reducer, either as a default or named export
export default loadingIndicatorSlice.reducer;
