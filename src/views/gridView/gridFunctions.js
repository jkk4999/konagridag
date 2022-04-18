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

export async function createDefaultGridColumns(selectedObject, objectMetadata) {
  // create grid columns for all fields found in metadata for the given types

  // get the object fields metadata
  const objMetadata = objectMetadata.find((o) => o.objName === selectedObject);
  const objFields = objMetadata.metadata.fields;

  const cols = [];

  // create a column for all metadata fields
  // used for hide/show column function
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

  // set the first column to use agGroupCellRenderer (to show subview)
  const firstCol = cols[0];
  firstCol.cellRenderer = "agGroupCellRenderer";

  return cols;
}

export async function createGridColumns(
  selectedObject,
  templateFields,
  objectMetadata,
  gridRef
) {
  // create grid columns for all fields found in metadata for the given types
  // then hide the columns not found in the template

  // get the object fields metadata
  const objMetadata = objectMetadata.find((o) => o.objName === selectedObject);
  const objFields = objMetadata.metadata.fields;

  if (templateFields !== null && templateFields.length > 0) {
    const cols = [];

    // sort template fielgs by column order
    templateFields.sort((a, b) => a.column_order - b.column_order);

    // create a column for all metadata fields
    // used for hide/show column function
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
      const templateField = templateFields.find((f) => f.name === c.field);

      if (templateField) {
        c.hide = false;

        // assign the template id (must be a string for column api)
        c.colId = templateField.id.toString();
      } else {
        c.hide = true;
      }
    });

    // order grid columns by template_field order
    const colOrder = [];

    templateFields.forEach((f) => {
      const gridCol = cols.find((c) => c.field === f.name);
      colOrder.push(gridCol);
    });

    // set the first column to use agGroupCellRenderer (to show subview)
    const firstCol = colOrder[0];
    firstCol.cellRenderer = "agGroupCellRenderer";

    // apply sorting, grouping and aggregrations
    // hide group columns
    const columnSort = [];
    colOrder.forEach((c, index) => {
      // get template field definition
      const templateField = templateFields.find((t) => t.name === c.field);

      // apply sort
      if (templateField.sort !== "") {
        c.sort = templateField.sort;
        c.sortIndex = index;
      }

      // apply column groups
      if (templateField.group) {
        c.rowGroup = true;
        c.hide = true;
      } else {
        c.rowGroup = false;
        c.hide = false;
      }

      if (
        templateField.aggregration !== null &&
        templateField.aggregation !== ""
      ) {
        c.aggFunc = templateField.aggregation;
        c.allowedAggFuncs = ["sum", "min", "max", "count", "avg"];
        c.enableValue = true;
      }

      // apply column splits
      if (templateField.split) {
        c.pinned = true;
      } else {
        c.pinned = false;
      }
    });

    // add the rest of the grid columns, order doesn't matter
    cols.forEach((c) => {
      if (colOrder.find((o) => o.field === c.field) === undefined) {
        c.rowGroup = false;

        colOrder.push(c);
      }
    });

    // add the group column aggregations

    // gridRef.current.columnApi.applyColumnState({
    //   state: columnSort,
    //   defaultState: { sort: null },
    // });

    return colOrder;
  }
}

export function createSaveTemplateRecords(
  selectedObject,
  gridColumns,
  objectMetadata,
  selectedTemplate
) {
  // create a grid row (template record) for each grid column

  // get the object fields metadata
  const objMetadata = objectMetadata.find((o) => o.objName === selectedObject);
  const metadataFields = objMetadata.metadata.fields;

  const templateRecs = [];
  gridColumns.forEach((v, index) => {
    // get datatype of field from metadata
    const metadataField = metadataFields.find((f) => f.name === v.colDef.field);
    const fieldDataType = metadataField.dataType;

    const isGroup = v.colDef.rowGroup || v.rowGroupActive;

    const newRec = {
      name: v.colDef.field,
      templateid: selectedTemplate === null ? null : selectedTemplate.id,
      column_order: index,
      datatype: fieldDataType,
      sort: v.sort !== undefined ? v.sort : "",
      filter: "",
      aggregation: v.aggFunc !== undefined ? v.aggFunc : "",
      split: v.pinned ? v.pinned : false,
      formula: "",
      group: isGroup,
      group_field: "",
    };

    templateRecs.push(newRec);
  });

  return templateRecs;
}

