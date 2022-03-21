import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// Redux
import { addMetadata } from "../../features/objectMetadataSlice";
import { setTemplateOptions } from "../../features/templateOptionsSlice";
import { setSelectedObject } from "../../features/selectedObjectSlice";
import { setQueryOptions } from "../../features/queryOptionsSlice";
import { setSelectedTemplate } from "../../features/selectedTemplateSlice";
import { setSelectedQuery } from "../../features/querySlice";
import { addQueryColumns } from "../../features/queryColumnsSlice";
import { setGridData } from "../../features/gridDataSlice";

// queryBuilder components (MUI)
import MuiAutoComplete from "../../components/queryBuilder/muiAutoComplete";
import MuiCheckbox from "../../components/queryBuilder/muiCheckBox";
import MuiDate from "../../components/queryBuilder/muiDate";
import MuiText from "../../components/queryBuilder/muiText";

// queryBuilder components (Syncfusion)
import { getComponent, isNullOrUndefined } from "@syncfusion/ej2-base";
import { DropDownList } from "@syncfusion/ej2-react-dropdowns";
import { TextBoxComponent } from "@syncfusion/ej2-react-inputs";
import { CheckBoxComponent } from "@syncfusion/ej2-react-buttons";
import { DatePickerComponent } from "@syncfusion/ej2-react-calendars";
import { NumericTextBoxComponent } from "@syncfusion/ej2-react-inputs";

// AgGrid cell renderers
import TextRenderer from "../../components/aggrid/cellRenderers/selectText";

// Snackbar
import { useSnackbar } from "notistack";
import { Slide } from "@mui/material";

export function compareArrays(array1, array2) {
  return array1.filter((object1) => {
    return !array2.some((object2) => {
      return object1.id === object2.id;
    });
  });
}

export async function createGridColumns(
  selectedObject,
  templateFields,
  objectMetadata
) {
  // create grid columns for all fields found in metadata for the given types
  // then hide the columns not found in the template

  // get the object fields metadata
  const objMetadata = objectMetadata.find((o) => o.objName === selectedObject);
  const objFields = objMetadata.metadata.fields;

  if (templateFields !== null && templateFields.length > 0) {
    const cols = [];

    for (const field of objFields) {
      const columnName = field.name;

      // get the metadata for this field
      const fieldMetadata = objFields.find((f) => f.name === columnName);

      // only create columns for these datatypes
      const types = [
        "boolean",
        "combobox",
        "currency",
        "date",
        "datetime",
        "decimal",
        "double",
        "email",
        "encryptedstring",
        "id",
        "int",
        "long",
        "percent",
        "phone",
        "picklist",
        "reference",
        "string",
        "url",
      ];

      if (!types.includes(field.dataType)) {
        continue;
      }

      // create the column
      const col = await createGridField(field, fieldMetadata);

      if (col.field !== null) {
        cols.push(col);
      }
    }

    // hide columns not in template
    cols.forEach((c) => {
      if (templateFields.find((f) => f.name === c.field)) {
        c.hide = false;
      } else {
        c.hide = true;
      }
    });

    return cols;
  }
}

