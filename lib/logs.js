/*
 * Library for storing and rotating logs
 *
 */

// Dependenciew
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// container for the module
let lib = {};

// Base directory of the logs folder
lib.baseDir = path.join(__dirname, '/../.logs/');

// Append a string to a file, create the file if it doesn't exist
lib.append = (file, str, callback) => {
  // open the file for appending
  fs.open(lib.baseDir + file + '.log', 'a', (err, filedescriptior) => {
    if (!err && filedescriptior) {
      // Append to the file and close it
      fs.appendFile(filedescriptior, str + '\n', (err) => {
        if (!err) {
          fs.close(filedescriptior, (err) => {
            if (!err) {
              callback(false);
            } else {
              console.log('Error closing file that was being appended');
            }
          });
        } else {
          callback('Error appending to new file');
        }
      });
    } else {
      console.log('could not open file for appending');
    }
  });
};

// list all the logs and optionally include the compressed logs
lib.list = (includeCompressedLogs, callback) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach((fileName) => {
        // add the .log files
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName.replace('.log', ''));
        }

        // add the .gz files
        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''));
        }
      });

      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

// Compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = (logId, newfileId, callback) => {
  let sourceFile = logId + '.log';
  let destFile = newfileId + '.gz.b64';

  // Read the source file
  fs.readFile(lib.baseDir + sourceFile, 'utf8', (err, inputString) => {
    if (!err && inputString) {
      // Compress the data using gzip
      zlib.gzip(inputString, (err, buffer) => {
        if (!err && buffer) {
          // send the data to the destination file
          fs.open(lib.baseDir + destFile, 'wx', (err, filedescriptior) => {
            if (!err && filedescriptior) {
              // write to the destinatin file
              fs.writeFile(
                filedescriptior,
                buffer.toString('base64'),
                (err) => {
                  if (!err) {
                    // close the destination file
                    fs.close(filedescriptior, (err) => {
                      if (!err) {
                        callback(false);
                      } else {
                        callback(err);
                      }
                    });
                  } else {
                    callback(err);
                  }
                }
              );
            } else {
              callback(err);
            }
          });
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

// Decompress the contents of a .gz.b64 file into a string variable
lib.decompress = (fileId, callback) => {
  let fileName = fileId + '.gz.b64';
  fs.readFile(lib.baseDir + fileName, 'utf8', (err, str) => {
    if (!err && str) {
      // decompress the data
      const inputBuffer = Buffer.from(str, 'base64');

      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if (!err && outputBuffer) {
          let str = outputBuffer.toString();
          callback(false, str);
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

// Truncate a log file
lib.truncate = (logId, callback) => {
  fs.truncate(lib.baseDir + logId + '.log', 0, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};

// Export the module
module.exports = lib;
