// Test cases using the World object

var M3D = require("../public/javascripts/m3d.js");

exports.World = {

    setUp : function (callback) {
	var s1 = this.s1 = new RPC.DebugSocket();
	var s2 = this.s2 = new RPC.DebugSocket();
	s1.connect(s2);
	s2.connect(s1);
	var r1 = this.r1 = new RPC.Remote(s1);
	var r2 = this.r2 = new RPC.Remote(s2);
	var w1 = this.w1 = new M3D.World(r1);
	var w2 = this.w2 = new M3D.World(r2);
	callback();
    },

    tearDown : function (callback) {
	callback();
    },

    construct : function(test) {
        test.expect(0);
	var world = new M3D.World();
        test.done();
    },

    createSphereShape : function(test){
	test.expect(0);
	var shape = this.w1.createSphereShape(1);
	test.done();
    },

    createRigidBody : function(test){
	test.expect(4);
	// Create a body
	var shape = this.w1.createSphereShape(1);
	var rb = this.w1.createRigidBody(shape,10.0);

	// Check so the other world was sync'ed
	test.equal(this.w2.bodies.length,1);
	test.equal(this.w2.shapes.length,1);

	test.equal(this.w2.shapes[0].id, shape.id,"Created shape did not get desired id: "+this.w2.shapes[0].id);
	test.equal(this.w2.bodies[0].id, rb.id);

	test.done();
    },

    step : function(test){
	test.expect(0);
	this.w1.step(1.0/60.0,function(){});
	test.done();
    },

    setAutoUpdate : function(test){
	test.expect(0);
	var shape = this.w1.createSphereShape(1);
	var rb = this.w1.createRigidBody(shape,10.0);
	rb.setAutoUpdate(true);
	test.done();
    },

    setAllBodyCoordinates : function(test){
	test.expect(1);
	var shape = this.w1.createSphereShape(1);
	var rb = this.w1.createRigidBody(shape,10.0);
	rb.setAutoUpdate(true);
	this.w1.setAllBodyCoordinates([rb.id],
				      [1,1,1],
				      [0,0,0,1]);
	var p = this.w2.bodies[0].position;
	test.equal(p.x,1,"Tried to set coordinates to (1,1,1) but failed with: "+p.x+","+p.y+","+p.z);
	test.done();
    },

    
};
