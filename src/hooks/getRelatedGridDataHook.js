// react query
import { useQuery } from "react-query";

const fetchRelatedGridData = async (
  parentObj,
  selectedGridRow,
  childObj,
  userInfo
) => {
  // get the data
  let whereClause = null;

  const masterObj = parentObj.id;
  if (masterObj.slice(-3) === "__c") {
    whereClause = `${masterObj} = '${selectedGridRow.Id}'`;
  } else {
    whereClause = `${masterObj}Id = '${selectedGridRow.Id}'`;
  }

  const url = "/salesforce/gridQuery";

  const payload = {
    objName: childObj,
    whereClause: whereClause,
  };

  let response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`getRelatedGridData - ${response.message}`);
  }

  let result = await response.json();

  if (result.status === "error") {
    throw new Error(result.errorMessage);
  }

  return result.records;
};

// custom hook
export default function useRelatedGridData(
  parentObj,
  selectedGridRow,
  childObj,
  userInfo
) {
  return useQuery(
    ["relatedGridData", parentObj, selectedGridRow, childObj, userInfo],
    () => fetchRelatedGridData(parentObj, selectedGridRow, childObj, userInfo),
    {
      enabled: Object.keys(userInfo).length > 0,
    }
  );
}
