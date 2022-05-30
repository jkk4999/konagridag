// react query
import { useQuery } from "react-query";

const fetchRelationPreferences = async (userInfo) => {
  // get the user relationship preferences

  const preferencesUrl = "/postgres/knexSelect";

  // get all columns
  let columns = null;

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
    throw new Error(`Network error - Error getting user relation preferences`);
  }

  const prefResult = await prefResponse.json();

  if (prefResult.status !== "ok") {
    throw new Error("Error getting user relation preferences");
  }

  let relationPrefs = null;

  if (prefResult.records.length > 0) {
    relationPrefs = prefResult.records[0];
  }

  return relationPrefs;
};

// custom hook

export default function useRelationPreferences(userInfo) {
  return useQuery(
    ["relationPreferences", userInfo],
    () => fetchRelationPreferences(userInfo),
    {
      enabled: Object.keys(userInfo).length > 0,
    }
  );
}
