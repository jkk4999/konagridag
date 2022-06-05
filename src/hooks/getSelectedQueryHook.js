// react query
import { useQuery } from "react-query";

import * as ghf from "../components/gridHeader/gridHeaderFuncs";

const fetchObjQuery = async (
  selectedObject,
  selectedQuery,
  queryBuilderRef,
  userInfo
) => {
  // need to check if the selected query is for the selected object
  // main grid could render while the previous query for a different object is loaded
  // this happens when we have a asyncronous operation like getting metadata
  // const q = objQueries.find((f) => f.id === selectedQuery.id);
  // if (q.object !== selectedObject.id) {
  //   return;
  // }

  console.log(`Selected queryChanged - query is ${selectedQuery.value}`);

  const queryRule = queryBuilderRef.getRules();

  const objMetadata = null;
  let objMetadataFields = objMetadata.fields;

  // get the query
  const sqlResult = await ghf.getQuerySQL(
    queryRule,
    objMetadataFields,
    selectedObject.id
  );

  const url = "/salesforce/gridQuery";

  const payload = {
    objName: selectedObject,
    whereClause: sqlResult,
  };

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
    throw new Error(`Error executing query ${selectedQuery.value}`);
  }

  return result.records;
};

// custom hook

export default function useObjQuery(
  selectedObject,
  selectedQuery,
  queryBuilderRef,
  userInfo
) {
  return useQuery(
    ["objQuery", selectedObject, selectedQuery, queryBuilderRef, userInfo],
    () =>
      fetchObjQuery(selectedObject, selectedQuery, queryBuilderRef, userInfo),
    {
      enabled:
        Object.keys(userInfo).length > 0 &&
        selectedObject !== null &&
        selectedQuery !== null &&
        queryBuilderRef.current !== null,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}
