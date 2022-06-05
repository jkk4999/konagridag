// react query
import { useQuery } from "react-query";

const fetchObjMetadata = async (sobject, userInfo) => {
  // find the existing preference
  // for each object there is only 1 main preference and 1 related preference
  // with an associated templateId and queryId

  const metadataUrl = `/salesforce/sobjectFieldsDescribe`;

  const payload = {
    sobject: sobject,
    profileName: userInfo.profileName,
    profileId: userInfo.profileId,
  };

  let metadataRecords = [];

  let metadataResponse = await fetch(metadataUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!metadataResponse.ok) {
    throw new Error(metadataResponse.error.message);
  }

  const result = await metadataResponse.json();

  if (result.status !== "ok") {
    throw new Error(metadataResponse.errorMessage);
  }

  return result.records;
};

// custom hook
export default function useObjMetadata(sobject, userInfo) {
  return useQuery(
    ["objMetadata", sobject, userInfo],
    () => fetchObjMetadata(sobject, userInfo),
    {
      enabled: Object.keys(userInfo).length > 0 && sobject !== null,
    }
  );
}
