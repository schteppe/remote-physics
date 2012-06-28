/**
 * @class M3D.World
 * @brief A description of a physics world
 * @param RPC.Remote remote
 */
M3D.World = function(remote){
    M3D.EventTarget.call(this); // extend EventTarget
    var that = this;
    var idCount = 0;

    /**
     * @property RPC.Remote remote
     * @memberof M3D.World
     * @brief A remote sync RPC object
     */
    this.remote = remote;
    if(remote){
	remote.addEventListener('command',function(e){
	    switch(e.command.type){
	    case remote.COLLISION_CREATESHAPE:
		switch(e.command.shapeType){
		case M3D.Shape.SPHERE:
		    var s = new M3D.Sphere(e.command.radius);
		    s.id = e.command.id;
		    break;
		default:
		    throw new Error("Could not recognize shape type: "+e.command.shapeType);
		    break;
		}
		that.shapes.push(s);
		break;

	    case remote.WORLD_CREATEBODY:
		var rb = new M3D.RigidBody(that.getShapeById(e.command.shapeId),
					   e.command.mass);
		rb.id = e.command.id;
		that.bodies.push(rb);
		break;

	    case remote.BODY_SUBSCRIBE:
		that.getRigidBodyById(e.command.id).sync = true;
		break;

	    case remote.BODY_UNSUBSCRIBE:
		that.getRigidBodyById(e.command.id).sync = false;
		break;

	    case remote.BODY_SETPOSITION:
		console.log(e.command);
		var p = that.getRigidBodyById(e.command.id).position;
		p.x = e.command.x;
		p.y = e.command.y;
		p.z = e.command.z;
		break;

	    case remote.WORLD_STEP:
		// Cannot do much about this command here.
		// Implement in subclasses!
		break;

	    case remote.WORLD_UPDATECOORDS:
		// Update all body positions
		var positions = e.command.positions;
		var ids = e.command.ids;
		var quats = e.command.quats;
		for(var i=0; i<ids.length; i++){
		    var id = ids[i],
		    x = positions[3*i],
		    y = positions[3*i+1],
		    z = positions[3*i+2],
		    qx = quats[4*i],
		    qy = quats[4*i+1],
		    qz = quats[4*i+2],
		    qw = quats[4*i+3];
		    var rb = that.getRigidBodyById(id);
		    if(!rb)
			throw new Error("Rigid body id="+id+" not found");
		    rb.position.x = x;
		    rb.position.y = y;
		    rb.position.z = z;
		    rb.quaternion.x = qx;
		    rb.quaternion.y = qy;
		    rb.quaternion.z = qz;
		    rb.quaternion.w = qw;
		}
		that.dispatchEvent({type:"update"});
		break;

	    default:
		console.log("Could not recognize command: ",e.command);
		break;
	    }
	});
    }

    /**
     * @property Array bodies
     * @memberof M3D.World
     */
    this.bodies = [];
    /**
     * @property array shapes
     * @memberof M3D.World
     */
    this.shapes = [];
    
    /**
     * @fn array getShapeById
     * @memberof M3D.World
     */
    this.getShapeById = function(id){
	for(var i=0; i<this.shapes.length; i++)
	    if(this.shapes[i].id == id)
		return this.shapes[i];
    }
    
    /**
     * @fn array getRigidBodyById
     * @memberof M3D.World
     */
    this.getRigidBodyById = function(id){
	for(var i=0; i<this.bodies.length; i++)
	    if(this.bodies[i].id == id)
		return this.bodies[i];
    }

    /**
     * @fn clear
     * @memberof M3D.World
     * @brief Deletes all bodies
     */
    this.clear = function(){
	this.bodies = [];
	idCount = 0;
    };

    /**
     * @fn createSphereShape
     * @memberof M3D.World
     * @param float radius
     */
    this.createSphereShape = function(radius){
	var s = new M3D.Sphere(radius);
	s.remote = this.remote;
	s.id = idCount++;
	var m = {
	    type : remote.COLLISION_CREATESHAPE,
	    id : s.id,
	    shapeType : M3D.Shape.SPHERE,
	    radius : radius
	};
	this.remote.exec(m);
	return s;
    };

    /**
     * @fn step
     * @memberof M3D.World
     * @param float dt
     * @param function callback
     */
    this.step = function(dt,callback){
	this.remote.exec({type:remote.WORLD_STEP,dt:dt},callback);
    };

    /**
     * @fn createRigidBody
     * @memberof M3D.World
     * @param M3D.Shape shape
     * @param float mass
     */
    this.createRigidBody = function(shape,mass){
	var r = new M3D.RigidBody(shape,mass);
	r.id = idCount++;
	r.remote = this.remote;
	this.bodies.push(r);
	this.remote.exec({type:remote.WORLD_CREATEBODY,id:r.id,shapeId:shape.id,mass:mass});
	this.dispatchEvent({type:'change'});
	return r;
    };

    /**
     * @fn setAllBodyCoordinates
     * @memberof M3D.World
     * @brief Sets all body coordinates (quats and positions)
     * @param array ids
     * @param array positions
     * @param array quats
     */
    this.setAllBodyCoordinates = function(ids,positions,quats){
	var changed = []; // So we can keep track of bodies that changed position
	for(var i=0; i<ids.length; i++){
	    var id = ids[i],
	    x = positions[3*i],
	    y = positions[3*i+1],
	    z = positions[3*i+2],
	    qx = quats[4*i],
	    qy = quats[4*i+1],
	    qz = quats[4*i+2],
	    qw = quats[4*i+3];
	    var rb = this.getRigidBodyById(id);
	    if(rb.sync &&
	       (rb.position.x != x || 
		rb.position.y != y || 
		rb.position.z != z ||
		rb.quaternion.x != qx || 
		rb.quaternion.y != qy || 
		rb.quaternion.z != qz || 
		rb.quaternion.w != qw))
		changed.push(true);
	    else
		changed.push(false);

	    // Set local
	    rb.position.x = x;
	    rb.position.y = y;
	    rb.position.z = z;

	    rb.quaternion.x = x;
	    rb.quaternion.y = y;
	    rb.quaternion.z = z;
	    rb.quaternion.w = w;
	}
	// Set remote
	remote.exec({type:remote.WORLD_UPDATECOORDS,positions:positions,quats:quats,ids:ids});
    };

    /**
     * @property bool useQuatCompression
     * @memberof M3D.World
     * @brief Use 3 values for transferring quats instead of 4
     */
    this.useQuatCompression = true;

    /**
     * @property bool sendVelocities
     * @memberof M3D.World
     * @brief Send body velocities from server to client to be able to interpolate
     */
    this.sendVelocities = true;

    /**
     * @property float dt
     * @memberof M3D.World
     * @brief timestep
     */
    var dt = this.dt = 1/60;

    /**
     * @property int skip
     * @memberof M3D.World
     * @brief How many timesteps to skip per timestep. Set to zero to stream without interpolation
     */
    this.skip = 3;

    var w = new M3D.Quat();
    var wq = new M3D.Vec3();

    /**
     * @fn interpolate
     * @memberof M3D.World
     * @brief Steps the system by using the current timestep and body velocities. Can with advantage be used in between server-to-client messages to make the simulation look more smooth on the client.
     */
    this.interpolate = function(){
	for(var i in that.bodies){
	    var b = that.bodies[i];
	    b.position.x += b.velocity.x * dt;
	    b.position.y += b.velocity.y * dt;
	    b.position.z += b.velocity.z * dt;
	    
	    w.set(b.rotVelocity.x,
		  b.rotVelocity.y,
		  b.rotVelocity.z,
		  0);
	    w.mult(b.quaternion,wq);
	    
	    b.quaternion.x += dt * 0.5 * wq.x;
	    b.quaternion.y += dt * 0.5 * wq.y;
	    b.quaternion.z += dt * 0.5 * wq.z;
	    b.quaternion.w += dt * 0.5 * wq.w;
	    b.quaternion.normalize();
	}
    };
}

