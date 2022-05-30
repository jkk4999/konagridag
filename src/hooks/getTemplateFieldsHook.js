// react query
import { useQuery } from "react-query";

const fetchTemplateFields = async (userInfo) => {
  // returns all template field records for this org
  const url = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  let values = {
    // orgid: userInfo.organizationId,
  };

  let payload = {
    table: "template_field",
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
    throw new Error(`getTemplateFieldsHook() - ${response.message}`);
  }

  let result = await response.json();

  if (result.status === "error") {
    throw new Error(result.errorMessage);
  }

  return result.records;
};
// custom hook

export default function useTemplateFields(userInfo) {
  return useQuery(
    ["templateFields", userInfo],
    () => fetchTemplateFields(userInfo),
    {
      enabled: Object.keys(userInfo).length > 0,
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );
}
