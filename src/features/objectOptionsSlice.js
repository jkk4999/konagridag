import { createSlice } from "@reduxjs/toolkit";

// sets query list state
const initialState = [];
export const objectOptionsSlice = createSlice({
  name: "objectOptions",
  initialState,
  reducers: {
    setObjectOptions: (state, { payload }) => {
      // replace existing state
      return payload;
    },
  },
});

export const { setObjectOptions } = objectOptionsSlice.actions;

export default objectOptionsSlice.reducer;
