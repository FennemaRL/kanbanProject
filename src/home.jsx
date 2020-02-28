import React from "react";
import Nav from "./navBar";
import BoardTest from "./board";
import Boards from "./boards";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
const Home = () => {
  return (
    <div>
      <Router>
        <Nav />
        <Switch>
          <Route exact path="/board/" component={BoardTest} />
          <Route exact path="/boards/" component={Boards} />
          <Redirect to="/boards/" />
        </Switch>
      </Router>
    </div>
  );
};

export default Home;
