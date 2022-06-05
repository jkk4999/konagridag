// React

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useSelector } from "react-redux";

// Lodash
import _ from "lodash";

import MainGrid from "../../components/mainGrid/mainGrid";
import TranspositionGrid from "../../components/tranpositionGrid/transpositionGrid";

function GridViewRenderer(props) {
  // props
  const {
    gridPreferences,
    mainGridRef,
    objectOptions,
    objPreferences,
    objMetadata,
    objQueries,
    objTemplates,
    queryBuilderRef,
    relationPreferences,
    selectedGridView,
    selectedObject,
    selectedQuery,
    selectedTemplate,
    templateFields,
    transpositionGridRef,
    startTime,
    endTime,
    prevSelectedObject,
    prevSelectedTemplate,
    prevSelectedQuery,
  } = props;

  const prevGridView = useRef(null);

  // Redux global state
  // const selectedGridView = useSelector(
  //   (state) => state.toolbarState.selectedGridView
  // );

  if (!selectedObject || !selectedGridView) {
    return;
  }

  // if (selectedGridView === prevGridView.current) {
  //   return;
  // }

  // prevGridView.current = selectedGridView;

  if (
    !objPreferences.isFetched ||
    !gridPreferences.isFetched ||
    !objQueries.isFetched ||
    !objTemplates.isFetched ||
    !relationPreferences.isFetched ||
    !templateFields.isFetched ||
    !selectedObject ||
    !selectedGridView
  ) {
    return;
  }

  // if (!_.isEqual(selectedObject, prevSelectedObject.current)) {
  //   // user has changed the selectedObject
  //   // just return until the other use effects have run
  //   console.log(`Grid view renderer returning`);
  //   return;
  // }

  console.log("GridViewRenderer executing");

  endTime.current = new Date();
  var duration =
    (endTime.current.getTime() - startTime.current.getTime()) / 1000;

  console.log("Pre grid rendering took " + duration + " seconds.");

  startTime.current = new Date();

  switch (selectedGridView) {
    case "Grid": {
      return (
        <MainGrid
          gridPreferences={gridPreferences}
          objectOptions={objectOptions}
          objMetadata={objMetadata}
          objPreferences={objPreferences}
          objTemplates={objTemplates}
          objQueries={objQueries}
          queryBuilderRef={queryBuilderRef}
          ref={mainGridRef}
          relationPreferences={relationPreferences}
          selectedObject={selectedObject}
          selectedTemplate={selectedTemplate}
          selectedQuery={selectedQuery}
          templateFields={templateFields}
          startTime={startTime}
          endTime={endTime}
        />
      );
    }
    case "Transposition": {
      // return (
      //   <TranspositionGrid
      //     mainGridRef={mainGridRef}
      //     gridRef={transpositionGridRef}
      //     objectOptions={objectOptions}
      //   />
      // );
      return <></>;
    }
    case "Gantt": {
      return <></>;
    }
    case "Kanban": {
      return <></>;
    }
    case "Schedule": {
      return <></>;
    }
  }
}

export default React.memo(GridViewRenderer);
