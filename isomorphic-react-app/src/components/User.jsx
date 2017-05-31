/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import _ from 'lodash';

export default class User extends React.Component {
  componentDidMount() {
    // if no data is present, load the employee data from the database
    if(_.isEmpty(this.props.currentEmployee) ||
      this.props.currentEmployee.employee.id !== this.props.match.params.id) {
      this.props.getEmployeeById(this.props.match.params.id);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.match.params.id !== this.props.match.params.id) {
      // user has navigated to a new employee details page
      // load data for that employee and set to state
      this.props.getEmployeeById(nextProps.match.params.id);
    }
  }

  // render function for direct reports
  renderReports() {
    const { reports, employee } = this.props.currentEmployee;
    if (!reports || _.isEmpty(reports)) {
      // Employee has no direct reports
      return null;
    }
    return (
      <div className='reports'>
        <h3>Direct Reports</h3>
        { reports.map((report) => {
          return (
            <div className='direct-report' key={`${employee.id}-${report.id}`}>
              <div className='card'>
                <img className='card-img-left report-img' src={report.image} />
                <div className='report-desc'>
                  <h3>{report.name}</h3>
                  <p>{report.position}</p>
                  <Link to={`/${report.id}`}>View {report.id}'s profile</Link>
                </div>
              </div>
            </div>
          );
        }) }
      </div>
    );
  }

  render() {
    if(_.isEmpty(this.props.currentEmployee)) {
      return <div className="container loader">Loading...</div>;
    }
    const { employee } = this.props.currentEmployee;
    return (
      <div className='user-details'>
        <div className='hero'>
          <div className='container'>
            <img className='employee-image' src={employee.image} />
            <h1>{employee.name}</h1>
            <h4>{employee.position}</h4>
          </div>
        </div>
        <div className='callout'>
          <h4>Fake Data</h4>
          <p>All data displayed below are fake data and displayed for informational purposes only.</p>
        </div>
        <div className='container'>
          <table className='table table-striped details-table'>
            <tbody>
              <tr>
                <td className='title'>Location: </td>
                <td>{employee.location}</td>
              </tr>
              <tr>
                <td className='title'>Job Level: </td>
                <td>{employee.level}</td>
              </tr>
              <tr>
                <td className='title'>Email: </td>
                <td>{employee.email}</td>
              </tr>
              <tr>
                <td className='title'>Phone Number: </td>
                <td>{employee.number}</td>
              </tr>
              <tr>
                <td className='title'>Twitter Handle: </td>
                <td>{employee.twitter}</td>
              </tr>
              <tr>
                <td className='title'>Birthday: </td>
                <td>{employee.birthday}</td>
              </tr>
            </tbody>
          </table>
          { this.renderReports() }
        </div>
      </div>
    )
  }
}
