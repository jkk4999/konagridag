import React from "react";

import AdapterDateFns from "@mui/lab/AdapterDateFns";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DesktopDatePicker from "@mui/lab/DesktopDatePicker";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";

function MuiDate() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DesktopDatePicker
        inputFormat='dd-mm-yyyy'
        size='small'
        value={new Date()}
        onChange={console.log}
        renderInput={(props) => (
          <TextField {...props} helperText='valid mask' />
        )}
      />
    </LocalizationProvider>
  );
}

export default MuiDate;
