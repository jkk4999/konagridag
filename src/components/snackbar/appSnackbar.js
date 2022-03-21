import React from "react";
import Snackbar from "@mui/material/Snackbar";

function AppSnackbar(props) {
  // type = 'success' || 'error' || 'warning' || 'info'
  const { message, duration, type, open } = props;
  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      open={open}
      message={message}
      severity={type}
      autoHideDuration={duration}
    />
  );
}

export default AppSnackbar;
