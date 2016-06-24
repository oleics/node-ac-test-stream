
var expect = require('expect');

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

function testStreamInputOutput(writable, readable, input, output, options) {
  if(options == null) options = {};
  if(options.writeDelay == null) options.writeDelay = 0;
  if(options.checkDelay == null) options.checkDelay = 0;

  var writeDelay = options.writeDelay;
  var checkDelay = options.checkDelay;

  // Assert expected output on parsed data from readable
  var checking;
  var index = 0;

  var promise = parseStream(readable, function(data){
    // handle the 'last empty line'-case
    if(output.length === index && data instanceof Buffer && data.length === 0) {
      return;
    }

    expect(output.length).toBeGreaterThan(index);
    expect(data).toEqual(output[index]);
    ++index;

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

  // Check if done
  function check() {
    if(output.length === index) {
      promise.removeParser();
      return;
    }
    expect(output.length).toBeGreaterThan(index);
  }

  return promise
    .then(function(parserRemoved){
      if(!parserRemoved) {
        clearTimeout(checking);
      }
      expect(output.length).toBe(index);
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
