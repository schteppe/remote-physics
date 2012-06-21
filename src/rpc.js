(function(){

    // Namespace
    RPC = {};

    /**
     * Remote connection.
     * @param mixed conn A connection object for Node.js, a websocket URL for the client
     */
    RPC.Remote = function(connection){
	RPC.EventTarget.call(this);
	var idCount = 1,
	callbacks = {},
	that = this,
	conn = connection;

	var send;
	if(conn instanceof RPC.DebugSocket){
	    conn.onmessage = function(e){
		onmessage(e.data);
	    };
	    send = function(data){
		// Send using connection
		conn.send(data);
	    };
	} else {
	    throw new Error("Connection type not recognized.");
	}

	// Projects data onto an arraybuffer and returns it
	this.marshal = function(message){
	    var data = JSON.stringify(message); // todo: use binary array buffers
	    return data;
	}

	// Must return an object with properties type and id
	this.unmarshal = function(data){
	    var message = JSON.parse(data); // todo: use binary array buffers
	    return message;
	}

	// Take care of an incoming message
	function onmessage(data){
	    var message = that.unmarshal(data);
	    switch(message.type){

		// Commands with optional empty result
	    case 'System.removeBody':
	    case 'System.setKinematics': // Set the kinematics for the whole system
	    case 'System.step':
	    case 'Stepper.setTimestep':
	    case 'Body.setPosition':
	    case 'Body.setInertia':
	    case 'Body.setMass':
	    case 'Body.setState':
	    case 'Body.setGeometry':
	    case 'Body.setVelocity':
	    case 'Body.setAngularVelocity':
	    case 'Body.subscribe':
	    case 'Body.unsubscribe':
	    case 'Network.ping':
		message.done = function(){
		    if(message.mid>0){ // If a callback was provided
			that.exec({
			    type:'result',
			    mid:message.mid
			});
		    }
		};
		that.dispatchEvent({type:'command',command:message});
		break;

		// Get a vec3
	    case 'Body.getInertia':
	    case 'Body.getVelocity':
	    case 'Body.getAngularVelocity':
	    case 'Body.getPosition':
		message.done = function(x,y,z){
		    that.exec({
			type:'result',
			mid:message.mid,
			x:x,
			y:y,
			z:z
		    });
		};
		that.dispatchEvent({type:'command',command:message});
		break;

	    case 'System.createBody':
		message.done = function(id){
		    that.exec({
			type:'result',
			mid:message.mid,
			id:id
		    });
		};
		that.dispatchEvent({type:'command',command:message});
		break;

		// Got result, call registered callback
	    case 'result':
		callbacks[message.mid] && callbacks[message.mid](message);
		callbacks[message.mid] = null;
		break;

		// Got report, call callback but do not delete it
	    case 'report':
		callbacks[message.mid] && callbacks[message.mid](message);
		break;

	    default:
		throw new Error("Strange message type: "+message.type);
		break;
	    }
	}

	this.exec = function(command,callback){
	    // register callback
	    if(!command.mid)
		command.mid = 0;
	    if(callback){
		command.mid = idCount;
		callbacks[idCount] = callback;
		idCount++;
	    }

	    // Send message
	    send(that.marshal(command));
	};
    };

    RPC.DebugSocket = function(){
	RPC.EventTarget.call(this);
	var remote;
	this.onmessage = function(e){};
	this.onopen = function(e){};
	this.onclose = function(e){};
	this.readyState = 0;
	this.send = function(data){
	    remote.onmessage({data:data});
	};
	this.connect = function(remoteSocket){
	    remote = remoteSocket;
	    this.readyState = 1; // OK
	    this.onopen({});
	};
    };

    /**
     * https://github.com/mrdoob/eventtarget.js/
     */
    RPC.EventTarget = function () {
	var listeners = {};
	this.addEventListener = function ( type, listener ) {
	    if ( listeners[ type ] == undefined ) {
		listeners[ type ] = [];
	    }
	    if ( listeners[ type ].indexOf( listener ) === - 1 ) {
		listeners[ type ].push( listener );
	    }
	};

	this.dispatchEvent = function ( event ) {
	    for ( var listener in listeners[ event.type ] ) {
		listeners[ event.type ][ listener ]( event );
	    }
	};

	this.removeEventListener = function ( type, listener ) {
	    var index = listeners[ type ].indexOf( listener );
	    if ( index !== - 1 ) {
		listeners[ type ].splice( index, 1 );
	    }
	};
    };


    // Node.js module export
    if (typeof module !== 'undefined'){
	//module.exports.DebugSocket = DebugSocket;
	//module.exports.Remote = Remote;
	module.exports.RPC = RPC;
	
    } else {
	this.RPC = RPC;
    }

}).apply(this);