/*
M3D.World.prototype.updateWorldFromJSON = function(json){
    var that = this;
    // Remove old bodies
    that.bodies = [];
    // Add new
    for(var i=0; i<json.length; i++){
	var b = createBodyFromJSON(json[i]);
	that.addBody(b);
    };

    function createBodyFromJSON(json){
	var body;
	// todo loop over geometries
	json = json.shapes[0];
	switch(json.type){
	case M3D.Shape.BOX:
	    var extents = json.halfExtents;
	    var boxShape = new M3D.Box(extents[0], extents[1], extents[2]);
	    body = new M3D.RigidBody( boxShape );
	    break;
	case M3D.Shape.SPHERE:
	    var sphereShape = new M3D.Sphere( json.radius );
	    body = new M3D.RigidBody( sphereShape );
	    break;
	case M3D.Shape.CYLINDER:
	    var cylinderShape = new M3D.Cylinder( json.radius, json.height );
	    body = new M3D.RigidBody( cylinderShape );
	    break;
	default:
	    throw new Error("No rendering shape inside json (got type="+json.type+")!");
	    break;
	}
	return body;
    }
}
*/

/**
 * @class M3D.RigidBody
 * @brief Rigid body.
 * @param M3D.Shape shape
 */
M3D.RigidBody = function(shape,mass){
    /**
     * @property int id
     * @memberof RigidBody
     */
    this.id = -1;

    /**
     * @property Shape shape
     * @memberof RigidBody
     */
    this.shape = shape;

    /**
     * @property Vec3 position
     * @memberof RigidBody
     */
    this.position = new M3D.Vec3();

    /**
     * @property Quat quaternion
     * @memberof RigidBody
     */
    this.quaternion = new M3D.Quat();

    /**
     * @property Vec3 velocity
     * @memberof RigidBody
     */
    this.velocity = new M3D.Vec3();

    /**
     * @property Vec3 rotVelocity
     * @memberof RigidBody
     */
    this.rotVelocity = new M3D.Vec3();

    /**
     * @property RPC.Remote remote
     * @memberof RigidBody
     * @brief Remote sync object
     */
    this.remote = null;
    /**
     * @property bool sync
     * @memberof RigidBody
     */
    this.sync = true;

    /**
     * @fn setAutoUpdate
     * @memberof RigidBody
     * @param bool autoUpdate
     */
    this.setAutoUpdate = function(autoUpdate){
	if(this.sync != autoUpdate){
	    this.sync = autoUpdate;
	    if(autoUpdate)
		this.remote.exec({type:this.remote.BODY_SUBSCRIBE,id:this.id});
	    else
		this.remote.exec({type:this.remote.BODY_UNSUBSCRIBE,id:this.id});
	}
    };

    /**
     * @fn setPosition
     * @memberof RigidBody
     * @param float x
     * @param float y
     * @param float z
     */
    this.setPosition = function(x,y,z){
	console.log("set pos of "+this.id);
	this.remote.exec({type:this.remote.BODY_SETPOSITION,
			  id:this.id,
			  x:x,
			  y:y,
			  z:z});
    };
}

