
var util = require('util');
var expect = require('expect');
var isEqual = require('is-equal');

var parseStream = require('ac-parse-stream');
var JsonWriter = require('ac-util-stream').JsonWriter;

module.exports = {
  testStream: testStream,
  testStreamInputOutput: testStreamInputOutput
};

function testStream(writable, readable, inOutMap, options) {
  if(options == null) options = {};
  if(options.endWritable == null) options.endWritable = true;
  if(options.endWritableDelay == null) options.endWritableDelay = 0;

  var endWritable = options.endWritable;
  var endWritableDelay = options.endWritableDelay;

  var promise = Promise.resolve();
  inOutMap.forEach(function(m){
    promise = promise.then(function(){
      return testStreamInputOutput(writable, readable, m.input, m.output, options);
    });
  });

  if(endWritable) {
    promise = promise.then(function(){
      return timeout(function(){
        writable.end();
      }, endWritableDelay);
    });
  }

  return promise;
}

function testStreamInputOutput(writable, readable, input, expectedOutput, options) {
  if(options == null) options = {};
  if(options.writeDelay == null) options.writeDelay = 0;
  if(options.checkDelay == null) options.checkDelay = 20;
  if(options.strictOrder == null) options.strictOrder = true;
  if(options.dataTimeout == null) options.dataTimeout = 1000;

  var writeDelay = options.writeDelay;
  var checkDelay = options.checkDelay;
  var strictOrder = options.strictOrder;
  var dataTimeout = options.dataTimeout;

  // Assert expected output on parsed data from readable
  var output = [];
  var checking;
  var checked = false;

  // Parse readable and collect the data
  var promise = parseStream(readable, function(data){
    // handle the 'last empty line'-case
    if(expectedOutput.length === output.length && data instanceof Buffer && data.length === 0) {
      return;
    }

    output.push(data);

    clearTimeout(checking);
    checking = setTimeout(check, checkDelay);
  });

  // Push input to writable
  var writeJson = JsonWriter(writable);
  var writePromise = Promise.resolve();
  input.forEach(function(data){
    writePromise = writePromise.then(function(){
      return timeout(function(){
        writeJson(data);
      }, writeDelay);
    });
  });

  // Check
  function check() {
    if(expectedOutput.length !== output.length) {
      expect(expectedOutput.length).toBeGreaterThan(output.length,
        util.format('Too much data. Expected %s, got %s.', expectedOutput.length, output.length)
      );
      checking = setTimeout(onDataTimeout, dataTimeout);
      return;
    }

    // Compare expectedOutput with expected expectedOutput
    if(strictOrder) {
      output.forEach(function(data, index){
        expect(data).toEqual(expectedOutput[index],
          util.format('Unexpected data at index %s.', index)
        );
      });
    } else {
      var _expectedOutput = expectedOutput.slice(0);
      output.forEach(function(data, index){
        expect(_expectedOutput.some(function(_data, _index){
          if(isEqual(data, _data)) {
            _expectedOutput.splice(_index, 1);
            return true;
          }
        })).toBe(true,
          util.format('No match for\n', data)
        );
      });
    }

    promise.removeParser();
  }

  //
  function onDataTimeout() {
    expect(true).toBe(false,
      util.format('Timeout. No data after %s ms. Got %s, expecting %s.', dataTimeout, output.length, expectedOutput.length)
    );
  }

  //
  return promise
    .then(function(parserRemoved){
      expect(parserRemoved).toBe(true,
        util.format('Unexpected end of readable stream.')
      );
    })
  ;
}

function timeout(fn, ms) {
  return new Promise(function(resolve, reject) {
    setTimeout(function(){
      fn();
      resolve();
    }, ms);
  });
}