export async function createGridField(metadataField, fieldMetadata) {
  const sfdcDataType = metadataField.dataType;
  const fieldLabel = fieldMetadata.label;

  const fieldName = metadataField.name;

  var numberValueFormatter = function (params) {
    return params.value.toFixed(2);
  };

  var saleFilterParams = {
    allowedCharPattern: "\\d\\-\\,\\$",
    numberParser: function (text) {
      return text == null
        ? null
        : parseFloat(text.replace(",", ".").replace("$", ""));
    },
  };

  var saleValueFormatter = function (params) {
    var formatted = params.value.toFixed(2).replace(".", ",");
    if (formatted.indexOf("-") === 0) {
      return "-$" + formatted.slice(1);
    }
    return "$" + formatted;
  };

  switch (sfdcDataType) {
    case "boolean": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        resizable: true,
        minWidth: 150,
      };
    }
    case "comboBox": {
      const options = [];
      fieldMetadata.picklistValues.forEach((p) =>
        options.push({ value: p.value, text: p.label })
      );
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        resizable: true,
        minWidth: 150,
      };
    }
    case "currency": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: saleFilterParams,
        valueFormatter: saleValueFormatter,
        resizable: true,
        type: "numericColumn",
        minWidth: 150,
      };
    }
    case "date": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        resizable: true,
        type: ["dateColumn"],
        minWidth: 150,
      };
    }
    case "datetime": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        resizable: true,
        type: ["dateColumn"],
        minWidth: 150,
      };
    }
    case "decimal": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        resizable: true,
        minWidth: 150,
        type: "numericColumn",
        valueFormatter: numberValueFormatter,
      };
    }
    case "double": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        resizable: true,
        minWidth: 150,
        type: "numericColumn",
        valueFormatter: numberValueFormatter,
      };
    }
    case "email": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        resizable: true,
        minWidth: 150,
      };
    }
    case "encryptedstring": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        resizable: true,
        minWidth: 150,
      };
    }
    case "id": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        resizable: true,
        minWidth: 150,
      };
    }
    case "int": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        resizable: true,
        minWidth: 150,
        type: "numericColumn",
      };
    }
    case "long": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        resizable: true,
        minWidth: 150,
        type: "numericColumn",
      };
    }
    case "percent": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        resizable: true,
        minWidth: 150,
        type: "numericColumn",
      };
    }
    case "phone": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        resizable: true,
        minWidth: 150,
      };
    }
    case "picklist": {
      const options = [];
      fieldMetadata.picklistValues.forEach((p) => options.push(p.value));
      return {
        cellEditor: "agRichSelectCellEditor",
        cellEditorPopup: true,
        cellEditorParams: {
          values: options,
          cellHeight: 20,
          // cellRenderer: TextRenderer,
          searchDebounceDelay: 500,
          formatValue: (value) => value.text,
        },
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          // can be 'windows' or 'mac'
          excelMode: "mac",
        },
        resizable: true,
        minWidth: 150,
      };
    }
    case "reference": {
      let relation = null;
      let columnName = metadataField.name;

      // standard object relation
      if (metadataField.name.slice(-2) === "Id") {
        relation = columnName.slice(0, -2);
      }

      // custom object relation
      if (metadataField.name.slice(-3) === "__c") {
        relation = columnName.slice(0, -3);
      }

      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        resizable: true,
        minWidth: 150,
      };
    }
    case "string": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        resizable: true,
        minWidth: 150,
      };
    }
    case "url": {
      return {
        editable: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        resizable: true,
        minWidth: 150,
      };
    }
    default: {
      // only create columns for the types above
      // skip the rest (such as compound fields and blobs)
      return {
        editable: false,
        field: null,
        headerName: null,
        width: null,
        textAlign: null,
      };
    }
  }
}

export async function createQueryBuilderColumns(
  selectedObject,
  objectMetadata
) {
  // get the object fields metadata
  const objMetadata = objectMetadata.find(
    (o) => o.objName === selectedObject.id
  );
  const objFields = objMetadata.metadata.fields;

  const cols = [];

  // need to use for..of so await will work
  for (const field of objFields) {
    // create the column
    const col = await createQueryColumn(field);

    if (col.field !== null) {
      cols.push(col);
    }
  }

  // sort by value
  cols.sort(function (a, b) {
    return a.field - b.field;
  });
  return cols;
}

