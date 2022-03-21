import { createSlice } from "@reduxjs/toolkit";

export const columnSlice = createSlice({
  name: "columns",
  initialState: {
    columns: [],
  },
  reducers: {
    addColumn: (state, action) => {
      let newCols = [...state.columns];
      newCols = newCols.concat(action.payload);
      return {
        ...state,
        columns: newCols,
      };
    },
    removeColumn: (state, action) => {
      let newCols = [...state.columns];
      newCols = newCols.filter((colDef) => colDef.field !== action.payload);
      return {
        ...state,
        columns: newCols,
      };
    },
    updateColumns: (state, action) => {
      let newCols = [...state.columns];
      newCols = newCols.map((col) => {
        if (col.field === action.payload.field) {
          return action.payload;
        }
        return col;
      });
      return {
        ...state,
        columns: newCols,
      };
    },
  },
});

export const { addColumn, removeColumn, updateColumns } = columnSlice.actions;

export const selectColumns = (state) => state.columns.columns;

export default columnSlice.reducer;
