var config = require('../config');
var crypto = require('crypto');

// GET index page
exports.index = function(req, res){
    res.render('index', { 
	title: 'Flatland',
	description:'Flatland',
	config:config
    });
};

// Create new
exports.new = function(req, res){
  if(req.session && req.session.uid){
    //var db = new sqlite3.Database(config.dbfile);
    GLOBAL.db.serialize(function() {
	var stmt = GLOBAL.db.prepare("INSERT INTO simulations (user_id,description) VALUES (?,?)");
	stmt.run(req.session.uid,"A new simulation!");
	stmt.finalize();
      });
    res.json({errorcode:0,error:""});
  } else {
    res.json({errorcode:1,error:"You must be logged in to create!"});
  }
};

// Create user
exports.createuser = function(req,res){
  if(req && req.body && req.body.pass && req.body.user){
    //var db = new sqlite3.Database(config.dbfile);
    GLOBAL.db.serialize(function() {
	var stmt = GLOBAL.db.prepare("INSERT INTO users (email, password) VALUES (?,?)");
	var shasum = crypto.createHash('sha1');
	shasum.update(req.body.pass);
	var enc_pass = shasum.digest('hex');
	stmt.run(req.body.user, enc_pass);
	stmt.finalize();
	res.json({errorcode:0,error:""});
      });
  } else {
    res.json({errorcode:1,error:"Usage error"});
  }
};

exports.editor = function(req,res){
  res.render('editor', { 
      uid:req.session.uid!=undefined ? req.session.uid : 0,
      sid:req.session.id,
      config:config
    });
};

exports.login = function(req,res){
  if(req && req.body && req.body.pass && req.body.user){
    //var db = new sqlite3.Database(config.dbfile);
    GLOBAL.db.serialize(function() {
	var shasum = crypto.createHash('sha1');
	shasum.update(req.body.pass);
	var enc_pass = shasum.digest('hex');
	GLOBAL.db.all("SELECT rowid AS id FROM users WHERE email=? AND password=? LIMIT 1",req.body.user,enc_pass,function(err,rows){
	    if(rows && rows.length){
	      req.session.uid = rows[0].id;
	      res.json({errorcode:0,error:""});
	    } else {
	      res.json({errorcode:1,error:"Wrong username or password"});
	    }
	  });
      });
  } else
    res.json({errorcode:1,error:"Missing parameters"});
};

exports.logout = function(req,res){
  req.session.uid = 0;
  req.session.sid = "";
  req.session.destroy(function(err){
      res.json({errorcode:0});
    });
};

exports.simulations = function(req,res){
  GLOBAL.db.all("SELECT rowid AS id, description FROM simulations WHERE user_id=? LIMIT 10",req.session.uid,function(err, rows){
      var sims = [];
      if(rows){
	rows.forEach(function (r) {
	    sims.push({id:r.id,desc:r.description});
	  });
      }
      
      res.render('simulations',{
	  mine:sims,
	  config:config,
	  session:req.session
	});
    });
};

exports.buffer = function(req,res){
  var sim_id = parseInt(req.params[0]);
  var t0 = parseInt(req.params[1]);
  var t1 = req.params[2]==null ? t0 : parseInt(req.params[2]);
  
  // Start checking the data existance
  // We need N_bodies * N_steps rows, count em
  // TODO: fix this query
  GLOBAL.db.all("SELECT COUNT(*) as n FROM bodies WHERE bodies.sim_id=? AND bodies.step>=? AND bodies.step<=?",sim_id,t0,t1,function(err,rows){
      var nresults = rows && rows.length>0  ?  parseInt(rows[0]['n']) : -1;
      GLOBAL.db.all("SELECT nbodies FROM simulations WHERE rowid=?",sim_id,function(err,rows){
	  var nbodies = rows && rows.length>0  ?  rows[0]['nbodies'] : -1;
	  if(nresults===(t1-t0+1)*nbodies){
	    GLOBAL.db.all("SELECT rowid,id,x,y,z,qx,qy,qz,qw,step FROM bodies WHERE sim_id=? AND step>=? AND step<=? ORDER BY step ASC, id ASC",sim_id,t0,t1,function(err, rows){
		if(rows){
		  var buf = new Buffer(4*rows.length*7); // x y z qx qy qz qw in single precision
		  var i = 0;
		  rows.forEach(function (r) {
		      buf.writeFloatLE(r.x,  4*rows.length*0+i*4);
		      buf.writeFloatLE(r.y,  4*rows.length*1+i*4);
		      buf.writeFloatLE(r.z,  4*rows.length*2+i*4);
		      buf.writeFloatLE(r.qx, 4*rows.length*3+i*4);
		      buf.writeFloatLE(r.qy, 4*rows.length*4+i*4);
		      buf.writeFloatLE(r.qz, 4*rows.length*5+i*4);
		      buf.writeFloatLE(r.qw, 4*rows.length*6+i*4);
		      i++;
		    });
		  res.send(buf);
		} else
		  res.send();
	      });
	  } else {
	    console.log("Asked for all bodies in simulation "+sim_id+" within time span "+t0+" to "+t1+" ("+(t1-t0+1)+" steps), but failed since the number of bodies is "+nbodies+" and nbodies*nsteps="+nresults);
	    res.send();
	  }
	});
    });
};
