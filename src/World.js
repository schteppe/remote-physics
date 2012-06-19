/**
 * @class World
 * @brief A description of a physics world
 */
M3D.World = function(){
    M3D.EventTarget.call(this); // extend EventTarget
    var that = this;
    var idCount = 0;

    /**
     * @property array bodies
     * @memberof World
     */
    this.bodies = [];

    /**
     * @fn addBody
     * @memberof World
     * @brief Add a body to the simulation
     */
    this.addBody = function(body){
	body.id = idCount++;
	this.bodies.push(body);
    }

    /**
     * @fn clear
     * @memberof World
     * @brief Deletes all bodies
     */
    this.clear = function(){
	this.bodies = [];
	idCount = 0;
    };

    /**
     * @property bool useQuatCompression
     * @memberof World
     * @brief Use 3 values for transferring quats instead of 4
     */
    this.useQuatCompression = true;

    /**
     * @property bool sendVelocities
     * @memberof World
     * @brief Send body velocities from server to client to be able to interpolate
     */
    this.sendVelocities = true;

    /**
     * @property float dt
     * @memberof World
     * @brief timestep
     */
    var dt = this.dt = 1/60;
    this.skip = 3; // How many timesteps to skip per timestep. Set to zero to stream without interpolation

    var w = new M3D.Quat();
    var wq = new M3D.Vec3();

    /**
     * @fn interpolate
     * @memberof World
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


// User interaction messages and the attached data
M3D.World.MOUSEUP   = 0; // Nothing
M3D.World.MOUSEDOWN = 1; // Position, 3 x Float32
M3D.World.MOUSEMOVE = 2; // Position, 3 x Float32
M3D.World.KEYDOWN   = 3; // Key code, 1 x Float32
M3D.World.KEYUP     = 4; // Key code, 1 x Float32
M3D.World.SHOOT     = 5; // Origin +direction, 6 x Float32

/**
 * @class RigidBody
 * @brief Rigid body.
 * @param Shape shape
 */
M3D.RigidBody = function(shape){
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
}

/**
 * @class Shape
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
 * @class Box
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
     * @memberof Box
     */
    this.ex = ex;
    /**
     * @property float ey Half extents in y
     * @memberof Box
     */
    this.ey = ey;
    /**
     * @property float ez Half extents in z
     * @memberof Box
     */
    this.ez = ez;
}

/**
 * @class Sphere
 * @brief Sphere shape.
 * @param float radius
 */
M3D.Sphere = function(radius){
    M3D.Shape.call(this,M3D.Shape.SPHERE);
    /**
     * @property float radius
     * @memberof Sphere
     */
    this.radius = radius;
}

/**
 * @class Cylinder
 * @brief Cylinder shape.
 * @param float radius
 * @param float height
 */
M3D.Cylinder = function(radius,height){
    M3D.Shape.call(this,M3D.Shape.CYLINDER);
    this.radius = radius;
    this.height = height;
}

/**
 * Enumeration of supported shapes.
 */
//M3D.Shape.GROUP = 0; // not yet
M3D.Shape.BOX = 1;
M3D.Shape.CYLINDER = 3;
M3D.Shape.SPHERE = 6;