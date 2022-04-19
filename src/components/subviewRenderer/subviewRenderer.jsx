import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

// import { useSelector } from "react-redux";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

// components
import ChildGridView from "../../components/childGrid/childGridView";

const DetailCellRenderer = (props) => {
  const masterObject = props.masterObject;
  const masterGridRef = props.masterGridRef;
  // const relationPreferences = props.relationPreferences;
  const selectedGridRow = props.data;

  const [tabs, setTabs] = useState([]);
  const [selectedTab, setSelectedTab] = React.useState("");

  const relationPreferences = useSelector((state) => state.relationPreferences);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // create the tabs when the relationship preferences changes
  useEffect(() => {
    if (!relationPreferences || relationPreferences.length === 0) {
      return;
    }

    console.log("Creating the subview tabs");

    const tabArray = [];

    const objectPreferences = relationPreferences.find(
      (p) => p.object === masterObject.id
    );

    if (!objectPreferences) {
      return;
    }

    for (let i = 0; i < objectPreferences.relations.length; i++) {
      const name = objectPreferences.relations[i];

      const newTab = {
        value: name.obj,
        label: name.obj,
      };
      tabArray.push(newTab);
    }

    setTabs([...tabArray]);

    if (tabArray.length > 0) {
      setSelectedTab(tabArray[0].value);
    }
  }, [relationPreferences]);

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
            <TabPanel value={tab.value}>
              <ChildGridView
                masterObject={masterObject}
                childObject={tab.value}
                masterGridRef={masterGridRef}
                selectedGridRow={selectedGridRow}
              />
              )
            </TabPanel>
          );
        })}
      </TabContext>
    </Box>
  );
};

export default DetailCellRenderer;
