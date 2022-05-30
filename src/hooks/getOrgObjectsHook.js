// react query
import { useQuery } from "react-query";

const fetchOrgObjects = async (userInfo) => {
  // get the org objects for the user's profile
  const url = "/salesforce/sobjects";

  const payload = {
    userInfo: userInfo,
  };

  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Network error occured when retrieving org objects");
  }

  const result = await response.json();

  if (result.status === "error") {
    throw new Error("Error occured when retrieving org objects");
  }

  return result.data;
};

// custom hook
export default function useOrgObjects(userInfo) {
  return useQuery(["orgObjects", userInfo], () => fetchOrgObjects(userInfo), {
    enabled: Object.keys(userInfo).length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
