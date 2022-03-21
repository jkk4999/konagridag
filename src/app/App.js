import "./App.css";

// React Query
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

// AgGrid styles
import "ag-grid-enterprise/dist/styles/ag-grid.css";
import "ag-grid-enterprise/dist/styles/ag-theme-alpine.css";

// notifications
import { SnackbarProvider } from "notistack";

// components
import MainApp from "../views/mainApp";
import Sidebar from "../components/sidebar";
import AppBar from "../components/appBar";

import PropTypes from "prop-types";

// Mui
import { Box } from "@mui/material/Box";
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
        <SnackbarProvider>
          <BrowserRouter>
            <div>
              <CssBaseline />
              <AppBar />
              <div className={classes.appMain}>
                <Sidebar />
                <MainApp />
              </div>
            </div>
          </BrowserRouter>
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
