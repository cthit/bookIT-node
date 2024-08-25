import { Route, Switch } from "react-router-dom";
import { DigitProviders } from "@cthit/react-digit-components";
import AppProvider from "./common/contexts";

import Header from "./common/components/header";
import Home from "./use-cases/home";
import NewReservation from "./use-cases/new-event";
import Rules from "./use-cases/rules";
import EditEvent from "./use-cases/edit-event";

const App = () => (
  <DigitProviders>
    <AppProvider>
      <Header>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/new-event" component={NewReservation} />
          <Route path="/edit-event" component={EditEvent} />
          <Route path="/rules" component={Rules} />
          <Route path="/" component={() => <h1>Page not found</h1>} />
        </Switch>
      </Header>
    </AppProvider>
  </DigitProviders>
);

export default App;
