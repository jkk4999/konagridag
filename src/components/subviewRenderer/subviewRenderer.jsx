import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

// import { useSelector } from "react-redux";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

// components
import ChildGridView from "../../components/childGrid/childGridView";

// Lodash
import _ from "lodash";

function DetailCellRenderer(props) {
  console.log("Detail cell renderer executing");

  const masterObject = props.masterObject;
  const masterGridRef = props.masterGridRef;
  const relationPreferences = props.relationPreferences;
  const gridPreferences = props.gridPreferences;
  const selectedGridRow = props.data;
  const selectedGridView = props.selectedGridView;
  const selectedObject = props.selectedObject;
  const selectedTemplate = props.selectedTemplate;
  const selectedQuery = props.selectedQuery;
  const objTemplates = props.objTemplates;

  const [tabs, setTabs] = useState([]);
  const [selectedTab, setSelectedTab] = React.useState("");

  const prevRelationPrefs = useRef(null);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // create the tabs when the relationship preferences changes
  useEffect(() => {
    if (!relationPreferences) {
      return;
    }

    if (_.isEqual(relationPreferences.data, prevRelationPrefs.current)) {
      return;
    }

    console.log("Creating the subview tabs");

    prevRelationPrefs.current = { ...relationPreferences };

    const tabArray = [];

    const objectPreferences = relationPreferences.data.preferences.find(
      (p) => p.object === masterObject.id
    );

    if (!objectPreferences) {
      return;
    }

    for (let i = 0; i < objectPreferences.relations.length; i++) {
      const name = objectPreferences.relations[i];

      const newTab = {
        value: name.id,
        label: name.id,
      };
      tabArray.push(newTab);
    }

    setTabs([...tabArray]);

    if (tabArray.length > 0) {
      setSelectedTab(tabArray[0].value);
    }
  }, [relationPreferences, masterObject]);

  if (tabs.length > 0) {
    return (
      <Box sx={{ width: "100%", typography: "body1", height: 400 }}>
        <TabContext value={selectedTab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            {/* create the tabs */}
            <TabList onChange={handleChange} aria-label='lab API tabs example'>
              {tabs.map((tab, index) => {
                return (
                  <Tab key={tab.value} label={tab.label} value={tab.value} />
                );
              })}
            </TabList>
          </Box>

          {/* create the tab panels */}
          {tabs.map((tab, index) => {
            return (
              <TabPanel key={tab.value + "-panel"} value={tab.value}>
                <ChildGridView
                  masterObject={masterObject}
                  childObject={tab.value}
                  masterGridRef={masterGridRef}
                  relationPreferences={relationPreferences}
                  gridPreferences={gridPreferences}
                  selectedGridRow={selectedGridRow}
                  selectedGridView={selectedGridView}
                  selectedObject={selectedObject}
                  selectedTemplate={selectedTemplate}
                  selectedQuery={selectedQuery}
                  objTemplates={objTemplates}
                />
                {/* <div>
                  <h1>{tab.value} child grid</h1>
                </div> */}
              </TabPanel>
            );
          })}
        </TabContext>
      </Box>
    );
  } else {
    return <div />;
  }
}

export default React.memo(DetailCellRenderer);
