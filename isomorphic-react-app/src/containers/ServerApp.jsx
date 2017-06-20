import React from 'react';
import ReactDOM from 'react-dom';
import { StaticRouter } from 'react-router';
import App from './App';
import database from 'firebase-database';

export default class ServerApp extends React.Component {
  constructor(props) {
    super(props);
    database.initializeApp(props.appConfig);
  }

  render() {
    return (
      <StaticRouter location={this.props.url} context={this.props.context}>
        <App state={this.props.initialState} />
      </StaticRouter>
    );
  }
}
