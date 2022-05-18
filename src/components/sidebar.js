import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { styled, useTheme } from "@mui/material/styles";
import { makeStyles } from "@mui/styles";
import { useNavigate } from "react-router-dom";

import { setSidebarSize } from "../features/sidebarSizeSlice";
import { setSelectedAppTitle } from "../features/selectedAppTitleSlice";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import { Stack } from "@mui/material";
import { Tooltip } from "@mui/material";

// bi icons
import * as Bi from "react-icons/bi";

// di icons
import * as Di from "react-icons/di";

// feather icons
import * as Fi from "react-icons/fi";

// IO icons
import * as Io from "react-icons/io";

// material icons
import * as Mi from "react-icons/md";

// vsc icons
import * as Vsc from "react-icons/vsc";

export default function Sidebar() {
  const dispatch = useDispatch();

  const [selectedApp, setSelectedApp] = useState();

  // get size from global this.state
  const sidebarSize = useSelector((state) => state.sidebarSize);

  // get active view from global state
  // const selectedApp = useSelector((state) => state.selectedApp);

  // get active view title from global state
  const selectedAppTitle = useSelector((state) => state.selectedAppTitle);

  let navigate = useNavigate();

  return (
    <Box
      sx={{
        display: () => {
          if (sidebarSize === "visible") {
            return "flex";
          } else {
            return "none";
          }
        },
        flexDirection: "column",
        borderRadius: 0,
        justifyContent: "flex-start",
      }}
    >
      {/* nav items */}
      <Stack
        sx={{
          spacing: 4,
          alignItems: "center",
          width: 62,
          backgroundColor: "#354868",
          color: "whitesmoke",
          height: "94vh",
        }}
      >
        <Typography
          id='appTitle'
          mt={5}
          fontSize={18}
          alignContent='center'
          justifyContent='center'
        >
          Apps
        </Typography>

        {/* grid */}
        <Tooltip title='Grid' placement='right'>
          <IconButton
            sx={{
              color: () => {
                if (selectedApp === "grid") {
                  return "white";
                } else {
                  return "darkgrey";
                }
              },
              mt: 3,
              "&:hover": {
                color: "whitesmoke",
              },
            }}
            aria-label='Grid'
            size='large'
            onClick={() => {
              setSelectedApp("grid");
              // dispatch(setSelectedApp("grid"));
              navigate(`/grid`);
            }}
          >
            <Mi.MdGridOn />
          </IconButton>
        </Tooltip>

        {/* templates */}
        <Tooltip title='Templates' placement='right'>
          <IconButton
            sx={{
              color: () => {
                if (selectedApp === "templates") {
                  return "white";
                } else {
                  return "darkgrey";
                }
              },
              "&:hover": {
                color: "whitesmoke",
              },
            }}
            aria-label='Templates'
            size='large'
            onClick={() => {
              setSelectedApp("templates");
              // dispatch(setSelectedApp("templates"));
              navigate(`/templates`);
            }}
          >
            <Mi.MdRemoveRedEye />
          </IconButton>
        </Tooltip>

        {/* queries */}
        <Tooltip title='Queries' placement='right'>
          <IconButton
            sx={{
              color: () => {
                if (selectedApp === "queries") {
                  return "white";
                } else {
                  return "darkgrey";
                }
              },
              "&:hover": {
                color: "whitesmoke",
              },
            }}
            aria-label='Queries'
            size='large'
            onClick={() => {
              setSelectedApp("queries");
              // dispatch(setSelectedApp("queries"));
              navigate(`/queries`);
            }}
          >
            <Mi.MdSearch />
          </IconButton>
        </Tooltip>

        {/* gantt */}
        <Tooltip title='Gantt' placement='right'>
          <IconButton
            sx={{
              color: () => {
                if (selectedApp === "gantt") {
                  return "white";
                } else {
                  return "darkgrey";
                }
              },
              "&:hover": {
                color: "whitesmoke",
              },
            }}
            aria-label='Gantt'
            size='large'
            onClick={() => {
              setSelectedApp("gantt");
              // dispatch(setSelectedApp("gantt"));
              navigate(`/gantt`);
            }}
          >
            <Bi.BiShapeSquare />
          </IconButton>
        </Tooltip>

        {/* kanban */}
        <Tooltip title='Kanban' placement='right'>
          <IconButton
            sx={{
              color: () => {
                if (selectedApp === "kanban") {
                  return "white";
                } else {
                  return "darkgrey";
                }
              },
              "&:hover": {
                color: "whitesmoke",
              },
            }}
            aria-label='Kanban'
            size='large'
            onClick={() => {
              setSelectedApp("kanban");
              // dispatch(setSelectedApp("kanban"));
              navigate(`/kanban`);
            }}
          >
            <Vsc.VscChecklist />
          </IconButton>
        </Tooltip>

        {/* scheduler */}
        <Tooltip title='Scheduler' placement='right'>
          <IconButton
            sx={{
              color: () => {
                if (selectedApp === "scheduler") {
                  return "white";
                } else {
                  return "darkgrey";
                }
              },
              "&:hover": {
                color: "whitesmoke",
              },
            }}
            aria-label='Scheduler'
            size='large'
            onClick={() => {
              setSelectedApp("scheduler");
              // dispatch(setSelectedApp("scheduler"));
              navigate(`/scheduler`);
            }}
          >
            <Mi.MdAccessAlarms />
          </IconButton>
        </Tooltip>

        {/* app manager */}
        <Tooltip title='App Manager' placement='right'>
          <IconButton
            sx={{
              color: () => {
                if (selectedApp === "appmgr") {
                  return "white";
                } else {
                  return "darkgrey";
                }
              },
              "&:hover": {
                color: "whitesmoke",
              },
            }}
            aria-label='App Manager'
            size='large'
            onClick={() => {
              setSelectedApp("appmgr");
              // dispatch(setSelectedApp("appmgr"));
              navigate(`/appmgr`);
            }}
          >
            <Mi.MdApps />
          </IconButton>
        </Tooltip>

        {/* demo data */}
        <Tooltip title='Demo Data' placement='right'>
          <IconButton
            sx={{
              color: () => {
                if (selectedApp === "demodata") {
                  return "whitesmoke";
                } else {
                  return "darkgrey";
                }
              },
              "&:hover": {
                color: "whitesmoke",
              },
            }}
            aria-label='Demo Data'
            size='large'
            onClick={() => {
              setSelectedApp("demodata");
              // dispatch(setSelectedApp("demodata"));
              navigate(`/demodata`);
            }}
          >
            <Bi.BiData />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
