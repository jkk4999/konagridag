import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

import { useSelector, useDispatch } from "react-redux";

// AgGrid
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import AgGridCheckbox from "../../components/aggridCheckboxRenderer";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import * as gf from "../../views/gridView/gridFunctions";

// components
import ChildGridView from "../../components/childGrid/childGridView";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

const DetailCellRenderer = (props) => {
  // subview will rerender when either the selected object
  // or relation preferences changes

  const masterGridRef = props.masterGridRef;
  const masterGridRowId = props.masterGridRowId;
  const masterObject = props.masterObject;
  // const relationPreferences = props.relationPreferences; // array of all relation preferences

  // const objRelationPrefRec = relationPreferences.find(
  //   (p) => p.object === masterObject.id
  // );
  // const childRelations = objRelationPrefRec.relations;

  const relationPreferences = useSelector((state) => state.relationPreferences);
  // const selectedObject = useSelector((state) => state.selectedObject);
  const selectedObject = masterObject;
  const selectedGridRow = props.data;

  // array containing state for each child grid
  const childGridState = useSelector((state) => state.childGridState);

  const [tabs, setTabs] = useState([]);
  const [panels, setPanels] = useState([]);
  const [selectedTab, setSelectedTab] = React.useState("");

  // Snackbar
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const childData = React.useRef([]);

  const containerStyle = useMemo(() => ({ width: "95%", height: "90%" }), []);

  const gridStyle = useMemo(
    () => ({ height: "90%", width: "95%", marginLeft: "10px" }),
    []
  );

  const tabArray = [];
  const panelArray = [];

  // when the relationship preferences changes
  // create the tabs
  useEffect(() => {
    const objPref = relationPreferences.find(
      (s) => s.object === selectedObject.id
    );

    for (let i = 0; i < objPref.relations.length; i++) {
      const name = objPref.relations[i];

      const newTab = {
        value: name.obj,
        label: name.obj,
      };
      tabArray.push(newTab);

      const newPanel = {
        value: name.obj,
        child: () => {
          <div>
            <ChildGridView
              masterGridRef={masterGridRef}
              masterObject={masterObject}
              childObject={name.obj}
              selectedGridRow={selectedGridRow}
            />
          </div>;
        },
      };

      panelArray.push(newPanel);
    }

    setTabs([...tabArray]);
    setPanels([...panelArray]);

    setSelectedTab(tabArray[0].value);
  }, [relationPreferences]);

  const autoGroupColumnDef = useMemo(() => {
    return {
      minWidth: 220,
      cellRendererParams: {
        suppressCount: false,
        checkbox: true,
      },
    };
  }, []);

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      sortable: true,
      resizable: true,
      filter: "agMultiColumnFilter",
      minWidth: 100,
      // filterParams: {
      //   buttons: ["apply", "clear"],
      // },
    };
  }, []);

  // use application id as the grid row id
  const getRowId = useCallback((params) => params.data.id, []);

  const getVisibilityStyle = (hiddenCondition) => {
    if (hiddenCondition) {
      return {
        visibility: "hidden",
        height: 0,
      };
    }
    return {
      visibility: "visible",
      height: "inherit",
    };
  };

  const childGridView = useCallback(
    (masterObject, childObject, masterGridRef, selectedGridRow) => {
      return (
        <div style={getVisibilityStyle(childObject !== selectedTab)}>
          <ChildGridView
            masterObject={masterObject}
            childObject={childObject}
            masterGridRef={masterGridRef}
            selectedGridRow={selectedGridRow}
          />
          ;
        </div>
      );
    }
  );

  return (
    <Box sx={{ width: "100%", typography: "body1", height: 400 }}>
      <TabContext value={selectedTab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          {/* create the tabs */}
          <TabList onChange={handleChange} aria-label='lab API tabs example'>
            {tabs.map((tab) => {
              return (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              );
            })}
          </TabList>
        </Box>

        {/* create the tab panels */}
        {tabs.map((tab) => {
          return (
            <TabPanel value={tab.value}>
              {/* <ChildGridView childObject={tab.value} /> */}
              {childGridView(
                masterObject,
                tab.value,
                masterGridRef,
                selectedGridRow
              )}
            </TabPanel>
          );
        })}
      </TabContext>
    </Box>
  );
};

export default DetailCellRenderer;
