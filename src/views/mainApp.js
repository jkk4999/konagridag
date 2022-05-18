import React from "react";
import { useDispatch } from "react-redux";

// AgGrid
import { LicenseManager } from "ag-grid-enterprise";

// global
import { setUserInfo } from "../features/userInfoSlice";

// React Query
import { useQuery } from "react-query";

// MUI
import Box from "@mui/material/Box";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

import { Routes, Route } from "react-router-dom";

// views
// import GridView from "../views/gridView/gridView";
import GridHeader from "../components/gridHeader/gridHeader";
import TemplateManagerView from "../views/templateManagerView";
import QueryManagerView from "../views/queryManagerView";
import KanbanView from "../views/kanbanView";
import GanttView from "../views/ganttView";
import SchedulerView from "../views/schedulerView";
import AppManagerView from "../views/appManagerView";
import DemoDataView from "../views/demoDataView";

export default function MainApp() {
  // AgGrid license manager
  LicenseManager.setLicenseKey(
    "For_Trialing_ag-Grid_Only-Not_For_Real_Development_Or_Production_Projects-Valid_Until-25_June_2022_[v2]_MTY1NjExMTYwMDAwMA==724bd239840e6ba69c82dd138d123a59"
  );

  const dispatch = useDispatch();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const onClickDismiss = (key) => () => {
    notistackRef.current.closeSnackbar(key);
  };

  const notistackRef = React.createRef();

  const { isLoading, isError, error, data, isFetching } = useQuery(
    "loginData",
    async () => {
      const email = "jeffreykennedy@dts.com";
      const pw = "3944Pine!!KlvlaJ75DPUNrGggtMHOsBvrc";
      const loginUrl = "http://login.salesforce.com";

      const url = "/salesforce/jsforce";

      const payload = {
        userName: email,
        userPassword: pw,
        loginUrl: loginUrl,
      };

      const response = await fetch(url, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Network error occured");
      }

      const result = await response.json();

      if (result.status === "error") {
        throw new Error(`Salesforce login error ${result.errorMessage}`);
      }

      // store user state
      const user = result.data;

      const userData = {
        userId: email,
        userName: user.userName,
        userPassword: pw,
        loginUrl: loginUrl,
        userEmail: user.userEmail,
        organizationId: user.organizationId,
        profileId: user.profileId,
        profileName: user.profileName,
        locale: user.locale,
        sessionId: user.sessionId,
      };

      console.log("Setting userInfo state");
      console.log("Salesforce login successful");

      // ToDo - display success toast message
      dispatch(setUserInfo(userData));

      // display login success toast message
      const snackOptions = {
        variant: "success",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
        TransitionComponent: Slide,
      };

      const key = enqueueSnackbar("Salesforce login successful", snackOptions);
    }
  );

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }

  return (
    <Box p='1%' BoxDir='column' overflow='scroll' w='100%' h='96%'>
      <Routes>
        <Route path='/grid' exact element={<GridHeader />} />
        <Route path='/templates' element={<TemplateManagerView />} />
        <Route path='/queries' element={<QueryManagerView />} />
        <Route path='/kanban' element={<KanbanView />} />
        <Route path='/gantt' element={<GanttView />} />
        <Route path='/scheduler' element={<SchedulerView />} />
        <Route path='/appmgr' element={<AppManagerView />} />
        <Route path='/demodata' element={<DemoDataView />} />
      </Routes>
    </Box>
  );
}