export async function createTemplate(
  templateName,
  selectedObject,
  templateVisibility,
  userInfo
) {
  const insertUrl = "/postgres/knexInsert";

  const values = {
    template_name: templateName,
    orgid: userInfo.organizationId,
    owner: userInfo.userEmail,
    is_active: true,
    object: selectedObject,
    is_public: templateVisibility,
    is_related: false,
    default: false,
  };

  const insertPayload = {
    table: "template",
    values: values,
    key: "id",
  };

  const insertResponse = await fetch(insertUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(insertPayload),
  });

  if (!insertResponse.ok) {
    throw new Error("Error creating template");
  }

  const insertResult = await insertResponse.json();

  if (insertResult.status !== "ok") {
    return {
      status: "error",
      errorMessage: insertResult.errorMessage,
      records: [],
    };
  } else {
    return {
      status: "ok",
      errorMessage: null,
      records: insertResult.records,
    };
  }
}

export async function createGridField(metadataField, fieldMetadata) {
  const sfdcDataType = metadataField.dataType;
  const fieldLabel = fieldMetadata.label;

  const fieldName = metadataField.name;

  var numberValueFormatter = function (params) {
    return params.value.toFixed(2);
  };

  const dateValueFormatter = function (params) {
    if (params.value === undefined || params.value === null) {
      return "";
    }
    const dateValue = new Date(params.value);
    return dateValue.toLocaleDateString();
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
    if (params.value === undefined) {
      return;
    }
    var formatted = params.value.toFixed(2).replace(".", ",");
    if (formatted.indexOf("-") === 0) {
      return "-$" + formatted.slice(1);
    }
    return "$" + formatted;
  };

  // define a column type (you can define as many as you like)
  // const columnTypes = {
  //   dateColumn: {
  //     // filter: "agMultiColumnFilter",
  //     filterParams: {
  //       // provide comparator function
  //       comparator: (dateFromFilter, cellValue) => {
  //         // In the example application, dates are stored as dd/mm/yyyy
  //         // We create a Date object for comparison against the filter date
  //         const dateParts = cellValue.split("/");
  //         const day = Number(dateParts[0]);
  //         const month = Number(dateParts[1]) - 1;
  //         const year = Number(dateParts[2]);
  //         const cellDate = new Date(year, month, day);
  //         // Now that both parameters are Date objects, we can compare
  //         if (cellDate < dateFromFilter) {
  //           return -1;
  //         } else if (cellDate > dateFromFilter) {
  //           return 1;
  //         } else {
  //           return 0;
  //         }
  //       },
  //     },
  //   },
  // };

  switch (sfdcDataType) {
    case "boolean": {
      return {
        checkboxSelection: true,
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
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
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        minWidth: 150,
        resizable: true,
      };
    }
    case "currency": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agSetColumnFilter",
        filterParams: saleFilterParams,
        minWidth: 150,
        resizable: true,
        type: "numericColumn",
        valueFormatter: saleValueFormatter,
      };
    }
    case "date": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        minWidth: 150,
        resizable: true,
        type: "dateColumn",
        valueFormatter: dateValueFormatter,
      };
    }
    case "datetime": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        minWidth: 150,
        resizable: true,
        type: "dateColumn",
        valueFormatter: dateValueFormatter,
      };
    }
    case "decimal": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        minWidth: 150,
        resizable: true,
        type: "numericColumn",
        valueFormatter: numberValueFormatter,
      };
    }
    case "double": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        minWidth: 150,
        resizable: true,
        type: "numericColumn",
        valueFormatter: numberValueFormatter,
      };
    }
    case "email": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        minWidth: 150,
        resizable: true,
      };
    }
    case "encryptedstring": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        minWidth: 150,
        resizable: true,
      };
    }
    case "id": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        minWidth: 150,
        resizable: true,
      };
    }
    case "int": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        minWidth: 150,
        resizable: true,
        type: "numericColumn",
      };
    }
    case "long": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        minWidth: 150,
        resizable: true,
        type: "numericColumn",
      };
    }
    case "percent": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agSetColumnFilter",
        filterParams: {
          excelMode: "mac",
        },
        minWidth: 150,
        resizable: true,
        type: "numericColumn",
      };
    }
    case "phone": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        minWidth: 150,
        resizable: true,
      };
    }
    case "picklist": {
      const options = [];
      metadataField.picklistValues.forEach((p) => options.push(p.value));
      return {
        cellEditor: "agRichSelectCellEditor",
        cellEditorPopup: true,
        cellEditorParams: {
          values: options,
          cellHeight: 30,
          searchDebounceDelay: 500,
          formatValue: (value) => value.text,
        },
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agSetColumnFilter",
        filterParams: {
          // can be 'windows' or 'mac'
          excelMode: "mac",
        },
        minWidth: 150,
        resizable: true,
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
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        minWidth: 150,
        resizable: true,
      };
    }
    case "string": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        minWidth: 150,
        resizable: true,
      };
    }
    case "url": {
      return {
        editable: metadataField.calculated ? false : true,
        enableRowGroup: true,
        field: metadataField.name,
        headerName: fieldLabel,
        // filter: "agTextColumnFilter",
        filterParams: {
          buttons: ["reset", "apply"],
        },
        minWidth: 150,
        resizable: true,
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

export async function createQueryBuilderColumns(objMetadata) {
  const objFields = objMetadata.fields;

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

export async function deleteTemplateFields(selectedTemplate) {
  const url = "/postgres/knexDelete";

  const columns = [
    "id",
    "templateid",
    "name",
    "datatype",
    "sort",
    "filter",
    "aggregation",
    "split",
    "formula",
    "group",
    "group_field",
    "column_order",
  ];

  const values = {
    templateid: selectedTemplate.id,
  };

  const payload = {
    table: "template_field",
    columns: columns,
    values: values,
    rowIds: [],
    idField: "",
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
      throw new Error(`deleteTemplateFields() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }

    const deletedRecords = result.records;

    return {
      status: "ok",
      errorMessage: null,
      records: deletedRecords,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
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

/* metadata manager
  returns metadata for selected object from cache
  or retrieves it from sfdc
*/
export async function getObjectMetadata(sobject, userInfo, objectMetadata) {
  let objMetadata = null;

  if (objectMetadata) {
    objMetadata = objectMetadata.find((o) => o.objName === sobject);
  }

  if (!objectMetadata || !objMetadata) {
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

export async function getRelationshipPreferences(userInfo) {
  try {
    const preferencesUrl = "/postgres/knexSelect";

    // get all columns
    let columns = null;

    // get the templates from the database
    const values = {
      username: userInfo.userEmail,
    };

    const prefPayload = {
      table: "user_relation_prefs",
      columns: columns,
      values: values,
      rowIds: [],
      idField: null,
    };

    const prefResponse = await fetch(preferencesUrl, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prefPayload),
    });

    if (!prefResponse.ok) {
      throw new Error(
        `Network error - Error getting user relation preferences`
      );
    }

    const prefResult = await prefResponse.json();

    if (prefResult.status !== "ok") {
      throw new Error("Error getting user relation preferences");
    }

    let relationPrefs = [];

    if (prefResult.records.length === 0) {
      relationPrefs = [];
    } else {
      relationPrefs = prefResult.records; // array
    }

    return {
      status: "ok",
      errorMessage: null,
      records: relationPrefs,
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

export async function getTemplate(templateId, userInfo) {
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the PUBLIC queries from the database
  let values = {
    id: templateId,
    orgid: userInfo.organizationId,
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
      throw new Error(`getTemplate() - ${response.message}`);
    }

    let result = await response.json();

    if (result.status === "error") {
      throw new Error(result.errorMessage);
    }

    let templates = result.records;

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

// get template fields
export async function getTemplateFields(selectedTemplate) {
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the template fields from the database
  let values = {
    templateid: selectedTemplate.id,
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

    if (templateFields.length === 0) {
      throw new Error(`getTemplateFields() - No fields found for template`);
    }

    // sort by column_order
    templateFields.sort((a, b) => a.column_order - b.column_order);

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

// load template selector options
export async function getTemplateRecords(selectedObject, userInfo) {
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

    // convert strings to dates

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

export async function getRelatedRecords(selectedObject, selectedRowId) {}

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
