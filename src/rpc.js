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
    var BODY_SETPOSITION =      this.BODY_SETPOSITION =      10;
    var NETWORK_PING =          this.NETWORK_PING =          3;
    var WORLD_STEP =            this.WORLD_STEP =            4;
    var WORLD_UPDATECOORDS =    this.WORLD_UPDATECOORDS =    5;
    var WORLD_CREATEBODY =      this.WORLD_CREATEBODY =      6;
    var COLLISION_CREATESHAPE = this.COLLISION_CREATESHAPE = 7;
    var EMPTYRESULT =           this.EMPTYRESULT =           8;
    var REPORT =                this.REPORT =                9;

    /**
     * @property M3D.TimeStats downStats
     * @memberof RPC.Remote
     */
    this.downStats = new M3D.TimeStats();
    /**
     * @property M3D.TimeStats upStats
     * @memberof RPC.Remote
     */
    this.upStats = new M3D.TimeStats();

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
	    if(conn.readyState==1)
		conn.send(data);
	    that.upStats.accumulate(data.byteLength);
	};
    } else if(typeof(WebSocket)!='undefined' && conn instanceof WebSocket){
	conn.onmessage = function(e){
	    // Assume Blob object
	    // Update transforms. Need a filereader to read the fetched binary blob
	    var fr = new FileReader();
	    fr.onload = function(f){
		onmessage(fr.result);
	    } 
	    fr.readAsArrayBuffer(e.data);
	};
	send = function(data){
	    // Send using connection
	    if(conn.readyState==1)
		conn.send(data);
	    that.upStats.accumulate(data.byteLength);
	};
    } else if(conn.webSocketVersion){ // Node.js websocket connection
	conn.on('message', function(message) {
	    switch(message.type){
	    case 'utf8':
		break;
	    case 'binary':
		// Manual copy. Is there a better way?
		var buf = new ArrayBuffer(message.binaryData.length);
		for(var i=0; i<message.binaryData.length; i++)
		    buf[i] = message.binaryData[i];
		onmessage(buf);
		break;
	    }
	});
	send = function(data){
	    // Manual copy. Is there a better way?
	    var buf = new Buffer(data.byteLength);
	    for(var i=0; i<data.byteLength; i++)
		buf[i] = data[i];
	    that.upStats.accumulate(buf.byteLength);
	    conn.send(buf);
	};
    } else
	throw new Error("Connection type not recognized.");

    /**
     * @fn marshal
     * @memberof RPC.Remote
     * @brief Projects data onto an arraybuffer and returns it
     * @param Object message
     * @return ArrayBuffer
     */ 
    this.marshal = function(message){
	var headlen = 4*2; // id,type as 2 int32's
	var i32view, f32view, i8view, ui8view, i16view;
	function prepBuf(mess,datalength){
	    var buf = new ArrayBuffer(datalength+headlen);
	    i32view = new Int32Array(buf);
	    i32view[0] = mess.mid;
	    i32view[1] = mess.type;
	    return buf;
	}
	var buf;
	switch(message.type){

	case BODY_SUBSCRIBE:
	    buf = prepBuf(message,4); // id of the body (i32)
	    i32view[2] = message.id;
	    break;

	case BODY_SETPOSITION:
	    buf = prepBuf(message,1*4+3*2+2); // id of the body and xyz (1*i32 + 3*i16)
	    i32view[2] = message.id;
	    if(!i16view) i16view = new Int16Array(buf);
	    i16view[6] = RPC.compress(message.x,'int16');
	    i16view[7] = RPC.compress(message.y,'int16');
	    i16view[8] = RPC.compress(message.z,'int16');
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
	    // @todo compress
	    buf = prepBuf(message,
			  message.ids.length*(1*2 + (3+4)*2)); // 1id * int16 + ( 3pos + 4quat ) * int16
	    if(!i16view) i16view = new Int16Array(buf);
	    var start = 4;
	    for(var i=0; i<message.ids.length; i++){
		i16view[start] = message.ids[i];
		i16view[start+1] = RPC.compress(message.positions[3*i+0],'int16');
		i16view[start+2] = RPC.compress(message.positions[3*i+1],'int16');
		i16view[start+3] = RPC.compress(message.positions[3*i+2],'int16');
		i16view[start+4] = RPC.compress(message.quats[4*i+0],'int16');
		i16view[start+5] = RPC.compress(message.quats[4*i+1],'int16');
		i16view[start+6] = RPC.compress(message.quats[4*i+2],'int16');
		i16view[start+7] = RPC.compress(message.quats[4*i+3],'int16');
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
	    buf = prepBuf(message,4 + 4 + 4); // shapeId*int32 , mass*float32, newid*int32
	    if(!i32view) i32view = new Int32Array(buf);
	    if(!f32view) f32view = new Float32Array(buf);
	    i32view[2] = message.shapeId;
	    f32view[3] = message.mass;
	    i32view[4] = message.id;
	    break;

	default:
	    throw new Error("Marshalling of messages of type "+message.type+" not implemented yet.");
	    break;
	}

	return buf;

	//var data = JSON.stringify(message); // todo: use binary array buffers
	//return data;
    }

    /**
     * @fn unmarshal
     * @memberof RPC.Remote
     * @brief Converts back a message from an arraybuffer
     * @param ArrayBuffer data
     * @return Object
     */ 
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

	case BODY_SETPOSITION:
	    m.id = i32view[2];
	    m.x = RPC.uncompress(i16view[6],'int16');
	    m.y = RPC.uncompress(i16view[7],'int16');
	    m.z = RPC.uncompress(i16view[8],'int16');
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
	    // @todo uncompress
	    for(var i=0; i<numbodies; i++){
		m.ids.push(i16view[start]);
		m.positions.push(RPC.uncompress(i16view[start+1 + i*8],'int16'));
		m.positions.push(RPC.uncompress(i16view[start+2 + i*8],'int16'));
		m.positions.push(RPC.uncompress(i16view[start+3 + i*8],'int16'));
		m.quats.push(RPC.uncompress(i16view[start+4 + i*8],'int16'));
		m.quats.push(RPC.uncompress(i16view[start+5 + i*8],'int16'));
		m.quats.push(RPC.uncompress(i16view[start+6 + i*8],'int16'));
		m.quats.push(RPC.uncompress(i16view[start+7 + i*8],'int16'));
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
	    m.shapeId = f32view[2];
	    m.mass = f32view[3];
	    m.id = i32view[4];
	    break;

	default:
	    throw new Error("UN-Marshalling of message type "+m.type+" not implemented yet");
	    break;
	}
	return m;
    }

    // Take care of an incoming message
    function onmessage(data){
	that.downStats.accumulate(data.byteLength);
	var message = that.unmarshal(data);
	switch(message.type){

	    // Commands with optional empty result
	case BODY_SUBSCRIBE:
	case BODY_SETPOSITION:
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
	var marshalled = that.marshal(command);
	send(marshalled);
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

/**
 * @fn RPC.compress
 * @brief Lossy compress a float number into an integer.
 * @param float num The number to compress
 * @param string type 'uint8', 'int8', 'uint16', 'int16', 'int32' or 'uint32'
 * @param float mini Optional. Minimum value of your number.
 * @param float maxi Optional. Maximum value of your number.
 * @param bool clamp Specify if the number should be clamped to be within the maxi/mini range. Recommended.
 * @return int
 */
RPC.compress = function(num,type,mini,maxi,clamp){
    var mm = maxmin(type);
    var max = mm[0], min = mm[1];
    clamp = clamp===undefined ? true : false;
    mini = mini===undefined ? -1e3 : mini;
    maxi = maxi===undefined ? 1e3 : maxi;

    if(clamp){
	if(num>maxi) num = maxi;
	if(num<mini) num = mini;
    }

    return Math.floor((num+mini)/(maxi-mini) * (max-min) - min);
};

/**
 * @fn RPC.uncompress
 * @brief Uncompress an integer into a float.
 * @param int num The number to uncompress
 * @param string type See compress()
 * @param float mini See compress()
 * @param float maxi See compress()
 * @return float
 */
RPC.uncompress = function(num,type,mini,maxi){
    var mm = maxmin(type);
    var max = mm[0], min = mm[1];
    mini = mini===undefined ? -1e3 : mini;
    maxi = maxi===undefined ? 1e3 : maxi;
    return (num - min)/(max-min) * (maxi-mini) + mini;
};

// Get max and min given precision
function maxmin(precision){
    var max,min;
    switch(precision){
    case 'uint8':
	min = 0;
	max = 255;
	break;
    case 'int8':
	min = -128;
	max = 127;
	break;
    case 'uint16':
	min = 0;
	max = 65535;
	break;
    case 'int16':
	min = -32768;
	max = 32767;
	break;
    case 'int32':
	min = -2147483648;
	max = 2147483647;
	break;
    case 'uint32':
	min = 0;
	max = 4294967295;
	break;
    default:
	throw new Error("Type "+precision+" not recognized.");
	break;
    }
    return [max,min];
}