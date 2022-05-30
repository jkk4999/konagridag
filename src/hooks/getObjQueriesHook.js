// react query
import { useQuery } from "react-query";

const fetchObjQueries = async (userInfo) => {
  // load query selector options
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the PUBLIC queries from the database
  let values = {
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
    orgid: userInfo.organizationId,
    owner: userInfo.userEmail,
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
    throw new Error(`loadQuerySelectorOptions() - ${privateResponse.message}`);
  }

  let privateResult = await privateResponse.json();

  if (privateResult.status === "error") {
    throw new Error(result.errorMessage);
  }

  let privateQueries = privateResult.records;

  let queries = [...publicQueries, ...privateQueries];

  return queries;
};

// custom hook

export default function useObjQueries(userInfo) {
  return useQuery(["objQueries", userInfo], () => fetchObjQueries(userInfo), {
    enabled: Object.keys(userInfo).length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
