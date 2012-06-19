// Load external node.js modules
var express = require('express')
, http = require('http')
, WebSocketServer = require('websocket').server
, Buffer = require('buffer').Buffer
, fs = require("fs")
, spawn = require('child_process').spawn
, exec = require('child_process').exec
, config = require('./config')
, M3D = require('./public/javascripts/m3d')
, path = require('path');

// Express framework settings
var app = express();
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});
app.configure('development', function(){
  app.use(express.errorHandler());
});

// WebSocket Connections
var connections = [];
var luafile; // quick fix
app.get(/^\/demos\/([a-z]+\.lua)$/, function(req, res){
    luafile = __dirname+"/agx/demos/"+req.params[0];
    if(path.existsSync(luafile)) {
	if(connections.length >= config.agxMaxInstances)
	    res.render('toomany',{
		title:config.title,
		numcurrent:connections.length,
		public_root:config.public_root
	    })
	else {
	    res.render('demo',{
		title:config.title,
		public_root:config.public_root,
		websocketport:config.port,
		websockethost:config.host,
	    });
	}
    } else {
	res.render('notfound',{
	    title:config.title,
	    public_root:config.public_root,
	    file:req.params[0]
	});
    }
});
app.get('/', function(req, res){
    fs.readdir(__dirname+"/agx/demos",function(err,files){
	// Get lua files from folder
	var demos = [];
	for(var i=0; i<files.length; i++){
	    if(files[i].match(/[a-z]+\.lua/))
		demos.push(files[i]);
	};
	
	// View overview page
	res.render('index',{
	    title:config.title,
	    public_root:config.public_root,
	    demos:demos
	});
    });
});
app.get('/doc', function(req, res){
    res.render('doc',{public_root:config.public_root});
});

// Start Webserver
var server = http.createServer(app).listen(config.port);
console.log("Express server listening on port "+config.port);

// Start the WebSocketServer
var wss = new WebSocketServer({httpServer: server});
var idCounter = 0;
wss.on('request', function(req){

    if(connections.length >= config.agxMaxInstances ||  // Reject if we have too many agx instances
       req.origin.indexOf(config.host) == -1) {         // Or if the client isn't on our website
	req.reject(null, req.origin);
	return;
    }

    // Accept connection
    var connection = req.accept(null, req.origin);
    connection.id = idCounter++;
    connections.push(connection);
    
    // Start a new world
    var args = [luafile];
    for(var i in config.agxFlags)
	args.push(config.agxFlags[i]);
    var world = new M3D.AgxWorld(config.agxCommand, args);

    world.addEventListener('construct',function(){
	// Send world info (geometries etc) as JSON
	connection.send(world.toJSONString());

	// Simulation loop
	setInterval(function(){
	    world.step();
	}, world.dt*1000);
    });

    var broadCastCount = 0;
    world.addEventListener('change',function(){
	if(broadCastCount % (world.skip+1) == 0)
	    connection.send(world.toBuffer());
	broadCastCount++;
    });

    // Message
    connection.on('message', function(message) {
        switch(message.type){
	case 'utf8':
	    break;
	case 'binary':
	    world.handleBufferMessage(message.binaryData);
	    break;
	}
    });

    // Close
    connection.on('close', function(reason) {
	// Delete the world, close agx
	world.destruct();

	// Delete connection from "global" array
	for(var i=0; i<connections.length; i++)
	    if(connections[i].id == connection.id)
		connections.splice(i,1);
    });
});