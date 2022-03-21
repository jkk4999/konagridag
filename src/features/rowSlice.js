import { createSlice } from "@reduxjs/toolkit";

export const rowSlice = createSlice({
  name: "rows",
  initialState: {
    rowData: [],
    latestId: 0,
  },
  reducers: {
    updateRow: (state, action) => {
      let newRow = action.payload;
      let newRowData = [...state.rowData];
      let index = newRowData.findIndex((element) => element.id === newRow.id);
      newRowData.splice(index, 1, newRow);
      return {
        ...state,
        rowData: newRowData,
      };
    },

    addRows: (state, action) => {
      let newRowData = [...state.rowData];
      newRowData = action.payload.concat(newRowData);
      return {
        ...state,
        rowData: newRowData,
        latestId: action.payload.pop().id,
      };
    },
    removeRows: (state, action) => {
      let newRowData = [...state.rowData];
      newRowData = newRowData.filter((row) => {
        return action.payload.indexOf(row.id) < 0;
      });
      return {
        ...state,
        rowData: newRowData,
      };
    },
  },
});

export const { addRows, removeRows, updateRow } = rowSlice.actions;

export const selectRows = (state) => state.rows.rowData;

export const selectId = (state) => state.rows.latestId;

export default rowSlice.reducer;
