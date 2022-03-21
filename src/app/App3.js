import { ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import { makeStyles } from "@mui/styles";
import { createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import AppBar from "../components/appBar";
import MainGrid from "../components/mainGrid";
import { ThemeProvider } from "styled-components";

// bi icons
import * as Bi from "react-icons/bi";

// di icons
// import * as Di from "react-icons/di";

// feather icons
import * as Fi from "react-icons/fi";

// IO icons
import { IoMdApps } from "react-icons/io";

// material icons
import * as Mi from "react-icons/md";

// vsc icons
import * as Vsc from "react-icons/vsc";

// css rules in jss
const useStyles = makeStyles({
  appMain: {
    display: "flex",
    width: "100%",
    height: "100%",
    paddingLeft: "80px",
    backgroundColor: "white",
    color: "black",
    boxShadow: "none",
  },
});

// example MUI default theme overrides
// https://mui.com/customization/default-theme/
const theme = createTheme({
  palette: {
    primary: {
      main: "#333966",
      light: "#3c44b126",
    },
    secondary: {
      main: "#f83245",
      light: "f8324526",
    },
    background: {
      default: "#f4f5fd",
      paper: "#fff",
    },
  },
});

function App() {
  const classes = useStyles();
  return (
    <ThemeProvider theme={theme}>
      <div>
        <CssBaseline />
        <AppBar />
        <ProSidebar>
          <Menu iconShape='square'>
            <MenuItem icon={<Mi.MdGridOn />}>Grid</MenuItem>
            <MenuItem icon={<Mi.MdRemoveRedEye />}>Templates</MenuItem>
            <MenuItem icon={<Mi.MdSearch />}>Queries</MenuItem>
            <MenuItem icon={<Bi.BiShapeSquare />}>Gantt</MenuItem>
            <MenuItem icon={<Vsc.VscChecklist />}>Kanban</MenuItem>
            <MenuItem icon={<Mi.MdAccessAlarms />}>Scheduler</MenuItem>
            <MenuItem icon={<Mi.MdApps />}>Apps</MenuItem>
          </Menu>
        </ProSidebar>
        <div className={classes.appMain}>
          <MainGrid />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
