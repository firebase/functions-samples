/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
chai.use(chaiAsPromised);


// test input data
const userId = '8ZfiT8HeMTN9a4etjfCmahBqhK52';
const displayName = 'My Name';

//test cases
describe('Wipeout', () => {
	let  admin, functions, wipeout;

	before(() => {
		admin = require('firebase-admin');
		adminInitStub = sinon.stub(admin,'initializeApp');

		functions = require('firebase-functions');
		configStub = sinon.stub(functions, 'config').returns({
			firebase:{
				databaseURL:'https://fakedb.firebaseio.com',
			},
			wipeout:{
					path:'/users'
			}
		});

		wipeout = require('../wipeout');

	});

	after(() => {
		configStub.restore();
		adminInitStub.restore();
	});

	describe('Delete User', () => {
		const fakeUser = {
			uid : userId,
			displayName: displayName
		};

		it('should build correct path', () => {
			expect(wipeout.buildPath(fakeUser.uid)).to.equal(`/users/${userId}`);
			});

		it('should delete data and write log into logging path', () => {
			const logParam = `/wipeout-log/${userId}`;
			const removeParam = `/users/${userId}`;
			const databaseStub = sinon.stub(admin, 'database');

			const refStub = sinon.stub();
			const setStub = sinon.stub();
			const removeStub = sinon.stub();

			databaseStub.returns( { ref: refStub });
			refStub.withArgs(logParam).returns( { set: setStub} );
			refStub.withArgs(removeParam).returns( { remove : removeStub } );
			
			setStub.withArgs(displayName).returns(true);
			removeStub.returns(true);


			expect(wipeout.deleteUser(fakeUser)).eventually.to.equal(true);
			});

		});

	});

