import { UserProvider } from "./user";
import theme from "./theme";
import { ThemeProvider } from "@mui/material";

const AppProvider = ({ children }) => (
  <ThemeProvider theme={theme}>
    <UserProvider>{children}</UserProvider>
  </ThemeProvider>
);

export default AppProvider;
