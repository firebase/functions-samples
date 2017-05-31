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

export default class Home extends React.Component {
  componentDidMount() {
    // if no data is present, load the employees data
    if(_.isEmpty(this.props.employees)) {
      this.props.getAllEmployees();
    }
  }

  render() {
    if(_.isEmpty(this.props.employees)) {
      return <div className="container loader">Loading...</div>;
    }
    return (
      <div className='container home'>
        <ul className="cards">
          {_.reverse(_.sortBy(this.props.employees, 'level')).map((employee) => {
            return (<li className="card card-inline" key={employee.id}>
              <img className="card-img-top card-image" src={employee.image}/>
              <div className="card-block">
                <h4 className="card-title">{employee.name}</h4>
                <p className="card-text">{employee.position}</p>
                <Link to={`/${employee.id}`} className="btn">Details</Link>
              </div>
            </li>)
          })}
        </ul>
      </div>
    );
  }
}
