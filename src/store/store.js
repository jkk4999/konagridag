import { configureStore } from "@reduxjs/toolkit";
import childGridStateReducer from "../features/childGridStateSlice";
import rowReducer from "../features/rowSlice";
import columnReducer from "../features/columnSlice";
import filterSettingsReducer from "../features/filterSettingsSlice";
import gridColumnsReducer from "../features/gridColumnsSlice";
import gridDataReducer from "../features/gridDataSlice";
import groupSettingsReducer from "../features/groupSettingsSlice";
import loadingIndicatorReducer from "../features/loadingIndicatorSlice";
import loginSlice from "../features/loginSlice";
import objectListReducer from "../features/objectListSlice";
import objectOptionsReducer from "../features/objectOptionsSlice";
import objectMetadataReducer from "../features/objectMetadataSlice";
import queryBuilderVisabilityReducer from "../features/queryBuilderVisabilitySlice";
import queryPanelVisabilityReducer from "../features/queryPanelVisabilitySlice";
import queryListReducer from "../features/queryListSlice";
import queryColumnsReducer from "../features/queryColumnsSlice";
import queryOptionsReducer from "../features/queryOptionsSlice";
import queryRuleReducer from "../features/queryRuleSlice";
import queryRuleTextReducer from "../features/queryRuleTextSlice";
import mainGridReducer from "../features/mainGridSlice";
import relatedGridColumnsReducer from "../features/relatedColumnsSlice";
import relatedFilterSettingsReducer from "../features/relatedFilterSettingsSlice";
import relatedGroupSettingsReducer from "../features/relatedGroupSettingsSlice";
import relatedSortSettingsReducer from "../features/relatedSortSettingsSlice";
import relatedObjectReducer from "../features/relatedObjectSlice";
import relatedTemplateFieldsReducer from "../features/relatedTemplateFieldsSlice";
import relatedTemplateListReducer from "../features/relatedTemplateFieldsSlice";
import relationPreferencesReducer from "../features/relationPreferencesSlice";
import selectedAppReducer from "../features/selectedAppSlice";
import selectedAppTitleReducer from "../features/selectedAppTitleSlice";
import selectedGridRowReducer from "../features/selectedGridRowSlice";
import selectedObjectReducer from "../features/selectedObjectSlice";
import selectedQueryReducer from "../features/selectedQuerySlice";
import selectedQueryColumnsReducer from "../features/queryColumnsSlice";
import selectedQueryRulesReducer from "../features/queryRuleSlice";
import selectedRelatedTemplateReducer from "../features/selectedRelatedTemplateSlice";
import selectedTemplateReducer from "../features/selectedTemplateSlice";
import sidebarSizeReducer from "../features/sidebarSizeSlice";
import socketReducer from "../features/socketSlice";
import sortSettingsReducer from "../features/sortSettingsSlice";
import templateListReducer from "../features/templateListSlice";
import templateFieldsReducer from "../features/templateFieldsSlice";
import templateOptionsReducer from "../features/templateOptionsSlice";
import userInfoReducer from "../features/userInfoSlice";

export default configureStore({
  reducer: {
    rows: rowReducer,
    columns: columnReducer,
    childGridState: childGridStateReducer,
    gridColumns: gridColumnsReducer,
    filterSettings: filterSettingsReducer,
    gridData: gridDataReducer,
    groupSettings: groupSettingsReducer,
    isLoggedIn: loginSlice,
    loadingIndicator: loadingIndicatorReducer,
    mainGrid: mainGridReducer,
    objectList: objectListReducer,
    objectOptions: objectOptionsReducer,
    objectMetadata: objectMetadataReducer,
    query: selectedQueryReducer,
    queryBuilderVisible: queryBuilderVisabilityReducer,
    queryPanelVisible: queryPanelVisabilityReducer,
    queryColumns: queryColumnsReducer,
    queryList: queryListReducer,
    queryOptions: queryOptionsReducer,
    queryRule: queryRuleReducer,
    queryRuleText: queryRuleTextReducer,
    relatedGridColumns: relatedGridColumnsReducer,
    relatedFilterSettings: relatedFilterSettingsReducer,
    relatedGroupSettings: relatedGroupSettingsReducer,
    relatedObject: relatedObjectReducer,
    relatedSortSettings: relatedSortSettingsReducer,
    relatedTemplateFields: relatedTemplateFieldsReducer,
    relatedTemplateList: relatedTemplateListReducer,
    relationPreferences: relationPreferencesReducer,
    selectedApp: selectedAppReducer,
    selectedAppTitle: selectedAppTitleReducer,
    selectedGridRow: selectedGridRowReducer,
    selectedObject: selectedObjectReducer,
    selectedQuery: selectedQueryReducer,
    selectedQueryColumns: selectedQueryColumnsReducer,
    selectedQueryRules: selectedQueryRulesReducer,
    selectedRelatedTemplate: selectedRelatedTemplateReducer,
    selectedTemplate: selectedTemplateReducer,
    sidebarSize: sidebarSizeReducer,
    sortSettings: sortSettingsReducer,
    socket: socketReducer,
    templateList: templateListReducer,
    templateFields: templateFieldsReducer,
    templateOptions: templateOptionsReducer,
    userInfo: userInfoReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
