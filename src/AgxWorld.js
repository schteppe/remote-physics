/**
 * @class M3D.AgxWorld
 * @brief A World being synchronized with Agx.
 * @param string command The command for starting Agx
 * @param Array flags Flags to be passed when starting agx, e.g. ["filename.lua","--agxOnly"]
 * @param RPC.Remote remote
 * @extends M3D.World
 */
M3D.AgxWorld = function(command,flags,remote){
    M3D.World.call(this,remote);
    var that = this;

    var writeToAgx = function(){};
    var writeToAgxCommands = [];

    remote.addEventListener('command',function(e){
	switch(e.command.type){
	case remote.WORLD_STEP:
	    // writeToAgxCommands.push("step"); // dont have to
	    that.stepAgx();
	    break;

	case remote.COLLISION_CREATESHAPE:
	    switch(e.command.shapeType){
	    case M3D.Shape.SPHERE:
		writeToAgxCommands.push("CREATESHAPE "+e.command.shapeType+" "+e.command.id+" "+e.command.radius);
		break;
	    default:
		throw new Error("Shape "+e.command.shapeType+" not implemented yet!");
		break;
	    }
	    break;

	case remote.WORLD_CREATEBODY:    
	    writeToAgxCommands.push("CREATEBODY "+e.command.shapeId+" "+e.command.mass+" "+e.command.id);
	    break;

	case remote.BODY_SETPOSITION:    
	    writeToAgxCommands.push("SETBODYPOSITION "+e.command.id+" "+[e.command.x,e.command.y,e.command.z].join(" "));
	    break;

	default:
	    throw new Error("Marshalling of messages of type "+e.command.type+" not implemented yet");
	    break;
	}
	writeToAgx();
    });

    // events
    var changeEvent = {type:'change'};
    var upgradeEvent = {type:'upgrade'};
    var constructEvent = {type:'construct'};
    var agxStartEvent = {type:'start'};
    var agxEndEvent = {type:'end'};
    var worldBuffer = [];
    var worldJson = null;
    
    /**
     * @fn stepAgx
     * @memberof M3D.AgxWorld
     * @brief Step AgX
     */
    this.stepAgx = function(){
	if(worldBuffer.length>0){
	    var data = worldBuffer.shift();
	    var ids = [],
	    positions = [],
	    quats = [];
	    for(var i=0; i<data.positions.length && i<that.bodies.length; i++){
		var b = that.bodies[i]; 
		data.positions[i].copy(b.position);
		data.quats[i].copy(b.quaternion);
		data.rotVelocities[i].copy(b.rotVelocity);
		data.velocities[i].copy(b.velocity);
		ids.push(b.id);
		positions.push(b.position.x);
		positions.push(b.position.y);
		positions.push(b.position.z);

		quats.push(b.quaternion.x);
		quats.push(b.quaternion.y);
		quats.push(b.quaternion.z);
		quats.push(b.quaternion.w);
	    }
	    remote.exec({type:remote.WORLD_UPDATECOORDS,ids:ids,positions:positions,quats:quats});
	    that.dispatchEvent(changeEvent);
	}
	if(worldBuffer.length<1)
	    writeToAgx();
    };

    /**
     * @fn toJSONString
     * @memberof M3D.AgxWorld
     * @brief Get a JSON representation of the world.
     * @return string
     */
    this.toJSONString = function(){
	// Same as in AgX
	return worldJson;
    };

    /**
     * @fn toJSON
     * @memberof M3D.AgxWorld
     * @brief Get a JSON representation of the world.
     * @return Object
     */
    this.toJSON = function(){
	return JSON.parse(worldJson);
    }

    /*
    var compressedQuat = new M3D.Vec3();
    this.toBuffer = function(){
	// Compose world data buffer
	var n = 7; // pos(3) + quat(4)
	if(this.sendVelocities)
	    n += 6; // add rot & lin velos
	if(this.useQuatCompression)
	    n -= 1; // remove fourth quat number
	var buf = new Buffer(n*4*this.bodies.length);
	for(var i=0; i<this.bodies.length; i++){
	    var b = this.bodies[i];
	    var p = b.position;
	    var q = b.quaternion;
	    var v = b.velocity;
	    var w = b.rotVelocity;

	    // 3 floats for position (vec3)
	    if(isNaN(p.x) || isNaN(p.y) || isNaN(p.z) ){
		//console.log("NaN position discovered for body "+i+":", p);
		p.x = p.y = p.z = 0;
	    }
	    buf.writeFloatLE(p.x, n*4*i + 0*4);
	    buf.writeFloatLE(p.y, n*4*i + 1*4);
	    buf.writeFloatLE(p.z, n*4*i + 2*4);

	    // 4 for orientation (quaternion)
	    if(isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w) ){
		//console.log("NaN quaternion discovered for body "+i+":",q);
		q.x = q.y = q.z = q.w = 0;
	    }
	    var tell;
	    if(this.useQuatCompression){
		q.compress(compressedQuat);
		buf.writeFloatLE(compressedQuat.x, n*4*i + 3*4);
		buf.writeFloatLE(compressedQuat.y, n*4*i + 4*4);
		buf.writeFloatLE(compressedQuat.z, n*4*i + 5*4);
		tell = n*4*i + 6*4;
	    } else {
		buf.writeFloatLE(q.x, n*4*i + 3*4);
		buf.writeFloatLE(q.y, n*4*i + 4*4);
		buf.writeFloatLE(q.z, n*4*i + 5*4);
		buf.writeFloatLE(q.w, n*4*i + 6*4);
		tell = n*4*i + 7*4;
	    }
	    
	    // Velocities?
	    if(this.sendVelocities){
		buf.writeFloatLE(v.x, tell+0*4);
		buf.writeFloatLE(v.y, tell+1*4);
		buf.writeFloatLE(v.z, tell+2*4);
		buf.writeFloatLE(w.x, tell+3*4);
		buf.writeFloatLE(w.y, tell+4*4);
		buf.writeFloatLE(w.z, tell+5*4);
	    }
	}
	return buf;
    };
    */

    /*
      // @todo move to command event of remote
    this.handleBufferMessage = function(buf){
	// Move joint
	var eventType = parseInt(buf.readFloatLE(0));
	switch(eventType){
	case M3D.World.MOUSEUP:
	    writeToAgxCommands.push("mouseup");
	    break;
	case M3D.World.MOUSEDOWN:
	    var x = buf.readFloatLE(4),
	    y = buf.readFloatLE(8),
	    z = buf.readFloatLE(12),
	    bodyNumber = buf.readFloatLE(16);
	    writeToAgxCommands.push("mousedown "+[x,y,z,bodyNumber].join(" "));
	    break;
	case M3D.World.MOUSEMOVE:
	    var x = buf.readFloatLE(4),
	    y = buf.readFloatLE(8),
	    z = buf.readFloatLE(12);
	    writeToAgxCommands.push("mousemove "+[x,y,z].join(" "));
	    break;
	case M3D.World.KEYDOWN:
	    var keyCode = parseInt(buf.readFloatLE(4));
	    writeToAgxCommands.push("keydown "+keyCode);
	    break;
	case M3D.World.KEYUP:
	    var keyCode = parseInt(buf.readFloatLE(4));
	    writeToAgxCommands.push("keyup "+keyCode);
	    break;
	default:
	    throw new Error("Could not apply command type="+eventType);
	    break;
	}
    }
    */

    var spawn = require('child_process').spawn;
    var exec = require('child_process').exec;
    var fs = require("fs");
    var path = require('path');

    var agx = spawn(command, flags);
    
    // Create fifos for AgX communication
    var inpipe = "/tmp/agxin"+agx.pid;
    var outpipe = "/tmp/agxout"+agx.pid;
    console.log("Creating fifos "+inpipe+" and "+outpipe+"...");
    if(path.existsSync(inpipe))
	exec("rm "+inpipe);
    if(path.existsSync(outpipe))
	exec("rm "+outpipe);
    exec("mkfifo "+inpipe);
    exec("mkfifo "+outpipe);

    var killed = false;
    var toAgxPipe=false, fromAgxPipe=false;

    // Agx exit
    agx.on('exit',function(code){
	that.dispatchEvent(agxEndEvent);
    });

    // Errors
    agx.stderr.on('data', function (data) {
	console.log("AgX stderr: ---> "+data.toString()+" <--- ");
    });

    /**
     * @fn destruct
     * @memberof M3D.AgxWorld
     * @brief Kills the external AgX process
     */
    this.destruct = function(){
	agx.kill('SIGHUP');
	killed = true;
    };

    // Agx data
    agx.stdout.on('data', function (data) {
	if(!toAgxPipe) { // We only want to add these once
	    toAgxPipe = true;

	    that.dispatchEvent(agxStartEvent);

	    var lastWriteToAgx = new Date().getTime();

	    // Agx outputs info when started.
	    var wrote = false;
	    fs.open(inpipe,"w",function(err,fd){
		if(err) throw err;
		var t = 0.0;
		writeToAgx = function(callback){
		    writeToAgxCommands.push("step");
		    var out = writeToAgxCommands.join("|")+"\n";
		    //console.log("writing "+out+" to agx");
		    if(!killed)
			fs.writeSync(fd,out);
		    writeToAgxCommands = [];
		    wrote = true;
		    callback && callback();
		};
		writeToAgx();
	    });
	    
	    // Read from agx
	    var rs = fs.createReadStream(outpipe);
	    var chunk = "";
	    rs.on('data', function(data){
		chunk += data.toString();
		var index = chunk.indexOf("\n");
		if(index!=-1){
		    handleChunk(chunk.substring(0,index));
		    chunk = chunk.substring(index+1);
		}
	    });

	    var constructed = false;
	    function handleChunk(s){
		//console.log("Got "+s+" from agx");
		var sent = false;
		if(s[0] == "["){
		    // Got JSON list of body data
		    worldJson = s;
		    //that.updateWorldFromJSON(JSON.parse(s));
		    that.dispatchEvent(upgradeEvent);
		    if(!constructed)
			that.dispatchEvent(constructEvent);
			
		} else {
		    var rows = s.split("|");
		    var positions = [];
		    var quats = [];
		    var velocities = [];
		    var rotVelocities = [];
		    
		    var n = 7; // numbers per row: x, y, z, qx qy qz qw
		    if(that.sendVelocities)
			n = 13; // 6 extra:  wx, wy, wz, vx vy vz

		    for(var j=0; j<rows.length && rows[j]!="\n" && rows[j]!=""; j++){
			var nums = rows[j].split(" ");
			if(nums.length!=n)
			    console.log("Num rows: "+rows.length + "... Row format wrong? Row:",rows[j]);
			for(var i=0; i<nums.length && !isNaN(Number(nums[i])) && nums[i]!="\n"; i+=n){
			    positions.push(new M3D.Vec3(Number(nums[i]),
							Number(nums[i+1]),
							Number(nums[i+2])));
			    quats.push(new M3D.Quat(Number(nums[i+3]),
						    Number(nums[i+4]),
						    Number(nums[i+5]),
						    Number(nums[i+6])));
			    if(that.sendVelocities){
				velocities.push(new M3D.Vec3(Number(nums[i+7]),
							     Number(nums[i+8]),
							     Number(nums[i+9])));
				rotVelocities.push(new M3D.Vec3(Number(nums[i+10]),
								Number(nums[i+11]),
								Number(nums[i+12])));
			    }
			}
		    }

		    if(positions.length){
			// save positions and quats
			world = {};
			world.positions = positions;
			world.quats = quats;
			world.velocities = velocities;
			world.rotVelocities = rotVelocities;
			worldBuffer.push(world);
			sent = true;
		    }
		}

		if(sent){
		    // Every time we write to Agx it will step. Therefore, add some delay
		    var delay = 1000*that.dt - (new Date().getTime() - lastWriteToAgx);
		    lastWriteToAgx = new Date().getTime();
		    if(delay<0) delay=0;
		}
	    }
	}
	if(true)
	    console.log("AgX stdout: ---> "+data.toString()+ " <--- ");
    }); 
};

M3D.AgxWorld.prototype = new M3D.World();