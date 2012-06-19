/**
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
}