const functions = require('firebase-functions');

exports.logTestComplete = functions.testLab
  .testMatrix()
  .onComplete(testMatrix => {
    const { testMatrixId, createTime, state, outcomeSummary } = testMatrix;

    console.log(
      `TEST ${testMatrixId} (created at ${createTime}): ${state}. ${outcomeSummary ||
        ''}`
    );
  });
