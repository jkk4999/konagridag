import React, { useState, useEffect, useRef } from "react";

// components
import ChildGridView from "../../components/childGrid/childGridView";

// Lodash
import _ from "lodash";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

const GridChild = (props) => {
  const masterObject = props.masterObject;
  const childObject = props.childObject;
  const masterGridRef = props.masterGridRef;
  const relationPreferences = props.relationPreferences;
  const objTemplates = props.objTemplates;
  const gridPreferences = props.gridPreferences;
  const selectedGridRow = props.selectedGridRow;
  const selectedGridView = props.selectedGridView;
  const selectedObject = props.selectedObject;
  const selectedTemplate = props.selectedTemplate;
  const selectedQuery = props.selectedQuery;
  const templateFields = props.templateFields;

  const renderCount = useRef(0);
  renderCount.current = renderCount.current + 1;
  console.log(`ChildGrid ${childObject} render count = ${renderCount.current}`); // fires only once - on initial render

  return (
    <div>{`ChildGrid ${childObject} render count = ${renderCount.current}`}</div>
  );
};

const GridChildMemo = React.memo(GridChild);

const ChildGridViewMemo = React.memo(ChildGridView);

function DetailCellRenderer2(props) {
  const gridPreferences = props.gridPreferences;
  const masterGridRef = props.masterGridRef;
  const objTemplates = props.objTemplates;
  const relationPreferences = props.relationPreferences;
  const selectedObject = props.selectedObject;
  const selectedGridRow = props.data;
  const selectedGridView = props.selectedGridView;
  const selectedQuery = props.selectedQuery;
  const selectedTemplate = props.selectedTemplate;
  const templateFields = props.templateFields;

  const [tabs, setTabs] = useState([]);
  const prevTabs = useRef(null);
  const [selectedTab, setSelectedTab] = React.useState("");
  const prevRelationPrefs = useRef(null);

  const renderCount = useRef(0);
  renderCount.current = renderCount.current + 1;
  console.log(`SubviewRenderer count = ${renderCount.current}`); // fires only once - on initial render

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // create the tabs when the relationship preferences changes
  useEffect(() => {
    if (_.isEqual(relationPreferences.data, prevRelationPrefs.current)) {
      return;
    }

    if ((_.isEqual(tabs), prevTabs.current)) {
      return;
    }

    if (!relationPreferences || !selectedGridRow) {
      return;
    }
    console.log("Creating the subview tabs");

    prevRelationPrefs.current = { ...relationPreferences };

    const tabArray = [];

    const objectPreferences = relationPreferences.data.preferences.find(
      (p) => p.object === selectedObject.id
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
  }, [relationPreferences, selectedGridRow, selectedObject.id, tabs]);

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
          if (!_.isEqual(tabs, prevTabs.current)) {
            prevTabs.current = tabs;
          }
          return (
            <TabPanel key={tab.value + "-panel"} value={tab.value}>
              <ChildGridViewMemo
                childObject={tab.value}
                gridPreferences={gridPreferences}
                masterGridRef={masterGridRef}
                objTemplates={objTemplates}
                relationPreferences={relationPreferences}
                selectedGridRow={selectedGridRow}
                selectedGridView={selectedGridView}
                selectedObject={selectedObject}
                selectedQuery={selectedQuery}
                selectedTemplate={selectedTemplate}
                templateFields={templateFields}
              />
            </TabPanel>
          );
        })}
      </TabContext>
    </Box>
  );
}

export default DetailCellRenderer2;
