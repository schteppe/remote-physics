(function(){

M3D = {};/**
 * @class Vec3
 * @brief Vector class.
 */
M3D.Vec3 = function(x,y,z){
    /**
     * @property float x
     * @memberof Vec3
     */
    this.x = x===undefined ? 0 : x;

    /**
     * @property float y
     * @memberof Vec3
     */
    this.y = y===undefined ? 0 : y;

    /**
     * @property float z
     * @memberof Vec3
     */
    this.z = z===undefined ? 0 : z;

    /**
     * @fn set
     * @memberof Vec3
     * @param float x
     * @param float y
     * @param float z
     */
    this.set = function(x,y,z){
	this.x=x;
	this.y=y;
	this.z=z;
    }

    this.dot = function(v){
	return this.x*v.x + this.y*v.y + this.z*v.z;
    }

    /**
     * @fn cross
     * @memberof CANNON.Vec3
     * @brief Vector cross product
     * @param CANNON.Vec3 v
     * @param CANNON.Vec3 target Optional. Target to save in.
     * @return CANNON.Vec3
     */
    this.cross = function(v,target){
	target = target || new M3D.Vec3();
	var A = [this.x, this.y, this.z];
	var B = [v.x, v.y, v.z];
	
	target.x = (A[1] * B[2]) - (A[2] * B[1]);
	target.y = (A[2] * B[0]) - (A[0] * B[2]);
	target.z = (A[0] * B[1]) - (A[1] * B[0]);

	return target;
    };

    this.copy = function ( target ) {
	target.x = this.x;
	target.y = this.y;
	target.z = this.z;
    }

    this.toString = function(){
	return "("+[this.x,this.y,this.z].join(",")+")";
    };
}/**
 * @class Quat
 * @brief Quaternion class.
 */
M3D.Quat = function(x,y,z,w){
    /**
     * @property float x
     * @memberof Quat
     */
    this.x = x===undefined ? 0 : x;
    /**
     * @property float y
     * @memberof Quat
     */
    this.y = y===undefined ? 0 : y;
    /**
     * @property float z
     * @memberof Quat
     */
    this.z = z===undefined ? 0 : z;
    /**
     * @property float w
     * @memberof Quat
     */
    this.w = w===undefined ? 1 : w;
    /**
     * @fn set
     * @memberof Quat
     * @param float x
     * @param float y
     * @param float z
     * @param float w
     */
    this.set = function(x,y,z,w){
	this.x=x;
	this.y=y;
	this.z=z;
	this.w=w;
    }

    /**
     * @fn compress
     * @memberof Quat
     * @brief Compress a quaternion into a Vec3. Assumes this quaternion is normalized!
     * @param Vec3 target
     * @see http://www.gamedev.net/topic/461253-compressed-quaternions/
     */
    this.compress = function(target){
	var x = this.x, y = this.y, z = this.z, w = this.w;
	if(Math.abs(w)<1e-6){
	    target.x = x*1e6;
	    target.y = y*1e6;
	    target.z = z*1e6;
	} else {
	    target.x = x/w;
	    target.y = y/w;
	    target.z = z/w;
	}
    }

    /**
     * @fn uncompress
     * @memberof Quat
     * @brief Uncompress a quaternion from a Vec3.
     * @param Vec3 from
     * @see http://www.gamedev.net/topic/461253-compressed-quaternions/
     */
    this.uncompress = function(from){
	var xw = from.x, yw = from.y, zw = from.z;
/*	if(Math.abs(xw)<1e-6 &&
	   Math.abs(yw)<1e-6 && 
	   Math.abs(zw)<1e-6){
	    this.x = 0;
	    this.y = 0;
	    this.z = 0;
	    this.w = 1;
	} else {*/
	    var w = this.w = 1.0 / Math.sqrt( 1 + xw*xw + yw*yw + zw*zw  );
	    this.x = xw*w;
	    this.y = yw*w;
	    this.z = zw*w;
    //}
    }

    /**
     * @fn normalize
     * @memberof CANNON.Quaternion
     * @brief Normalize the quaternion. Note that this changes the values of the quaternion.
     */
    this.normalize = function(){
	var l = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);
	if ( l === 0 ) {
	    this.x = 0;
	    this.y = 0;
	    this.z = 0;
	    this.w = 1;
	} else {
	    l = 1 / l;
	    this.x *= l;
	    this.y *= l;
	    this.z *= l;
	    this.w *= l;
	}
    };


    /**
     * @fn mult
     * @memberof Quat
     * @brief Quaternion multiplication
     * @param Quat q
     * @param Quat target Optional.
     * @return Quat
     */ 
    var va = new M3D.Vec3();
    var vb = new M3D.Vec3();
    this.mult = function(q,target){
	if(target==undefined)
	    target = new M3D.Quaternion();
	va.set(this.x,this.y,this.z);
	vb.set(q.x,q.y,q.z);
	target.w = this.w*q.w - va.dot(vb);
	vaxvb = va.cross(vb);
	target.x = this.w * vb.x + q.w*va.x + vaxvb.x;
	target.y = this.w * vb.y + q.w*va.y + vaxvb.y;
	target.z = this.w * vb.z + q.w*va.z + vaxvb.z;
	return target;
    };

    this.copy = function ( target ) {
	target.x = this.x;
	target.y = this.y;
	target.z = this.z;
	target.w = this.w;
    }
}/**
 * @class Renderer
 * @brief Render the scene
 * @param World world
 */
M3D.Renderer = function(world){
    var that = this;

    // Global settings
    this.sphere_geometry = new THREE.SphereGeometry( 0.1, 8, 8);

    this.meshes = [];
    this.paused = false;
    this.shadowsOn = true;
    this.clickMarker = null;
    this.mouseCenter = new THREE.Vector3(0,0,0);

    // Material
    this.solidMaterial = new THREE.MeshLambertMaterial( { color: 0xdddddd } );
    this.markerMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    THREE.ColorUtils.adjustHSV( this.solidMaterial.color, 0, 0, 0.9 );

    /**
     * @property World world
     * @memberof Renderer
     */
    this.world = world;
    /**
     * @property float dt
     * @memberof Renderer
     */
    this.dt = 1/60;

    // Events
    world.addEventListener("change",function(){
	that.rebuildScene();
    });
    world.addEventListener("update",function(){
	that.updateVisuals();
    });
};

/**
 * @fn setClickMarker
 * @memberof Renderer
 * @brief Set the position of a red pick marker in the scene.
 * @param float x
 * @param float y
 * @param float z
 */
M3D.Renderer.prototype.setClickMarker = function(x,y,z){
    var mesh;
    if(!this.clickMarker){
	mesh = new THREE.Mesh(this.sphere_geometry, this.markerMaterial);
	this.clickMarker = mesh;
    } else 
	mesh = this.clickMarker;
    mesh.position.set(x,y,z);
    this.three_scene.add(mesh);
};


/**
 * @fn removeClickMarker
 * @memberof Renderer
 * @brief Remove the click marker from the scene if there is one.
 */
M3D.Renderer.prototype.removeClickMarker = function(){
    this.three_scene.remove(this.clickMarker);
};

function screenToWorld(screenPos,windowHalfX,windowHalfY,camera){
    var projector = new THREE.Projector();
    var worldPos = screenPos.clone();
    worldPos.x = worldPos.x / windowHalfX - 1;
    worldPos.y = - worldPos.y / windowHalfY + 1;
    projector.unprojectVector( worldPos, camera );
    return worldPos;
}

M3D.Renderer.prototype.getRay = function(screenX,screenY){
    var from = screenToWorld(new THREE.Vector3(screenX,screenY,0.5),
			     window.innerWidth / 2,
			     window.innerHeight / 2,
			     this.camera
			    );
    var dir = new THREE.Vector3();
    dir.x = from.x - this.camera.position.x;
    dir.y = from.y - this.camera.position.y;
    dir.z = from.z - this.camera.position.z;
    dir.normalize();
    return new THREE.Ray(from,dir);
};

/**
 * @fn Use in MouseEvents to click the screen and get the 3D point that you clicked on.
 * @memberof Renderer
 * @param MouseEvent e
 * @param Array targets Optional. If given an array of THREE.Mesh objects it will check against those. @todo: work with RigidBody objects instead.
 * @return Object An object with properties: body, point @todo make a class for this?
 */
M3D.Renderer.prototype.clickTest = function(e,targets){
    targets = targets || this.meshes;
    var from = screenToWorld(new THREE.Vector3(e.pageX,e.pageY,0.5),
			     window.innerWidth / 2,
			     window.innerHeight / 2,
			     this.camera
			    );
    var dir = new THREE.Vector3();
    dir.x = from.x - this.camera.position.x;
    dir.y = from.y - this.camera.position.y;
    dir.z = from.z - this.camera.position.z;
    dir.normalize();
    var ray = new THREE.Ray(from,dir);
    var hits = ray.intersectObjects(targets);
    if(hits.length){

	var hit = hits[0];
	hit.direction = dir;

	// Find body index
	var index = -1;
	for(var i=0; i<this.meshes.length; i++)
	    if(hit.object.id == this.meshes[i].id)
		index = i+0;
	if(index>=0)
	    hit.body = this.world.bodies[index];

	return hit;
    }
    return false;
}

/**
 * @fn setScreenPerpCenter
 * @memberof Renderer
 * @brief For making mouse movement in a plane perpendicular to the camera direction. Set the starting point.
 * @param Vec3 point
 */
M3D.Renderer.prototype.setScreenPerpCenter = function(point){
    this.mouseCenter = hit.point;
    if(!this.plane){
	// Screen perp
	var planeContainer = this.planeContainer = new THREE.Object3D();
	var planeGeo = new THREE.PlaneGeometry(40,40);
	var plane = this.plane = new THREE.Mesh(planeGeo,this.solidMaterial);
	plane.visible = false; // Hide it..
	planeContainer.useQuaternion = true;
	planeContainer.add(plane);
	plane.rotation.x = Math.PI / 2;
	this.three_scene.add(planeContainer);
    }

    // Center at mouse position
    this.planeContainer.position.set(this.mouseCenter.x,
				     this.mouseCenter.y,
				     this.mouseCenter.z);
    // Make it face toward the camera
    this.planeContainer.quaternion.setFromRotationMatrix(this.camera.matrixWorld);
};

/**
 * @fn moveScreenPerp
 * @memberof Renderer
 * @brief Move the plane movement point in the plane defined using setScreenPerpCenter().
 * @param MouseEvent e
 * @return Vec3 The new point in the plane.
 */
M3D.Renderer.prototype.moveScreenPerp = function(e){
    var x = e.pageX;
    var y = e.pageY;
    var now = new Date().getTime();
    // Take it easy with updating...
    if(mousedown && (now-last)>this.dt*1000 && !(lastx==x && lasty==y)){
	
	// project mouse to that plane
	var hit = this.clickTest(e,[this.plane]);
	lastx = x;
	lasty = y;
	last = now;
	if(hit)
	    return hit.point;
    }
};

/**
 * @fn start
 * @memberof Renderer
 * @brief Start the rendering of the scene.
 */
M3D.Renderer.prototype.start = function(){

    var that = this;
    this.currentStepNumber = 0;

    if ( ! Detector.webgl )
	Detector.addGetWebGLMessage();
    
    this.SHADOW_MAP_WIDTH = 1024;
    this.SHADOW_MAP_HEIGHT = 1024;
    var MARGIN = 0;
    this.SCREEN_WIDTH = window.innerWidth;
    this.SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
    var camera, controls, scene, renderer;
    var container, stats;
    var NEAR = 1, FAR = 1000;
    var sceneHUD, cameraOrtho, hudMaterial;
    var light;
    
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    
    init();
    animate();
    
    function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );
	
	// Camera
	camera = that.camera = new THREE.PerspectiveCamera( 24, that.SCREEN_WIDTH / that.SCREEN_HEIGHT, NEAR, FAR );

	camera.up.set(0,0,1);
	camera.position.x = 0;
	camera.position.y = 30;
	camera.position.z = 20;
	
	// SCENE
	scene = new THREE.Scene();
	that.three_scene = scene;
	//scene.fog = new THREE.Fog( 0x000000, 1000, FAR );

	// LIGHTS
	var ambient = new THREE.AmbientLight( 0x222222 );
	scene.add( ambient );

	light = new THREE.SpotLight( 0xffffff );
	light.position.set( 0, 35, 35 );
	light.target.position.set( 0, 0, 0 );
	if(that.shadowsOn){
	    light.castShadow = true;
	    light.shadowCameraVisible = false;
	    light.shadowCameraNear = 3;
	    light.shadowCameraFar = 60;
	    light.shadowCameraFov = 25;
	    
	    light.shadowMapDarkness = 0.5;
	    light.shadowMapWidth = that.SHADOW_MAP_WIDTH;
	    light.shadowMapHeight = that.SHADOW_MAP_HEIGHT;
	}
	scene.add( light );
	scene.add( camera );

	// RENDERER
	renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
	that._renderer = renderer;
	renderer.setSize( that.SCREEN_WIDTH, that.SCREEN_HEIGHT );
	renderer.domElement.style.position = "relative";
	renderer.domElement.style.top = MARGIN + 'px';
	container.appendChild( renderer.domElement );

	window.addEventListener('resize',onWindowResize);

	//renderer.setClearColor( scene.fog.color, 1 );
	renderer.autoClear = false;

	if(that.shadowsOn){
	    renderer.shadowMapEnabled = true;
	    renderer.shadowMapSoft = true;
	}

	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );

	// Trackball controls
	that.controls = controls = new THREE.AgxControls( camera, renderer.domElement );
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.2;
	controls.noZoom = false;
	controls.noPan = false;
	controls.keysEnabled = false;
	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.3;
	var radius = 100;
	controls.minDistance = 0.0;
	controls.maxDistance = radius * 1000;
	//controls.keys = [ 65, 83, 68 ]; // [ rotateKey, zoomKey, panKey ]
	controls.screen.width = that.SCREEN_WIDTH;
	controls.screen.height = that.SCREEN_HEIGHT;
    }

    var t = 0, newTime, delta;

    function animate(){
	requestAnimationFrame( animate );
	render();
	stats.update();
    }

    function onWindowResize( event ) {
	that.SCREEN_WIDTH = window.innerWidth;
	that.SCREEN_HEIGHT = window.innerHeight;

	renderer.setSize( that.SCREEN_WIDTH, that.SCREEN_HEIGHT );

	camera.aspect = that.SCREEN_WIDTH / that.SCREEN_HEIGHT;
	camera.updateProjectionMatrix();

	controls.screen.width = that.SCREEN_WIDTH;
	controls.screen.height = that.SCREEN_HEIGHT;

	camera.radius = ( that.SCREEN_WIDTH + that.SCREEN_HEIGHT ) / 4;
    }

    function render(){
	controls.update();
	renderer.clear();
	renderer.render( scene, camera );
	that.currentStepNumber++;
    }

    var mousedown = false;
    var last = 0;
    var lastx = 0;
    var lasty= 0;
    $(document).keydown(function(e){
	if(e.keyCode){
	    switch(e.keyCode){
	    case 99: // c - camera debug on
		light.shadowCameraVisible = !light.shadowCameraVisible;
		break;
	    case 13: // Enter - shoot shape
		var ray = that.getRay(lastx,lasty);
		var origin = new M3D.Vec3(ray.origin.x, ray.origin.y, ray.origin.z);
		var dir = new M3D.Vec3(ray.direction.x, ray.direction.y, ray.direction.z);
		//that.world.shootShape(ray.origin,ray.direction);
		break;
	    default:
		//that.world.keyDown(e.keyCode);
		break;
	    }
	}
    }).keyup(function(e){
	if(e.keyCode){
	    switch(e.keyCode){
	    case 99: break;
	    case 13: break;
	    default: /*that.world.keyUp(e.keyCode);*/ break;
	    }
	}
    }).mousedown(function(e){
	if(!e.ctrlKey)
	    return;
	var hit = that.clickTest(e);
	if(hit && hit.body){
	    that.mouseCenter = hit.point;
	    
	    // Try creating a virtual plane for the mouse movement
	    if(!that.plane){
		var planeContainer = that.planeContainer = new THREE.Object3D();
		var planeGeo = new THREE.PlaneGeometry(40,40);
		var plane = that.plane = new THREE.Mesh(planeGeo,that.solidMaterial);
		plane.visible = false; // Hide it..
		planeContainer.useQuaternion = true;
		planeContainer.add(plane);
		plane.rotation.x = Math.PI / 2;
		that.three_scene.add(planeContainer);
	    }
	    // Center at mouse position
	    that.planeContainer.position.set(that.mouseCenter.x,
					     that.mouseCenter.y,
					     that.mouseCenter.z);
	    // Make it face toward the camera
	    that.planeContainer.quaternion.setFromRotationMatrix(that.camera.matrixWorld);
	    that.setClickMarker(hit.point.x, hit.point.y, hit.point.z);
	    //that.world.addMouseJoint(hit.body,hit.point);
	}
	mousedown = true;
    }).mouseup(function(e){
	if(!e.ctrlKey)
	    return;
	//that.world.removeMouseJoints();
	that.removeClickMarker();
	mousedown = false;
    }).mousemove(function(e){
	if(!e.ctrlKey)
	    return;
	var x = e.pageX;
	var y = e.pageY;
	var now = new Date().getTime();
	// Take it easy with updating...
	if(mousedown && (now-last)>that.dt*1000 && !(lastx==x && lasty==y)){
	    
	    // project mouse to that plane
	    var hit = that.clickTest(e,[that.plane]);
	    if(hit){
		that.setClickMarker(hit.point.x, hit.point.y, hit.point.z);
		//that.world.moveMouseJoint(hit.point);
	    }
	    
	    lastx = x;
	    lasty = y;
	    last = now;
	}
    });
};

