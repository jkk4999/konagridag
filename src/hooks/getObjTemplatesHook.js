// react query
import { useQuery } from "react-query";

const fetchObjTemplates = async (userInfo) => {
  // returns public & private templates for the selectedObject
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the PUBLIC templates from the database
  let values = {
    orgid: userInfo.organizationId,
    is_public: true,
    is_active: true,
  };

  let payload = {
    table: "template",
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
    throw new Error(`getTemplateOptions() - ${response.message}`);
  }

  let result = await response.json();

  if (result.status === "error") {
    throw new Error(result.errorMessage);
  }

  let publicTemplates = result.records;

  // get the PRIVATE templates from the database
  let privateValues = {
    orgid: userInfo.organizationId,
    owner: userInfo.userEmail,
    is_public: false,
    is_active: true,
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

  return templates;
};

// custom hook

export default function useObjTemplates(userInfo) {
  return useQuery(
    ["objTemplates", userInfo],
    () => fetchObjTemplates(userInfo),
    {
      enabled: Object.keys(userInfo).length > 0,
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );
}
