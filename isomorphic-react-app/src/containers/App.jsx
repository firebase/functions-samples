import React from 'react';
import { Switch, Route } from 'react-router';
import { Link } from 'react-router-dom';
import Home from '../components/Home';
import User from '../components/User';
import database from 'firebase-database';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    // check to see if we have existing server-rendered data
    // sets the state if we do, otherwise initialize it to an empty state
    if (props.state) {
      this.state = props.state;
    } else {
      this.state = {
        employees: {},
        currentEmployee: {}
      }
    }
  }

  // Loads an employee by its id
  getEmployeeById = (employeeId) => {
    this.setState({
      currentEmployee: {}
    });
    database.getEmployeeById(employeeId).then(({ currentEmployee }) => {
      this.setState({
        currentEmployee
      });
    });
  }

  // Loads all employees
  getAllEmployees = () => {
    database.getAllEmployees().then(({employees}) => {
      this.setState({
        employees
      });
    });
  }

  render() {
    return (
      <div>
        <nav id="mainNav" className="navbar navbar-custom">
          <div className="container">
            <div className="navbar-header">
              <Link to='/' className="navbar-brand">Employee Directory</Link>
            </div>
          </div>
        </nav>
        <Switch>
          <Route path='/:id' render={(props) => (
            <User {...props}
              currentEmployee={this.state.currentEmployee}
              getEmployeeById={this.getEmployeeById}
            />
          )}/>
          <Route path='/' render={(props) => (
            <Home {...props}
              employees={this.state.employees}
              getAllEmployees={this.getAllEmployees}
            />
          )}/>
        </Switch>
      </div>
    )
  }
}