/**
 * Loads body positions and orientations from the World and updates the Three.js graphics.
 * @param Float32Array a
 */
M3D.Renderer.prototype.updateVisuals = function(){
    // Read position data into visuals
    for(var i=0; i<this.world.bodies.length; i++){
	var p = this.meshes[i].position;
	var q = this.meshes[i].quaternion;
	var b = this.world.bodies[i];
	p.set(b.position.x,
	      b.position.y,
	      b.position.z);
	q.set(b.quaternion.x,
	      b.quaternion.y,
	      b.quaternion.z,
	      b.quaternion.w);
    }
};

/**
 * @fn rebuildScene
 * @memberof Renderer
 * @brief Builds the scene.
 */
M3D.Renderer.prototype.rebuildScene = function(){
    var that = this;
    var num = that.meshes.length;

    // Remove old things from scene if there are any
    for(var i=0; i<num; i++)
	that.three_scene.remove(that.meshes.pop());

    for(var i=0; i<that.world.bodies.length; i++){
	var mesh = createVisual(that.world.bodies[i]);
	that.meshes.push(mesh);
	that.three_scene.add(mesh);
    };

    function createVisual(body){
	var mesh;
	var shape = body.shape;
	switch(shape.type){
	case M3D.Shape.BOX: // Box
	    var boxGeo = new THREE.CubeGeometry(shape.ex*2,
						shape.ey*2,
						shape.ez*2);
	    mesh = new THREE.Mesh( boxGeo, that.solidMaterial );
	    break;
	case M3D.Shape.SPHERE:
	    var sphereGeo = new THREE.SphereGeometry( shape.radius, 16, 16);
	    mesh = new THREE.Mesh( sphereGeo, that.solidMaterial );
	    break;
	case M3D.Shape.CYLINDER:
	    var cylinderGeo = new THREE.CylinderGeometry( shape.radius, shape.radius, shape.height, 16, 1, false);
	    mesh = new THREE.Mesh( cylinderGeo, that.solidMaterial );
	    break;
	default:
	    throw new Error("Cannot render shape with type="+shape.type+"!");
	    break;
	}
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.useQuaternion = true;
	return mesh;
    }
};/**
 * https://github.com/mrdoob/eventtarget.js/
 */

