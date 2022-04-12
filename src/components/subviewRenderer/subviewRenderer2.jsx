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

// MUI
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

// Syncfusion
import {
  TabComponent,
  TabItemDirective,
  TabItemsDirective,
} from "@syncfusion/ej2-react-navigations";

import * as gf from "../../views/gridView/gridFunctions";

// components
import ChildGridView from "../../components/childGrid/childGridView";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

const DetailCellRenderer = ({ data }) => {
  // subview will rerender when either the selected object
  // or relation preferences changes
  const relationPreferences = useSelector((state) => state.relationPreferences);
  const selectedObject = useSelector((state) => state.selectedObject);
  const selectedGridRow = useSelector((state) => state.selectedGridRow);

  const [tabs, setTabs] = useState([]);
  const [panels, setPanels] = useState([]);

  const [tabIndex, setTabIndex] = useState(1);

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
      };
      tabArray.push(newTab);
    }

    setTabs([...tabArray]);

    setSelectedTab(tabArray[0].value);
  }, [relationPreferences]);

  // when the parent record changes
  // get the data for each subview grid
  useEffect(() => {
    async function getSubViewData() {
      if (selectedGridRow === "") {
        return;
      }

      const whereClause = `${selectedObject.id}Id = '${selectedGridRow}'`;

      try {
        tabArray.map((t) => {
          const obj = t.value;
          gf.runQuery(obj, whereClause).then((result) => {
            if (result.status === "error") {
              throw new Error(`Error retriving subview records for ${obj}`);
            }
            const data = result.records;
            childData.current.push = { obj, data };
          });
        });
      } catch (error) {
        console.log(error.message);

        // notify user
        const snackOptions = {
          variant: "error",
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
          TransitionComponent: Slide,
        };

        const key = enqueueSnackbar(error.message, snackOptions);
      }
    }

    getSubViewData();
  }, selectedGridRow);

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

  const TabContent = useCallback((childObject) => {
    return (
      <div>
        <ChildGridView childObject={childObject} />
      </div>
    );
  });

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

  return (
    <Box sx={{ width: "100%", typography: "body1", height: 400 }}>
      <TabComponent
        heightAdjustMode='Auto'
        id='tabelement'
        enablePersistence={false}
      >
        <TabItemsDirective>
          {tabs.map((t) => {
            return (
              <TabItemDirective
                header={{ text: t.value }}
                content={tabContent}
              />
            );
          })}
        </TabItemsDirective>
      </TabComponent>
    </Box>
  );
};

export default DetailCellRenderer;
