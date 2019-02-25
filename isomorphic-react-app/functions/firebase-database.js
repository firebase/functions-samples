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

// Client and Server Data Fetching Logic

// Import the Firebase base SDK.
const firebase = require('firebase/app');
// Load the Firebase database module.
// Here you should load all modules of Firebase that you need.
require('firebase/database');

// We initialize Firebase using a client-side config.
const firebaseConfig = require('./firebase-config.json').result;
(firebase.default || firebase).initializeApp(firebaseConfig);


// Get and return all employees
async function getAllEmployees() {
  const snap = await firebase.database().ref('/employees').orderByChild('level').once('value');
  return {employees: snap.val()};
}

// Get and return an employee by their id number
// also fetch all of the employee's direct reports (if any)
async function getEmployeeById(employeeId) {
  let employee;
  const snap = await firebase.database().ref(`/employees/${employeeId}`).once('value');
  employee = snap.val();
  const reportIds = Object.keys(employee.reports || []);
  const getReports = reportIds.map(userId => firebase.database().ref(`/employees/${userId}`).once('value'));
  const reportSnapshots = await Promise.all(getReports);
  reports = reportSnapshots.map(snap => snap.val());
  return {employee, reports: reports};
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
};
