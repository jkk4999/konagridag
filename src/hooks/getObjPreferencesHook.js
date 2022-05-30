// react query
import { useQuery } from "react-query";

const fetchObjPreferences = async (userInfo) => {
  // get user object preferences
  const preferencesUrl = "/postgres/knexSelect";

  // get all columns
  let columns = null;

  // get the object preferences from the database
  const values = {
    username: userInfo.userEmail,
  };

  const prefPayload = {
    table: "user_object_prefs",
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
    throw new Error(`Network error occured when retrieving user preferences`);
  }

  const result = await prefResponse.json();

  if (result.status === "error") {
    throw new Error(`Error occured when retreiving user preferences`);
  }

  if (result.records.length > 1) {
    throw new Error(
      `More than 1 object preferences record found for this user`
    );
  }

  return result.records;

  // const filteredObjects = [];

  // if (result.records.length > 1) {
  //   // notify user of error
  //   throw new Error("Found more than 1 user prefs record");
  // }

  // const prefList = result.records[0].preferences;

  // prefList.forEach((p) => {
  //   // get id from main obj list
  //   const obj = objectOptions.current.find((f) => f.id === p.object);
  //   if (obj) {
  //     filteredObjects.push(obj);
  //   }
  // });

  // return filteredObjects;
};

// custom hook used to populate object selector options

export default function useObjPreferences(userInfo, objectOptions) {
  return useQuery(
    ["objPreferences", userInfo, objectOptions],
    () => fetchObjPreferences(userInfo),
    {
      enabled:
        Object.keys(userInfo).length > 0 && objectOptions.current.length > 0,
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );
}
