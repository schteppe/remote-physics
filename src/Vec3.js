/**
 * @class M3D.Vec3
 * @brief Vector class.
 */
M3D.Vec3 = function(x,y,z){
    /**
     * @property float x
     * @memberof M3D.Vec3
     */
    this.x = x===undefined ? 0 : x;

    /**
     * @property float y
     * @memberof M3D.Vec3
     */
    this.y = y===undefined ? 0 : y;

    /**
     * @property float z
     * @memberof M3D.Vec3
     */
    this.z = z===undefined ? 0 : z;

    /**
     * @fn set
     * @memberof M3D.Vec3
     * @param float x
     * @param float y
     * @param float z
     */
    this.set = function(x,y,z){
	this.x=x;
	this.y=y;
	this.z=z;
    }

    /**
     * @fn dot
     * @memberof M3D.Vec3
     * @param M3D.Vec3 v
     */
    this.dot = function(v){
	return this.x*v.x + this.y*v.y + this.z*v.z;
    }

    /**
     * @fn cross
     * @memberof M3D.Vec3
     * @brief Vector cross product
     * @param M3D.Vec3 v
     * @param M3D.Vec3 target Optional. Target to save in.
     * @return M3D.Vec3
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

    /**
     * @fn copy
     * @memberof M3D.Vec3
     * @param M3D.Vec3 target
     */
    this.copy = function ( target ) {
	target.x = this.x;
	target.y = this.y;
	target.z = this.z;
    }

    /**
     * @fn toString
     * @memberof M3D.Vec3
     * @return string
     */
    this.toString = function(){
	return "("+[this.x,this.y,this.z].join(",")+")";
    };
}