export async function createQueryColumn(metadataField) {
  // QueryBuilder Column Types:  number || string || date || boolean

  /* example column defs
    { field: 'TitleOfCourtesy', label: 'Title Of Courtesy', type: 'boolean', values: ['Mr.', 'Mrs.'] },
    { field: 'Title', label: 'Title', type: 'string' },
    { field: 'HireDate', label: 'Hire Date', type: 'date', format: 'dd/MM/yyyy' },
  */

  const sfdcDataType = metadataField.dataType;

  const fieldName = metadataField.name;
  const fieldLabel = metadataField.label;

  switch (sfdcDataType) {
    case "boolean": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "boolean",
      };
    }
    case "comboBox": {
      const options = [];
      metadataField.picklistValues.forEach((p) =>
        options.push({ value: p.value, text: p.label })
      );
      return {
        field: fieldName,
        label: fieldLabel,
        type: "string",
      };
    }
    case "currency": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "number",
      };
    }
    case "date": {
      return {
        field: fieldName,
        label: fieldLabel,
        format: "dd/MM/yyyy",
        type: "date",
      };
    }
    case "datetime": {
      return {
        field: fieldName,
        label: fieldLabel,
        format: "dd/MM/yyyy",
        type: "date",
      };
    }
    case "decimal": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "number",
      };
    }
    case "double": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "number",
      };
    }
    case "email": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "string",
      };
    }
    case "encryptedstring": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "string",
      };
    }
    case "id": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "string",
      };
    }
    case "int": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "number",
      };
    }
    case "long": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "number",
      };
    }
    case "percent": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "number",
      };
    }
    case "phone": {
      return {
        field: fieldName,
        label: fieldLabel,
        type: "string",
      };
    }
    case "picklist": {
      const options = [];
      metadataField.picklistValues.forEach((p) => {
        const newOpt = {
          value: p.value,
          text: p.label,
        };
        options.push(newOpt);
      });
      return {
        field: fieldName,
        label: fieldLabel,
        type: "string",
        values: options,
      };
    }
    case "reference": {
      let relation = null;

      // standard object relation
      if (fieldName.slice(-2) === "Id") {
        relation = fieldName.slice(0, -2);
      }

      // custom object relation
      if (fieldName.slice(-3) === "__c") {
        relation = fieldName.slice(0, -3);
      }

      return {
        field: fieldName,
        label: fieldLabel,
        // template: TextBoxComponent,
        type: "string",
      };
    }
    case "string": {
      return {
        field: fieldName,
        label: fieldLabel,
        // template: TextBoxComponent,
        type: "string",
      };
    }
    case "url": {
      return {
        field: fieldName,
        label: fieldLabel,
        // template: TextBoxComponent,
        type: "string",
      };
    }
    default: {
      // only create columns for the types above
      // skip the rest (such as compound fields and blobs)
      return {
        field: null,
        label: null,
        type: null,
      };
    }
  }
}

export async function getDefaultQueries(
  object,
  orgid,
  is_default,
  is_active,
  is_public,
  owner
) {
  let templates = null;

  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the templates from the database
  const values = {
    object: object,
    orgid: orgid,
    default: is_default,
    is_active: is_active,
  };

  if (owner !== null) {
    values["owner"] = owner;
  }

  if (is_public !== null) {
    values["is_public"] = is_public;
  }

  const payload = {
    table: "query2",
    columns: columns,
    values: values,
    rowIds: [],
    idField: null,
  };

  try {
    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`gridView.getDefaultQueries() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }
    return {
      status: "ok",
      errorMessage: null,
      records: result.records,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

export async function getDefaultTemplates(
  object,
  orgid,
  is_default,
  is_active,
  is_public,
  is_related,
  owner
) {
  let templates = null;

  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the templates from the database
  const values = {
    object: object,
    orgid: orgid,
    default: is_default,
    is_active: is_active,
    is_related: is_related,
  };

  if (owner !== null) {
    values["owner"] = owner;
  }

  if (is_public !== null) {
    values["is_public"] = is_public;
  }

  const payload = {
    table: "template",
    columns: columns,
    values: values,
    rowIds: [],
    idField: null,
  };

  try {
    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`getTemplatesFromDatabase() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }
    return {
      status: "ok",
      errorMessage: null,
      records: result.records,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

export async function getGridPreferences(selectedObject, is_related, userInfo) {
  // find the existing preference
  // for each object there is only 1 main preference and 1 related preference
  // with an associated templateId and queryId

  try {
    const url = "/postgres/knexSelect";

    // return all columns
    const columns = null;

    let values = null;
    values = {
      object: selectedObject,
      is_related: is_related,
      user_email: userInfo.userEmail,
      orgid: userInfo.organizationId,
    };

    const payload = {
      table: "user_preferences2",
      object: selectedObject,
      columns: columns,
      values: values,
      rowIds: [],
      idField: null,
    };

    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`savePreferences() - ${response.message}`);
    }

    const result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }

    return { status: "ok", errorMessage: null, records: result.records };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

// load object options
export async function getObjectOptions(userInfo) {
  try {
    // get the org objects for the user's profile
    const url = "/salesforce/sobjects";

    const payload = {
      userInfo: userInfo,
    };

    const response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`getObjectOptions(userInfo) - ${response.message}`);
    }

    const result = await response.json();

    if (result.status !== "ok") {
      throw new Error("getObjectOptions() - Error retriving org objects");
    }

    if (result.data.length > 0) {
      console.log("Setting object options state");

      // create the org options list
      const orgObjects = [];
      result.data.forEach((d) => {
        const newOpt = {
          id: d.id,
          label: d.value,
        };
        orgObjects.push(newOpt);
      });

      return {
        status: "ok",
        errorMessage: null,
        records: orgObjects,
      };
    } else {
      // no org objects found.  throw an error
      return {
        status: "error",
        errorMessage: "getObjectOptions() - No org objects found",
        records: [],
      };
    }
  } catch (error) {
    return {
      status: "error",
      errorMessage: error,
      records: [],
    };
  }
}

