import React, { useState, useEffect, useRef } from "react";

import { useSelector, useDispatch } from "react-redux";

import { ToastUtility } from "@syncfusion/ej2-react-notifications";

import { addGridColumns } from "../../features/gridColumnsSlice";

import {
  QueryBuilderComponent,
  ColumnsModel,
  RuleModel,
} from "@syncfusion/ej2-react-querybuilder";

function QueryBuilder() {
  // ToDo: create column model from global state
  // ToDo: retrieve query from database
  // ToDo: create rule model

  let queryObj = QueryBuilderComponent;

  let toastMsg = useRef(null);

  function showToast(title, content, type, timeout, showCloseButton) {
    let cssVal = null;

    switch (type) {
      case "Warning!": {
        cssVal = "e-toast-warning";
        break;
      }
      case "Success!": {
        cssVal = "e-toast-success";
        break;
      }
      case "Error!": {
        cssVal = "e-toast-danger";
        break;
      }
      case "Information!": {
        cssVal = "e-toast-info";
        break;
      }
      default: {
        cssVal = "e-toast-info";
      }
    }

    toastMsg = ToastUtility.show({
      title: title,
      content: content,
      timeOut: timeout,
      cssClass: cssVal,
      showCloseButton: showCloseButton,
      position: { X: "Right", Y: "Top" },
      buttons: [
        {
          model: { content: "Close" },
          click: () => {
            toastClose();
          },
        },
      ],
    });
  }

  function toastClose() {
    toastMsg.hide("All");
  }

  let columnData = [
    { field: "EmployeeID", label: "EmployeeID", type: "number" },
    { field: "FirstName", label: "FirstName", type: "string" },
    {
      field: "TitleOfCourtesy",
      label: "Title Of Courtesy",
      type: "boolean",
      values: ["Mr.", "Mrs."],
    },
    { field: "Title", label: "Title", type: "string" },
    {
      field: "HireDate",
      label: "HireDate",
      type: "date",
      format: "dd/MM/yyyy",
    },
    { field: "Country", label: "Country", type: "string" },
    { field: "City", label: "City", type: "string" },
  ];

  // get metadata
  const objectMetadata = useSelector((state) => state.objectMetadata);

  // get grid columns
  let gridColumns = useSelector((state) => state.gridColumns);

  // get grid data
  let gridData = useSelector((state) => state.gridData);

  // get selected object state
  let selectedObject = useSelector((state) => state.selectedObject);

  // get selected template state
  let selectedTemplate = useSelector((state) => state.selectedTemplate);

  // get selected query state
  let selectedQuery = useSelector((state) => state.selectedQuery);

  // get selected query columns state
  let queryColumns = useSelector((state) => state.queryColumns);

  // get selected query rules state
  let queryRules = useSelector((state) => state.queryRules);

  // get userInfo state
  let userInfo = useSelector((state) => state.userInfo);

  let queryColumnModel = useRef(null);
  let queryRuleModel = useRef(null);

  useEffect(() => {
    if (selectedQuery) {
      // async functions need to be defined inside useEffect
      const getQuery = async (selectedQuery) => {
        const url = "/postgres/knexSelect";

        // get all columns
        let columns = null;

        // get the queries from the database
        let values = {
          orgid: userInfo.organizationId,
          id: selectedQuery,
        };

        let payload = {
          table: "query2",
          columns: columns,
          values: values,
          rowIds: [],
          idField: null,
        };

        const response = await fetch(url, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          return {
            status: "error",
            errorMessage: "queryBuilder() - Error getting query from database",
            records: [],
          };
        }

        const result = await response.json();

        if (result.status === "error") {
          return {
            status: "error",
            errorMessage: `queryBuilder() - ${result.errorMessage}`,
            records: [],
          };
        }

        const query = result.records[0];

        return {
          status: "ok",
          errorMessage: null,
          records: query,
        };
      };

      // get the query
      if (selectedQuery) {
        console.log("Running QueryBuilder useEffect");
        getQuery(selectedQuery)
          .then((result) => {
            if (result.status === "error") {
              showToast(
                `Application error`,
                `queryBuilder() - {${result.errorMessage}`,
                "Error!",
                0,
                true
              );
              return;
            }

            const query = result.records;

            const queryRules = query.query_rules;
            const queryColumns = query.query_columns;
          })
          .catch((err) => {
            showToast(
              `Application error`,
              `queryBuilder() - Error getting query from database`,
              "Error!",
              0,
              true
            );
          });
      }
    }
  }, [selectedQuery, gridColumns]);

  if (
    queryColumns &&
    queryColumns.columns &&
    queryRules &&
    queryRules.rules &&
    gridData
  ) {
    console.log("Rendering QueryBuilder with data");
    console.log("Query Columns");
    console.log(queryColumns.columns);
    console.log("Query Rules");
    console.log(queryRules.rules);
    return (
      <QueryBuilderComponent
        width='100%'
        columns={queryColumns}
        rule={queryRules}
        dataSource={gridData}
        ref={(QueryBuilderComponent) => (queryObj = QueryBuilderComponent)}
      />
    );
  } else {
    console.log("Rendering default QueryBuilder");
    return (
      <QueryBuilderComponent
        width='100%'
        columns={[]}
        rule={[]}
        dataSource={[]}
        ref={(QueryBuilderComponent) => (queryObj = QueryBuilderComponent)}
      />
    );
  }
}

export default QueryBuilder;
