import React from 'react';
import { StaticRouter } from 'react-router';
import App from './App';

export default class ServerApp extends React.Component {
  render() {
    return (
      <StaticRouter location={this.props.url} context={this.props.context}>
        <App state={this.props.initialState} />
      </StaticRouter>
    );
  }
}
