import { Route, Routes } from "react-router-dom";
import AppProvider from "./common/contexts";

import Header from "./common/components/header";
import Home from "./use-cases/home";
import NewReservation from "./use-cases/new-event";
import Rules from "./use-cases/rules";
import EditEvent from "./use-cases/edit-event";
import { BrowserRouter } from "react-router-dom";

const App = () => (
  <AppProvider>
    <BrowserRouter>
      <Header>
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/new-event" element={<NewReservation />} />
          <Route path="/edit-event" element={<EditEvent />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/" element={<h1>Page not found</h1>} />
        </Routes>
      </Header>
    </BrowserRouter>
  </AppProvider>
);

export default App;
