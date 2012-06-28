/**
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
};