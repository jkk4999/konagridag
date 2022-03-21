import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

// state hooks

import { setUserInfo } from "../features/userInfoSlice";
import { setSelectedApp } from "../features/selectedAppSlice";
import { setSelectedAppTitle } from "../features/selectedAppTitleSlice";
import { setIsLoggedIn } from "../features/loginSlice";

// React Query
import { useQuery } from "react-query";

// MUI
import { makeStyles } from "@mui/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

import {
  BrowserRouter,
  Link as RouteLink,
  Routes,
  Route,
} from "react-router-dom";

// views
import GridView from "../views/gridView/gridView";
import TemplateManagerView from "../views/templateManagerView";
import QueryManagerView from "../views/queryManagerView";
import KanbanView from "../views/kanbanView";
import GanttView from "../views/ganttView";
import SchedulerView from "../views/schedulerView";
import AppManagerView from "../views/appManagerView";
import DemoDataView from "../views/demoDataView";

// Redux
import { store } from "../store/store";

import { BiCalculator } from "react-icons/bi";

export default function MainApp() {
  const dispatch = useDispatch();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const onClickDismiss = (key) => () => {
    notistackRef.current.closeSnackbar(key);
  };

  const notistackRef = React.createRef();

  // global state
  const sidebarSize = useSelector((state) => state.sidebarSize);
  const selectedAppTitle = useSelector((state) => state.selectedAppTitle);
  const userInfo = useSelector((state) => state.userInfo);
  const isLoggedIn = useSelector((state) => state.isLoggedIn);
  const queryOptions = useSelector((state) => state.queryOptions);

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
        <Route path='/grid' exact element={<GridView />} />
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
