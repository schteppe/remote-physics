// Command for running Agx
exports.agxCommand = '/path/to/your/executable/agxViewer';

// Arguments to pass to agxViewer in addition to the .lua filename
exports.agxFlags = ["--agxOnly"];

// Print stdout and stderr from Agx in console
exports.agxPrintStdout = true;
exports.agxPrintStderr = true;

// Max AgX instances
exports.agxMaxInstances = 4;

// Webserver stuff
exports.port = 3000;
exports.host = "your.domain.com";
exports.public_root = "http://"+exports.host+":"+exports.port;
exports.websocket_url = "ws://"+exports.host+":"+exports.port;

// Site settings
exports.title = "3D Remote Physics";