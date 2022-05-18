// React
import React, {
  useImperativeHandle,
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

import AutoComplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import { Stack } from "@mui/material";
import TextField from "@mui/material/TextField";

import { CircularProgress } from "@mui/material";

const returnVal = null;

const AgGridAutocomplete = React.forwardRef((props, ref) => {
  const relation = props.relation;

  const [options, setOptions] = useState([]);

  // the id value
  const [value, setValue] = useState();

  // the id name displayed in the text field
  const [inputValue, setInputValue] = React.useState("");

  const refInput = useRef(null);

  // Snackbar
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // focus on the input
    refInput.current.focus();
    // setValue(props.value);
  }, []);

  /* Component Editor Lifecycle methods */
  useImperativeHandle(ref, () => {
    return {
      // the final value to send to the grid, on completion of editing
      getValue() {
        return value;
      },

      // Gets called once before editing starts, to give editor a chance to
      // cancel the editing before it even starts.
      isCancelBeforeStart() {
        return false;
      },

      // Gets called once when editing is finished (eg if Enter is pressed).
      // If you return true, then the result of the edit will be ignored.
      isCancelAfterEnd() {
        // our editor will reject any value greater than 1000
        return false;
      },
    };
  });

  const getData = async (value) => {
    // use the changed value to make request and then use the result. Which
    console.log(value);

    if (!value || value.length < 3) {
      return;
    }

    try {
      const url = "/salesforce/lookupSearch";

      let fieldName = null;

      if (relation === "Case") {
        fieldName = "CaseNumber";
      } else if (relation === "Contract") {
        fieldName = "ContractNumber";
      } else {
        fieldName = "Name";
      }

      // WhoId is lookup to either a Lead or Contact
      // WhatId is lookup to any object like Account, Contact, etc
      // OwnerId is lookup to User
      // RecordTypeId is RecordType
      const payload = {
        object: relation,
        fieldName: fieldName,
        searchVal: value,
      };

      const response = await fetch(url, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response) {
        throw new Error(`Network error retreiving search results`);
      }

      const result = await response.json();

      if (result.status !== "ok") {
        throw new Error(`Error retreiving search results`);
      }

      const data = result.records;

      let suggestData = [];
      data.forEach((rec) => {
        const item = {
          id: rec.Id,
          label: rec[fieldName],
        };
        suggestData.push(item);
      });

      setOptions(suggestData);
    } catch (error) {
      // log error and notify user
      console.log(error.message);

      // notify user of error
      const snackOptions = {
        variant: "error",
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
        TransitionComponent: Slide,
      };

      enqueueSnackbar("Error retrieving relation query", snackOptions);
    }
  };

  const onInputChange = (event, value, reason) => {
    if (value) {
      getData(value);
    } else {
      setOptions([]);
    }
  };

  const onChange = (event, value) => {
    setOptions(options);
    setValue(value);
  };

  return (
    <Stack sx={{ width: 300, margin: "auto" }}>
      <AutoComplete
        sx={{ width: 300 }}
        autoComplete
        // inputValue={inputValue}
        onChange={onChange}
        onInputChange={onInputChange}
        getOptionLabel={(option) => option.label}
        noOptionsText={"No records found"}
        options={options}
        ref={refInput}
        renderOption={(props, searchResults) => (
          <Box component='li' {...props} key={searchResults.id}>
            {searchResults.label}
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label='Combo box'
            variant='standard'
            onChange={(event, newValue) => {
              if (newValue) {
                // setOptions(options);
                setValue(newValue.id);
              }
            }}
          />
        )}
        size='small'
        value={value}
      />
    </Stack>
  );
});

export default AgGridAutocomplete;
