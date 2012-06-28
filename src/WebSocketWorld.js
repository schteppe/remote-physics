/**
 * @class WebSocketWorld
 * @brief A World being synchronized over a network
 * @param string socketUrl
 */
M3D.WebSocketWorld = function(socketUrl){

    // Mouse drag things
    var last = 0; // Time when the mouse position was last sent
    var lastx = 0, lasty = 0;
    var mousedown = false;
    var dt = 1/60; // framerate

    var that = this;

    // Stats
    this.upStats = new M3D.TimeStats(100);
    this.downStats = new M3D.TimeStats(100);
    this.messageCountStats = new M3D.TimeStats(100);

    // events
    var openEvent = {type:'opensocket'};
    var closeEvent = {type:'closesocket'};
    var updateEvent = {type:'update'}; // if bodies moved
    var changeEvent = {type:'change'}; // if bodies were added/removed

    var ws = new WebSocket(socketUrl);

    var remote = new RPC.Remote(ws);
    M3D.World.call(this,remote);

    // Open / close socket
    ws.onopen = function(){
	that.dispatchEvent(openEvent);
    };
    ws.onclose = function(){
	that.dispatchEvent(closeEvent);
    };

    /*
    function updateWorldFromBuffer(buf){
	var a = new Float32Array(buf);
	// Read position data
	var n = 7;
	if(that.useQuatCompression)
	    n -= 1;
	if(that.sendVelocities)
	    n += 6;
	for(var i=0; i<a.length/n && that.bodies[i]; i++){
	    var p = that.bodies[i].position;
	    var q = that.bodies[i].quaternion;
	    var v = that.bodies[i].velocity;
	    var w = that.bodies[i].rotVelocity;
	    p.set(a[n*i+0],
		  a[n*i+1],
		  a[n*i+2]);
	    var tell;
	    if(that.useQuatCompression){
		q.uncompress(new M3D.Vec3(a[n*i+3],
					  a[n*i+4],
					  a[n*i+5]));
		tell = n*i + 6;
	    } else {
		q.set(a[7*i+3],
		      a[7*i+4],
		      a[7*i+5],
		      a[7*i+6]);
		tell = n*i + 7;
	    }
	    if(that.sendVelocities){
		v.set(a[tell+0],
		      a[tell+1],
		      a[tell+2]);
		
		w.set(a[tell+3],
		      a[tell+4],
		      a[tell+5]);
	    }
	}
    }

    var send_buf = new ArrayBuffer(5*4); // x,y,z,mouseState,body_nr
    var send_array = new Float32Array(send_buf);
    function send(x,y,z,state,bodyNumber){
	if(ws.readyState == 1){
	    send_array[0] = x;
	    send_array[1] = y;
	    send_array[2] = z;
	    send_array[3] = state;
	    send_array[4] = bodyNumber;
	    ws.send(send_buf);
	    that.upStats.accumulate(send_buf.byteLength);
	}
    }
    
    function sendBuffer(buffer){
	if(!(buffer instanceof ArrayBuffer)){
	    throw new Error("Argument buffer must be ArrayBuffer");
	    return;
	}
	ws.send(buffer);
	that.upStats.accumulate(buffer.byteLength);
    }

    // Allocate buffers @todo make better file format using slimmer datatypes
    var f1buf = new ArrayBuffer(1*4); // 1-float32-buffer
    var f1arr = new Float32Array(f1buf);
    var f2buf = new ArrayBuffer(2*4); // 2-float32-buffer
    var f2arr = new Float32Array(f2buf);
    var f4buf = new ArrayBuffer(4*4); // 4-float32-buffer
    var f4arr = new Float32Array(f4buf);
    var f5buf = new ArrayBuffer(5*4); // 5-float32-buffer
    var f5arr = new Float32Array(f5buf);
    function sendMouseDown(x,y,z,bodyNumber){
	f5arr[0] = M3D.World.MOUSEDOWN;
	f5arr[1] = x;
	f5arr[2] = y;
	f5arr[3] = z;
	f5arr[4] = bodyNumber;
	sendBuffer(f5buf);
    }
    function sendMouseMove(x,y,z){
	f4arr[0] = M3D.World.MOUSEMOVE;
	f4arr[1] = x;
	f4arr[2] = y;
	f4arr[3] = z;
	sendBuffer(f4buf);
    }
    function sendMouseUp(){
	f1arr[0] = M3D.World.MOUSEUP;
	sendBuffer(f1buf);
    }
    function sendKeyDown(keyCode){
	f2arr[0] = M3D.World.KEYDOWN;
	f2arr[1] = keyCode;
	sendBuffer(f2buf);
    }
    function sendKeyUp(keyCode){
	f2arr[0] = M3D.World.KEYUP;
	f2arr[1] = keyCode;
	sendBuffer(f2buf);
    }*/

    var messageCount = 0;
    /*ws.onmessage = function(e){
	that.messageCountStats.accumulate(1);
	messageCount++;
	if(e.data && e.data instanceof Blob){
	    // Update transforms. Need a filereader to read the fetched binary blob
	    var fr = new FileReader();
	    fr.onload = function(f){
		that.downStats.accumulate(fr.result.byteLength);
		//updateWorldFromBuffer(fr.result);
		that.dispatchEvent(updateEvent);

		// If skipping is on, schedule interpolation
		for(var i=0; i<that.skip; i++){
		    setTimeout(function(){
			that.interpolate();
			that.dispatchEvent(updateEvent);
		    },1000 * that.dt * (i + 1));
		}
	    } 
	    fr.readAsArrayBuffer(e.data);
	} else if(typeof e.data == "string"){
	    // We got a world description in JSON. Parse it.
	    try {
	    var world = JSON.parse(e.data); // .match(/\[.*\]/)
	    } catch(err){
		console.log(e.data);
		throw err;
	    }
	    that.updateWorldFromJSON(world);
	    that.dispatchEvent(changeEvent);
	}
	};
    */

    /*
    this.addMouseJoint = function(body,point){
	sendMouseDown(point.x, point.y, point.z,body.id);
    };

    this.removeMouseJoints = function(){
	sendMouseUp();
    };

    this.moveMouseJoint = function(point){
	sendMouseMove(point.x,
		      point.y,
		      point.z);
    };
this.keyDown = function(keyCode){
	sendKeyDown(keyCode);
    };

    this.keyUp = function(keyCode){
	sendKeyUp(keyCode);
    };

    this.shootShape = function(origin,direction){
	
    }*/
};

M3D.WebSocketWorld.prototype = new M3D.World();