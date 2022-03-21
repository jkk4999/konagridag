import { createSlice } from "@reduxjs/toolkit";

// sets selected query state
const initialState = false;
export const loginSlice = createSlice({
  name: "isLoggedIn",
  initialState,
  reducers: {
    setIsLoggedIn: (state, { payload }) => {
      // mutate existing state
      return payload;
    },
  },
});

export const { setIsLoggedIn } = loginSlice.actions;

export default loginSlice.reducer;
