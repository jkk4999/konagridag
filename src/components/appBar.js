import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { makeStyles } from "@mui/styles";
import { useSelector, useDispatch } from "react-redux";
import { setSidebarSize } from "../features/sidebarSizeSlice";

export default function ButtonAppBar() {
  // get size from global this.state
  const sidebarSize = useSelector((state) => state.sidebarSize);

  const dispatch = useDispatch();
  return (
    <AppBar
      elevation={0}
      sx={{
        bgcolor: "#354868",
        position: "sticky",
        color: "white",
      }}
    >
      <Toolbar>
        <IconButton
          size='large'
          edge='start'
          color='inherit'
          aria-label='menu'
          sx={{
            mr: 2,
            ml: -2,
          }}
          onClick={() => {
            if (sidebarSize === "hidden") {
              dispatch(setSidebarSize("visible"));
            } else {
              dispatch(setSidebarSize("hidden"));
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
          KonaGrid
        </Typography>
        <Button color='inherit'>Login</Button>
      </Toolbar>
    </AppBar>
  );
}
