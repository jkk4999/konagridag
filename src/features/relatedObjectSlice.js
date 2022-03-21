import { createSlice } from "@reduxjs/toolkit";

// sets related object state
const initialState = null;
export const relatedObjectSlice = createSlice({
  name: "relatedObject",
  initialState,
  reducers: {
    setRelatedObject: (state, { payload }) => {
      // mutate existing state
      state.relatedObject = payload;
    },
  },
});

export const { setRelatedObject } = relatedObjectSlice.actions;

export default relatedObjectSlice.reducer;
