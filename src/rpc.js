// Namespace
RPC = {};

/**
 * @class RPC.Remote
 * @brief A remote binary RPC connection.
 * @param mixed conn A connection object for Node.js, a websocket URL for the client
 */
RPC.Remote = function(connection){
    // Message types
    var BODY_SUBSCRIBE =        this.BODY_SUBSCRIBE =        1;
    var BODY_UNSUBSCRIBE =      this.BODY_UNSUBSCRIBE =      2;
    var NETWORK_PING =          this.NETWORK_PING =          3;
    var WORLD_STEP =            this.WORLD_STEP =            4;
    var WORLD_UPDATECOORDS =    this.WORLD_UPDATECOORDS =    5;
    var WORLD_CREATEBODY =      this.WORLD_CREATEBODY =      6;
    var COLLISION_CREATESHAPE = this.COLLISION_CREATESHAPE = 7;
    var EMPTYRESULT =           this.EMPTYRESULT =           8;
    var REPORT =                this.REPORT =                9;

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
	var headlen = 4*2; // id,type as 2 int32's
	var i32view, f32view, i8view, ui8view, i16view;
	function prepBuf(mess,datalength){
	    var buf = new ArrayBuffer(datalength+headlen);
	    head = new Int32Array(buf,0,2);
	    head[0] = mess.mid;
	    head[1] = mess.type;
	    return buf;
	}
	var buf;
	switch(message.type){

	case BODY_SUBSCRIBE:
	    buf = prepBuf(message,4); // id of the body (i32)
	    i32view[2] = message.id;
	    break;

	case NETWORK_PING:
	    buf = prepBuf(message,0);
	    break;

	case WORLD_STEP:
	    buf = prepBuf(message,4); // dt (f32)
	    if(!f32view) f32view = new Float32Array(buf);
	    f32view[2] = message.dt;
	    break;

	case WORLD_UPDATECOORDS: // Quality??
	    buf = prepBuf(message,
			  message.ids.length*(1*2 + (3+4)*2)); // 1id * int16 + ( 3pos + 4quat ) * int16
	    if(!i16view) i16view = new Int16Array(buf);
	    var start = 4;
	    for(var i=0; i<message.ids.length; i++){
		i16view[start] = message.ids[i];
		i16view[start+1] = message.positions[3*i+0];
		i16view[start+2] = message.positions[3*i+1];
		i16view[start+3] = message.positions[3*i+2];
		i16view[start+4] = message.quats[4*i+0];
		i16view[start+5] = message.quats[4*i+1];
		i16view[start+6] = message.quats[4*i+2];
		i16view[start+7] = message.quats[4*i+3];
	    }
	    break;

	case COLLISION_CREATESHAPE:
	    switch(message.shapeType){
	    case M3D.Shape.SPHERE:
		buf = prepBuf(message,4 + 4 + 4); // 1type * int32 + radius*float32 + id*int32
		var typ = new Int32Array(buf);
		typ[2] = message.shapeType;
		var radius = new Float32Array(buf);
		radius[3] = message.radius;
		typ[4] = message.id;
		break;
	    default:
		throw new Error("Shape "+message.shapeType+" not implemented yet!");
		break;
	    }
	    break;

	case WORLD_CREATEBODY:
	    buf = prepBuf(message,4 + 4 + 4); // shapeType*int32 , mass*float32, newid*int32
	    if(!i32view) i32view = new Int32Array(buf);
	    if(!f32view) f32view = new Float32Array(buf);
	    i32view[2] = message.shapeType;
	    f32view[3] = message.mass;
	    i32view[4] = message.id;
	    break;

	default:
	    throw new Error("Marshalling of messages of type "+message.type+" not implemented yet");
	    break;
	}
	return buf;

	var data = JSON.stringify(message); // todo: use binary array buffers
	return data;
    }

    // Must return an object with properties type and id
    this.unmarshal = function(data){
	//var message = JSON.parse(data); // todo: use binary array buffers

	var i32view = new Int32Array(data),
	f32view = new Float32Array(data),
	ui8view = new Uint8Array(data),
	i16view = new Int16Array(data);
	var m = {mid:i32view[0],
		 type:i32view[1]};
	switch(m.type){
	case BODY_SUBSCRIBE:
	    m.id = i32view[2];
	    break;
	case NETWORK_PING:
	    break;
	case WORLD_STEP:
	    m.dt = f32view[2];
	    break;
	case WORLD_UPDATECOORDS:
	    // 1id * int16 + ( 3pos + 4quat ) * int16 
	    var start = 4;
	    var numbodies = (data.byteLength-8) / (2*8);
	    m.ids = [];
	    m.positions = [];
	    m.quats = [];
	    for(var i=0; i<numbodies; i++){
		m.ids.push(i16view[start]);
		m.positions.push(i16view[start+1]);
		m.positions.push(i16view[start+2]);
		m.positions.push(i16view[start+3]);
		m.quats.push(i16view[start+4]);
		m.quats.push(i16view[start+5]);
		m.quats.push(i16view[start+6]);
		m.quats.push(i16view[start+7]);
	    }
	    break;
	case COLLISION_CREATESHAPE:
	    m.shapeType = i32view[2];
	    switch(m.shapeType){
	    case M3D.Shape.SPHERE:
		m.radius = f32view[3];
		m.id = i32view[4];
		break;
	    default:
		throw new Error("Shape "+m.shapeType+" not implemented yet!");
		break;
	    }
	    break;
	case WORLD_CREATEBODY:
	    m.mass = f32view[3];
	    m.id = i32view[4];
	    break;
	default:
	    throw new Error("Marshalling of ms of type "+m.type+" not implemented yet");
	    break;
	}
	return m;
    }

    // Take care of an incoming message
    function onmessage(data){
	var message = that.unmarshal(data);
	switch(message.type){

	    // Commands with optional empty result
	case BODY_SUBSCRIBE:
	case NETWORK_PING:
	case WORLD_STEP:
	case WORLD_UPDATECOORDS:
	    message.done = function(){
		if(message.mid>0){ // If a callback was provided
		    that.exec({
			type:EMPTYRESULT,
			mid:message.mid
		    });
		}
	    };
	    that.dispatchEvent({type:'command',command:message});
	    break;

	case COLLISION_CREATESHAPE:
	case WORLD_CREATEBODY:
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
	    /*
	      // Should be specific results to be able to unmarshal
	case RESULT:
	    callbacks[message.mid] && callbacks[message.mid](message);
	    callbacks[message.mid] = null;
	    break;*/

	    // Got report, call callback but do not delete it
	    /*
	      // Should be specific reports
	case REPORT:
	    callbacks[message.mid] && callbacks[message.mid](message);
	    break;
*/

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

/**
 * @class RPC.DebugSocket
 * @brief Helper socket implementation.
 */
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
 * @class RPC.EventTarget
 * @see https://github.com/mrdoob/eventtarget.js/
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
