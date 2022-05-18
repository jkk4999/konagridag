import * as tgf from "./transpositionGridFunctions";
import * as gf from "../../views/gridView/gridFunctions";

// Lodash
import _ from "lodash";

// Moment
import moment from "moment";

/*  normalized data example
   rowData = [
         { Date: 1/01/2022, Taxes: 2000.00, Utilities: 3000.00, Name: 'BI-000001'}
         { Date: 2/01/2022, Taxes: 3000.00, Utilities: 4000.00, Name: 'BI-000002'}
         { Date: 3/01/2022, Taxes: 4000.00, Utilities: 5000.00, Name: 'BI-000003'}
         { Date: 4/01/2022, Taxes: 5000.00, Utilities: 6000.00, Name: 'BI-000004'}
   ]

   templateCols = [
         { id: 1, templateid: 300, name: 'Date },
         { id: 2, templateid: 300, name: 'Taxes },
         { id: 3, templateid: 300, name: 'Utilities },
         { id: 4, templateid: 300, name: 'Name },
   ]

   ASSUMPTIONS
      1 - assume the first template column is a date field
      2 - assume that the tranposed grid column headers are mm/yy values ie: Jan-22, Feb=22, etc
      3 = assume that only 1 record exists per month

*/

const dateValueFormatter = function (params) {
  if (params.value === undefined || params.value === null) {
    return "";
  }
  const dateValue = new Date(params.value);
  return dateValue.toLocaleDateString();
};

export async function createTransposedGridColumns(selectedTemplate, gridData) {
  // get the template fields
  // if first field is not a date, throw an error
  // scan the rows and build an array of dates
  // sort array in ascending order
  // build the transposed grid columns

  // returns array of grid columns

  try {
    let gridCols = [];
    let dates = [];
    let newColumnDefs = [];
    let newRowData = [];

    const templateRes = await gf.getTemplateFields(selectedTemplate);

    if (templateRes.status === "error") {
      throw new Error(templateRes.errorMessage);
    }

    const templateFields = templateRes.records;

    const dateFieldName = templateFields[0].name;

    // scan the records and build the date value array
    gridData.forEach((d) => {
      dates.push(d[dateFieldName]);
    });

    // sort the dates in ascending order
    dates.sort((a, b) => a - b);

    // create the grid columns

    // first column is blank
    const blankCol = {
      headerName: "Fields",
      field: "col0",
      minWidth: 200,
      resizable: true,
    };

    newColumnDefs.push(blankCol);

    dates.forEach((r, index) => {
      const d = new Date(r);
      const h = moment(d).format("MMM YY");
      const col = {
        field: `col${index + 1}`,
        headerName: h,
        editable: true,
        minWidth: 150,
        resizable: true,
      };

      newColumnDefs.push(col);
    });

    return {
      status: "ok",
      errorMessage: null,
      records: newColumnDefs,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error.message,
      records: [],
    };
  }
}

export async function createTransposedGridRows(selectedTemplate, mainGridRef) {
  const response = await gf.getTemplateFields(selectedTemplate);
  if (response.status === "error") {
    throw new Error("Network error occurred when fetching template fields");
  }

  const result = await response.json();

  if (result.status === "error") {
    throw new Error(
      `Error occurred when fetching fields for template ${selectedTemplate.id}`
    );
  }

  const templateFields = result.records;
  if (templateFields[0].datatype !== "date") {
    throw new Error(`The first template column must be a date field`);
  }

  // create a row for each template field
  const rows = [];

  const templateFieldName = templateFields[0].name;

  const rowData = [];
  mainGridRef.current.api.forEachNode((n) => {
    rowData.push(n.data);
  });

  // sort the row data by the template date field
  rowData.sort((a, b) => a[templateFieldName] - b[templateFieldName]);

  templateFields.forEach((t) => {
    // get the row values

    const newRow = [];

    rowData.forEach((rec, index) => {
      const field = {
        [t.name]: rec[t.name],
      };
      newRow.push(field);
    });

    rows.push(newRow);
  });
}
