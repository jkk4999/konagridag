// get org objects after user login
// useEffect(() => {
//   const loadInitialData = async () => {
//     // wait until user has logged in
//     if (Object.keys(userInfo).length === 0) {
//       return;
//     }

//     if (_.isEqual(objectOptions, prevObjectOptions.current)) {
//       return;
//     }

//     console.log(`Running gridHeader get org objects useEffect`);

//     dispatch(setLoadingIndicator(true));

//     // get all org objects users have permissions for
//     const result = await ghf.getObjectOptions(userInfo);

//     if (result.status === "error") {
//       // log error and notify user
//       console.log(`gridView-userEffect() - ${result.errorMessage}`);

//       // notify user of error
//       toast.error("Error retrieving org objects", { autoClose: 5000 });

//       return "error";
//     }

//     if (result.records.length === 0) {
//       throw new Error("No org objects found");
//     }

//     // create object list based on preferences
//     // get user object preferences
//     const preferencesUrl = "/postgres/knexSelect";

//     // get all columns
//     let columns = null;

//     // get the object preferences from the database
//     const values = {
//       username: userInfo.userEmail,
//     };

//     const prefPayload = {
//       table: "user_object_prefs",
//       columns: columns,
//       values: values,
//       rowIds: [],
//       idField: null,
//     };

//     const prefResponse = await fetch(preferencesUrl, {
//       method: "post",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(prefPayload),
//     });

//     if (!prefResponse.ok) {
//       throw new Error(
//         `Network error - Error getting user object preferences`
//       );
//     }

//     const prefResult = await prefResponse.json();

//     if (prefResult.status !== "ok") {
//       throw new Error("Error getting user object preferences");
//     }

//     if (prefResult.records.length > 1) {
//       // application error
//       throw new Error("Error retrieving org object preferences");
//     }

//     const filteredObjects = [];
//     if (prefResult.records.length === 1) {
//       // always returns a single record
//       const prefList = prefResult.records[0].preferences;

//       prefList.forEach((p) => {
//         // get id from main obj list
//         const obj = result.records.find((f) => f.id === p.object);
//         if (obj) {
//           filteredObjects.push(obj);
//         }
//       });
//     }

//     // create copy of toolbar state
//     const newToolbarState = { ...toolbarState };

//     newToolbarState.objectOptions = [...result.records];

//     newToolbarState.objectOptionsFiltered = [...filteredObjects];

//     newToolbarState.selectedObject = result.records[0];

//     dispatch(setToolbarState(newToolbarState));

//     prevObjectOptions.current = result.records;

//     dispatch(setLoadingIndicator(false));
//   };

//   loadInitialData();
// }, [toolbarState, objectOptions, dispatch, userInfo]);
