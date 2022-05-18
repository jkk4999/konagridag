import { createSlice } from "@reduxjs/toolkit";

/*
    need to combine the various app states to address setting
    dependent state values in app useEffect hooks

    const toolbarState = {
      gridData: [],
      objectOptions: [],
      objectOptionsFiltered: [],
      objectPreferences: [],
      templateOptions: [],
      queryOptions: [],
      gridViewOptions: [],
      relationPreferences: [],
      selectedObject: {},
      selectedTemplate: {},
      selectedQuery: {},
      selectedView: {},
      queryColumns: [],
      queryRule: null,
      queryRuleText: ''
    }
*/

let initialState = {
  gridData: [],
  objectOptions: [],
  objectOptionsFiltered: [],
  templateOptions: [],
  queryOptions: [],
  gridViewOptions: [],
  objectPreferences: [],
  relationPreferences: [],
  selectedObject: null,
  selectedTemplate: null,
  selectedQuery: null,
  selectedView: null,
  queryColumns: [],
  queryRule: "",
  queryRuleText: "",
};

export const toolbarStateSlice = createSlice({
  name: "toolbarState",
  initialState,
  reducers: {
    setToolbarState: (state, { payload }) => {
      return payload;
    },
  },
});

export const { setToolbarState } = toolbarStateSlice.actions;

export default toolbarStateSlice.reducer;
