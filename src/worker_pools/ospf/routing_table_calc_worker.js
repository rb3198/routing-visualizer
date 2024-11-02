// worker.js
const workercode = () => {
  // eslint-disable-next-line no-restricted-globals
  self.onmessage = async function (e) {
    // without self, onmessage is not defined
    console.log("Message received from main script");
    var workerResult = "Received from main: " + JSON.stringify(e.data);
    console.log("Posting message back to main script");
    // eslint-disable-next-line no-restricted-globals
    self.postMessage(workerResult); // here it's working without self
  };
};

let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

const blob = new Blob([code], { type: "application/javascript" });
const worker_script = URL.createObjectURL(blob);

module.exports = worker_script;
