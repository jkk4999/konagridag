import "./App.css";

// React Query
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

// AgGrid styles
import "ag-grid-enterprise/dist/styles/ag-grid.css";
import "ag-grid-enterprise/dist/styles/ag-theme-alpine.css";

// notifications
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { SnackbarProvider } from "notistack";

// components
import MainApp from "../views/mainApp";
import Sidebar from "../components/sidebar";
import AppBar from "../components/appBar";

// Mui
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "styled-components";
import { makeStyles } from "@mui/styles";
import CssBaseline from "@mui/material/CssBaseline";

// routing
import { BrowserRouter } from "react-router-dom";

// css rules in jss
const useStyles = makeStyles({
  appMain: {
    display: "flex",
    width: "100%",
    height: "100%",
    backgroundColor: "white",
    color: "black",
    boxShadow: "none",
  },
});

// example MUI default theme overrides
// https://mui.com/customization/default-theme/
const theme = createTheme({
  palette: {
    primary: {
      main: "#333966",
      light: "#3c44b126",
    },
    secondary: {
      main: "#f83245",
      light: "f8324526",
    },
    background: {
      default: "#f4f5fd",
      paper: "#fff",
    },
  },
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnmount: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: Infinity,
    },
  },
});

function App() {
  const classes = useStyles();
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={true} />
        <BrowserRouter>
          <div>
            <CssBaseline />
            <AppBar />
            <div className={classes.appMain}>
              <ToastContainer />
              <Sidebar />
              <MainApp />
            </div>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
