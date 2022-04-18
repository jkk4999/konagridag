import { usePromiseTracker } from "react-promise-tracker";
import { ThreeDots } from "react-loader-spinner";

export default function LoadingIndicator(props) {
  const { promiseInProgress } = usePromiseTracker();

  return (
    <div
      style={{
        width: "100%",
        height: "100",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ThreeDots color='#2BAD60' height='100' width='100' />
    </div>
  );
}
