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
    selectedGridView,
    mainGridRef,
    transpositionGridRef,
    queryBuilderRef,
  } = props;

  const prevGridView = useRef(null);

  // Redux global state
  // const selectedGridView = useSelector(
  //   (state) => state.toolbarState.selectedGridView
  // );

  console.log("GridViewRenderer executing");

  if (!selectedGridView) {
    return;
  }

  if (selectedGridView === prevGridView.current) {
    return;
  }

  prevGridView.current = selectedGridView;

  switch (selectedGridView) {
    case "Grid": {
      return (
        <MainGrid gridRef={mainGridRef} queryBuilderRef={queryBuilderRef} />
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