M3D.EventTarget = function () {

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
 * @class World
 * @brief A description of a physics world
 * @param RPC.Remote remote
 */
M3D.World = function(remote){
    M3D.EventTarget.call(this); // extend EventTarget
    var that = this;
    var idCount = 0;

    /**
     * @property RPC.Remote remote
     * @memberof World
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
     * @property array bodies
     * @memberof World
     */
    this.bodies = [];
    this.shapes = [];
    
    this.getShapeById = function(id){
	for(var i=0; i<this.shapes.length; i++)
	    if(this.shapes[i].id == id)
		return this.shapes[i];
    }
    
    this.getRigidBodyById = function(id){
	for(var i=0; i<this.bodies.length; i++)
	    if(this.bodies[i].id == id)
		return this.bodies[i];
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

    this.step = function(dt,callback){
	this.remote.exec({type:remote.WORLD_STEP,dt:dt},callback);
    };

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
 * @class RigidBody
 * @brief Rigid body.
 * @param Shape shape
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

    // remote sync object
    this.remote = null;
    this.sync = true;

    this.setAutoUpdate = function(autoUpdate){
	if(this.sync != autoUpdate){
	    this.sync = autoUpdate;
	    if(autoUpdate)
		this.remote.exec({type:this.remote.BODY_SUBSCRIBE,id:this.id});
	    else
		this.remote.exec({type:this.remote.BODY_UNSUBSCRIBE,id:this.id});
	}
    };

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
M3D.Shape.SPHERE = 6;/**
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

M3D.WebSocketWorld.prototype = new M3D.World();/**
 * @class AgxWorld
 * @brief A World being synchronized with Agx.
 * @param string command The command for starting Agx
 * @param Array flags Flags to be passed when starting agx, e.g. ["filename.lua","--agxOnly"]
 * @param int id A unique id for this session. Used to create unique fifos.
 * @param RPC.Remote remote
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

    this.toJSONString = function(){
	// Same as in AgX
	return worldJson;
    };

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

M3D.AgxWorld.prototype = new M3D.World();/**
 * @class TimeStats
 * @param int historyMax
 * @brief Class for keeping track of stats of some kind
 */
M3D.TimeStats = function(historyMax){
    var histmax = historyMax || 100;
    var vals = [],
    times = [];
    function time(){
	return (new Date()).getTime();
    }
    function deleteOverflow(){
	while(vals.length > histmax){
	    vals.shift();
	    times.shift();
	}
    }

    /**
     * @fn accumulate
     * @memberof TimeStats
     * @param float val
     * @brief Add a value
     */
    this.accumulate = function(val){
	times.push(time());
	vals.push(val);
	deleteOverflow();
    };
    
    /**
     * @fn average
     * @memberof TimeStats
     * @param int since Time in milliseconds, use e.g. new Date().getTime()
     * @return float Returns an average over a time span, "since" is a timestamp in millisec
     */
    this.average = function(since){
	var total = 0.0, n = 0, first = null, last = null;
	for(var i=0; i<vals.length; i++){
	    if(since==undefined || times[i]>since){
		total += vals[i];
		n++;
		if(first===null || times[i]<first)
		    first = times[i];
		if(last===null || times[i]>last)
		    last = times[i];
	    }
	}
	if(!first || !last || first===last)
	    return 0.0;
	return total / (last-first);
    };

    /**
     * @fn frequency
     * @memberof TimeStats
     * @param int since
     * @return float 
     */
    this.frequency = function(since){
	var n = 0, first = null, last = null;
	for(var i=0; i<vals.length; i++){
	    if(since==undefined || times[i]>since){
		n++;
		if(first===null || times[i]<first)
		    first = times[i];
		if(last===null || times[i]>last)
		    last = times[i];
	    }
	}
	if(!first || !last || first===last)
	    return 0.0;
	return n / (last-first);
    };
};
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

    this.downStats = new M3D.TimeStats();
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

    // Projects data onto an arraybuffer and returns it
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
 * Lossy compress a float number into an integer.
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
 * Uncompress an integer into a float.
 * @param int num The number to uncompress
 * @param string type See compress()
 * @param float mini See compress()
 * @param float maxi See compress()
 * @return int
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
}if (typeof module !== 'undefined') {
	// export for node
	module.exports = M3D;
} else {
	// assign to window
	this.M3D = M3D;
}


}).apply(this);