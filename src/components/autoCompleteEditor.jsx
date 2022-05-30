import React, { useState, forwardRef, useImperativeHandle } from "react";
import TextField from "@mui/material/TextField";
import AutoComplete from "@mui/material/Autocomplete";

// Toast
import { toast } from "react-toastify";

import { Slide } from "@mui/material";
import { Api } from "@mui/icons-material";

export default forwardRef((props, ref) => {
  const [value, setValue] = useState("");
  const [inputValue, setInputValue] = useState("");
  const node = props.node;
  const rec = props.node.data;
  const column = props.colDef.field;

  const relation = props.relation;
  const [options, setOptions] = useState([]);

  function onChangeHandler(e, value) {
    setValue(value);
  }

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
      toast.error(error.message, { autoClose: 5000 });
    }
  };

  function onInputChangeHandler(e, inputValue) {
    setInputValue(inputValue);
    getData(inputValue);
  }

  useImperativeHandle(ref, () => {
    return {
      afterGuiAttached: () => {
        setValue(props.value);
      },

      getValue: () => {
        const opts = options;

        // update the relation property on the record
        rec[relation] = value;

        // update the relation id value on the record
        rec[column] = value.id;

        node.setData(rec);

        return value.id;
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

  return (
    <AutoComplete
      sx={{ width: 300 }}
      autoComplete
      // style={{ padding: "0 10px" }}
      options={options}
      value={value}
      onChange={onChangeHandler}
      inputValue={inputValue}
      onInputChange={onInputChangeHandler}
      disableClearable
      renderInput={(params) => (
        <TextField
          {...params}
          //  style={{ padding: "5px 0" }}
          placeholder={"Select " + props.column.colId}
        />
      )}
    />
  );
});
