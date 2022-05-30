// react query
import { useQuery } from "react-query";

const fetchGridPreferences = async (isRelated, userInfo) => {
  // find the existing preference
  // for each object there is only 1 main preference and 1 related preference
  // with an associated templateId and queryId

  const url = "/postgres/knexSelect";

  // return all columns
  const columns = null;

  let values = null;
  values = {
    is_related: isRelated,
    user_email: userInfo.userEmail,
    orgid: userInfo.organizationId,
  };

  const payload = {
    table: "user_preferences2",
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

  return result.records;
};

// custom hook
export default function useGridPreferences(isRelated, userInfo) {
  return useQuery(
    ["gridPreferences", isRelated, userInfo],
    () => fetchGridPreferences(isRelated, userInfo),
    {
      enabled: Object.keys(userInfo).length > 0,
    }
  );
}
