import { UserProvider } from "./user";
import theme from "./theme";
import { ThemeProvider } from "@mui/material";
import TranslationsProvider from "./translations";

const AppProvider = ({ children }) => (
  <ThemeProvider theme={theme}>
    <TranslationsProvider>
      <UserProvider>{children}</UserProvider>
    </TranslationsProvider>
  </ThemeProvider>
);

export default AppProvider;
