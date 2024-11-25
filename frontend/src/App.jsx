import { Route, Switch } from "react-router-dom";
import AppProvider from "./common/contexts";

import Header from "./common/components/header";
import Home from "./use-cases/home";
import NewReservation from "./use-cases/new-event";
import Rules from "./use-cases/rules";
import EditEvent from "./use-cases/edit-event";
import { BrowserRouter } from "react-router-dom/cjs/react-router-dom.min";

const App = () => (
  <AppProvider>
    <BrowserRouter>
      <Header>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/new-event" component={NewReservation} />
          <Route path="/edit-event" component={EditEvent} />
          <Route path="/rules" component={Rules} />
          <Route path="/" component={() => <h1>Page not found</h1>} />
        </Switch>
      </Header>
    </BrowserRouter>
  </AppProvider>
);

export default App;
