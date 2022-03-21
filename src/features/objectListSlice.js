import { createSlice } from "@reduxjs/toolkit";

// sets object list state
const initialState = [];

export const objectListSlice = createSlice({
  name: "objectList",
  initialState,
  reducers: {
    setObjectList: (state, { payload }) => {
      // Construct a new result array immutably and return it
      return payload;
    },
  },
});

export const { setObjectList } = objectListSlice.actions;

export default objectListSlice.reducer;
