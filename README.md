
ac-test-stream
==============

A small library to test outputs of a stream against inputs.

Install
-------

```sh
npm install ac-test-stream --save-dev
```

Usage
-----

### Example

```js

var stream = new (require('stream').PassThrough);
var writable = stream;
var readable = stream;

var testStream = require('ac-test-stream').testStream;

testStream(writable, readable, [
  { // succeeds
    input: [{ type: 'foo' }, { type: 'bar' }],
    output: [{ type: 'foo'}, { type: 'bar' }]
  },
  { // fails
    input: [{ type: 'foo' }, { type: 'bar' }],
    output: [{ type: 'foo'}]
  }
], {
  writeDelay: 0,      // delay writes of input-data, in milliseconds
  checkDelay: 20,     // delay the expectations-check, in milliseconds

  strictOrder: true,  // expected output and output of readable must be in order
  dataTimeout: 1000,  // timeout for data from readable, in milliseconds

  endWritable: true,  // call `writable.end()` after the test-run
  endWritableDelay: 0 // delay the call to `writable.end()`, in milliseconds
})
  .then(onSuccess)
  .catch(onError)
;

```

MIT License
-----------

Copyright (c) 2016 Oliver Leics <oliver.leics@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
