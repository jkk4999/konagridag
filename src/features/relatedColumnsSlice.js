import { createSlice } from "@reduxjs/toolkit";

// grid columns example
/*
  <ColumnsDirective>
    <ColumnDirective field='OrderID' headerText='Order ID' width='120' textAlign="Right"/>
    <ColumnDirective field='CustomerID' headerText='Customer ID' width='150'/>
    <ColumnDirective field='ShipCity' headerText='Ship City' width='150'/>
    <ColumnDirective field='ShipName' headerText='Ship Name' width='150'/>
  </ColumnsDirective>
*/

// sets main grid columns state
const initialState = [];
export const relatedColumnsSlice = createSlice({
  name: "relatedGridColumns",
  initialState,
  reducers: {
    setRelatedGridColumns: (state, { payload }) => {
      // mutate existing state
      state.relatedGridColumns = payload;
    },
  },
});

export const { setRelatedGridColumns } = relatedColumnsSlice.actions;

export default relatedColumnsSlice.reducer;