/**
 * @class M3D.Shape
 * @brief Base class for shapes.
 * @param int type
 */
M3D.Shape = function(type){
    /**
     * @property int type
     * @memberof Shape
     */
    this.type = type;
}

/**
 * @class M3D.Box
 * @brief Box shape.
 * @param float ex Half-extents in x.
 * @param float ey Half-extents in y.
 * @param float ez Half-extents in z.
 * @extends Shape
 */
M3D.Box = function(ex,ey,ez){
    M3D.Shape.call(this,M3D.Shape.BOX);

    /**
     * @property float ex Half extents in x
     * @memberof M3D.Box
     */
    this.ex = ex;
    /**
     * @property float ey Half extents in y
     * @memberof M3D.Box
     */
    this.ey = ey;
    /**
     * @property float ez Half extents in z
     * @memberof M3D.Box
     */
    this.ez = ez;
}

/**
 * @class M3D.Sphere
 * @brief Sphere shape.
 * @param float radius
 */
M3D.Sphere = function(radius){
    M3D.Shape.call(this,M3D.Shape.SPHERE);
    /**
     * @property float radius
     * @memberof M3D.Sphere
     */
    this.radius = radius;
}

/**
 * @class M3D.Cylinder
 * @brief Cylinder shape.
 * @param float radius
 * @param float height
 */
M3D.Cylinder = function(radius,height){
    M3D.Shape.call(this,M3D.Shape.CYLINDER);

    /**
     * @property float radius
     * @memberof M3D.Cylinder
     */
    this.radius = radius;
    /**
     * @property float height
     * @memberof M3D.Cylinder
     */
    this.height = height;
}

/**
 * Enumeration of supported shapes.
 */
//M3D.Shape.GROUP = 0; // not yet
M3D.Shape.BOX = 1;
M3D.Shape.CYLINDER = 3;
M3D.Shape.SPHERE = 6;