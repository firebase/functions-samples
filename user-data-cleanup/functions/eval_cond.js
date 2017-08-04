'use strict';
const common = require('./common');

const extractPath = list => {
  const ret = [''];
  for (let i = 1; i < list.length; i++) {
    ret.push(list[i].name);
  }
  return ret.join('/');
};

const evalOperand = obj => {
  switch (obj.type) {
    case 'Identifier':
      return Promise.resolve(obj.name);

    case 'Literal':
      return Promise.resolve(obj.val);

    case 'CallExpression':
      switch (obj.callee) {
        case 'exists':
          return evalExists(obj);
        case 'val':
          return evalVal(obj);
      }
  }
};

const evalExists = obj => {
  if (obj.callee !== 'exists') {
    throw 'Expect exists()';
  }
  const loc = extractPath(obj.arguments);
  var ref = common.db.ref(loc);
  return ref.once("value").then(snapshot =>  snapshot.exists());
}

const evalVal = obj => {
  if (obj.callee !== 'val') {
    throw 'Expect val()';
  }
  const loc = extractPath(obj.arguments);
  var ref = common.db.ref(loc);
  return ref.once("value").then(snapshot =>  snapshot.val());

  };


const evalLogic = (obj) => {
  switch (obj.type) {
    case 'CallExpression':
      return evalExists(obj);

    case 'BinaryExpression':
      const leftBinary = evalOperand(obj.left);
      const rightBinary = evalOperand(obj.right);

      return Promise.all([leftBinary,rightBinary])
          .then(res => eval(`${res[0]} ${obj.operator} ${res[1]}`));

    case 'LogicalExpression':
      const leftLogic = evalLogic(obj.left);
      const rightLogic = evalLogic(obj.right);

      if (obj.operator === '||') {
        return Promise.all([leftLogic,rightLogic])
            .then(res => (res[0] || res[1]));
      }
      if (obj.operator === '&&') {
        return Promise.all([leftLogic,rightLogic])
            .then(res => (res[0] && res[1]));
      }
      throw `Unsupported logic operation in condition`;
  }
};
