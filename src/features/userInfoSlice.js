import { createSlice } from "@reduxjs/toolkit";

// sets userInfo state
const initialState = {};
export const userInfoSlice = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    setUserInfo: (state, { payload }) => {
      return payload;
    },
  },
});

export const { setUserInfo } = userInfoSlice.actions;

export default userInfoSlice.reducer;
