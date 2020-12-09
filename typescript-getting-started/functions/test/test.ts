import { suite, test } from '@testdeck/mocha'
import * as chai from 'chai'
import * as functions from 'firebase-functions'

import { helloWorld } from '../src'

const assert = chai.assert;

@suite
class HelloWorld {
  @test
  async helloWorld() {
    const req = {} as functions.https.Request;
    const res = {
      send: (body) => {
        assert.equal(body, 'Hello from Firebase!\n\n');
      },
    } as functions.Response;
    helloWorld(req, res);
  }
}
