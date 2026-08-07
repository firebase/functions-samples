# lambda-ghostscript

This repository contains a compiled version of Ghostscript which works with Amazon Web Services(AWS) Lambda.

These binaries are based on Ghostscript 9.20.

AWS Lambda is using an old version of Ghostscript which causes many issues. Lambda has the ability to use local libraries which can be packed inside the function archive, this repository can save you some time.

You should include the files inside your project and use a Ghostscript Node js package to use it.

This is an npm package to call Ghostscript functions:

https://github.com/sina-masnadi/node-gs

After copying the compiled Ghostscript files to your project and adding the npm package, you can use the executablePath('path to ghostscript') function to point the package to the compiled Ghostscript files that you added earlier.
