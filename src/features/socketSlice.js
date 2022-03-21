import { createSlice } from "@reduxjs/toolkit";

// sets socket state
const initialState = null;
export const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setSocket: (state, { payload }) => {
      // mutate existing state
      state.socketSlice = payload;
    },
  },
});

export const { setSocket } = socketSlice.actions;

export default socketSlice.reducer;