// metadata manager
export async function getObjectMetadata(sobject, userInfo, objectMetadata) {
  // creates object metadata or returns cached result

  const objMetadata = objectMetadata.find((o) => o.objName === sobject);

  if (objMetadata === undefined) {
    const metadataUrl = `/salesforce/sobjectFieldsDescribe`;

    const payload = {
      sobject: sobject,
      profileName: userInfo.profileName,
      profileId: userInfo.profileId,
    };

    let metadataRecords = [];

    try {
      let metadataResponse = await fetch(metadataUrl, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!metadataResponse.ok) {
        throw new Error(metadataResponse.error.message);
      }

      const result = await metadataResponse.json();

      if (result.status !== "ok") {
        throw new Error(metadataResponse.errorMessage);
      }

      const objMetadata = result.records;

      return {
        status: "ok",
        errorMessage: null,
        records: result.records,
      };
    } catch (err) {
      return {
        status: "error",
        errorMessage: err.message,
        records: [],
      };
    }
  } else {
    return {
      status: "ok",
      errorMessage: null,
      records: objMetadata,
    };
  }
}

export async function getQuery(queryId, userInfo) {
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the PUBLIC queries from the database
  let values = {
    id: queryId,
    orgid: userInfo.organizationId,
  };

  let payload = {
    table: "query2",
    columns: columns,
    values: values,
    rowIds: [],
    idField: null,
  };

  try {
    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`getQuery() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }

    let queries = result.records;

    return {
      status: "ok",
      errorMessage: null,
      records: queries,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

// load query selector options
export async function getQueryOptions(selectedObject, userInfo) {
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the PUBLIC queries from the database
  let values = {
    object: selectedObject,
    orgid: userInfo.organizationId,
    is_public: true,
    is_active: true,
  };

  let payload = {
    table: "query2",
    columns: columns,
    values: values,
    rowIds: [],
    idField: null,
  };

  try {
    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`loadQuerySelectorOptions() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }

    let publicQueries = result.records;

    // get the PRIVATE queries from the database
    let privateValues = {
      object: selectedObject,
      orgid: userInfo.organizationId,
      is_public: false,
      is_active: true,
    };

    let privatePayload = {
      table: "query2",
      columns: columns,
      values: privateValues,
      rowIds: [],
      idField: null,
    };

    let privateResponse = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(privatePayload),
    });

    if (!privateResponse.ok) {
      throw new Error(
        `loadQuerySelectorOptions() - ${privateResponse.message}`
      );
    }

    let privateResult = await privateResponse.json();

    if (privateResult.status === "error") {
      throw new Error(result.errorMessage);
    }

    let privateQueries = privateResult.records;

    let queries = [...publicQueries, ...privateQueries];

    return {
      status: "ok",
      errorMessage: null,
      records: queries,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

// load template selector options
export async function getTemplateOptions(selectedObject, userInfo) {
  // returns public & private templates for the selectedObject
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the PUBLIC templates from the database
  let values = {
    object: selectedObject,
    orgid: userInfo.organizationId,
    is_public: true,
    is_active: true,
    is_related: false,
  };

  let payload = {
    table: "template",
    columns: columns,
    values: values,
    rowIds: [],
    idField: null,
  };

  try {
    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`getTemplateOptions() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }

    let publicTemplates = result.records;

    // get the PRIVATE templates from the database
    let privateValues = {
      object: selectedObject,
      orgid: userInfo.organizationId,
      is_public: false,
      is_active: true,
      is_related: false,
    };

    let privatePayload = {
      table: "template",
      columns: columns,
      values: privateValues,
      rowIds: [],
      idField: null,
    };

    let privateResponse = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(privatePayload),
    });

    if (!privateResponse.ok) {
      throw new Error(`getTemplateOptions() - ${privateResponse.message}`);
    }

    let privateResult = await privateResponse.json();

    if (privateResult.status === "error") {
      throw new Error(result.errorMessage);
    }

    let privateTemplates = privateResult.records;

    let templates = [...publicTemplates, ...privateTemplates];

    return {
      status: "ok",
      errorMessage: null,
      records: templates,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

export async function getSelectedQuery(selectedQuery, userInfo) {
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the query from the database
  let values = {
    id: selectedQuery.id,
    orgid: userInfo.organizationId,
  };

  let payload = {
    table: "query2",
    columns: columns,
    values: values,
    rowIds: [],
    idField: null,
  };

  try {
    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`getQuery() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(`getQuery() -result.errorMessage`);
    }

    let query = result.records;

    return {
      status: "ok",
      errorMessage: null,
      records: query,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

// get template fields
export async function getTemplateFields(selectedTemplate) {
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the template fields from the database
  let values = {
    templateid: selectedTemplate,
  };

  let payload = {
    table: "template_field",
    columns: columns,
    values: values,
    rowIds: [],
    idField: null,
  };

  try {
    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`getTemplateFields() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }

    let templateFields = result.records;

    return {
      status: "ok",
      errorMessage: null,
      records: templateFields,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

// execute query
export async function selectedQueryChanged(selectedObject, selectedQuery) {
  const url = "/salesforce/querySearch";

  const payload = {
    objName: selectedObject,
    relatedObjName: null,
    relationName: null,
    parentObjName: null,
    parentRecordId: null,
    lookupField: null,
    searchString: selectedQuery,
    socketId: null,
    gridId: null,
  };

  try {
    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`SelectedQueryChanged() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }

    return {
      status: "ok",
      errorMessage: null,
      records: result.records,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

export async function runQuery(selectedObject, whereClause) {
  const url = "/salesforce/gridQuery";

  const payload = {
    objName: selectedObject,
    whereClause: whereClause,
  };

  try {
    let response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`SelectedQueryChanged() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }

    return {
      status: "ok",
      errorMessage: null,
      records: result.records,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

// configure the grid columns
export async function SelectedTemplateChanged(
  selectedObject,
  selectedTemplate,
  userInfo
) {
  // ToDo = get template fields and store in global state
  // ToDo - run query if selectedQuery !== ''
  console.log("Getting template fields");
  const result = await getTemplateFields(selectedTemplate);

  if (result.status === "error") {
    return {
      status: "error",
      errorMessage: result.errorMessage,
      records: [],
    };
  }

  console.log("Returning template fields");

  return {
    status: "ok",
    errorMessage: null,
    records: result.records,
  };
}
