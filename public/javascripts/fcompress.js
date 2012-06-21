/**
 * Simple functions for scaling a floating point number to fit into an int8 or int16. The compression is lossy. If the number range is known, precision can be increased.
 * 
 * The method can be used to compress data into or from JavaScript TypedArrays or Node.js Buffers, in both server and client.
 *
 * Example:
 * var num = Math.random();
 * var compressed = FCOMPRESS.compress(num,'int8',0,1);
 * var uncompressed = FCOMPRESS.uncompress(num,'int8',0,1);
 * console.log("Before:\t"+num);
 * console.log("After:\t"+uncompressed);
 */

(function(){

    FCOMPRESS = {};

    /**
     * Lossy compress a float number into an integer.
     * @param float num The number to compress
     * @param string type 'uint8', 'int8', 'uint16', 'int16', 'int32' or 'uint32'
     * @param float mini Optional. Minimum value of your number.
     * @param float maxi Optional. Maximum value of your number.
     * @param bool clamp Specify if the number should be clamped to be within the maxi/mini range. Recommended.
     * @return int
     */
    FCOMPRESS.compress = function(num,type,mini,maxi,clamp){
	var mm = maxmin(type);
	var max = mm[0], min = mm[1];
	clamp = clamp===undefined ? true : false;
	mini = mini===undefined ? -1e6 : mini;
	maxi = maxi===undefined ? 1e6 : maxi;

	if(clamp){
	    if(num>maxi) num = maxi;
	    if(num<mini) num = mini;
	}

	return Math.floor((num+mini)/(maxi-mini) * (max-min) + min);
    };

    /**
     * Uncompress an integer into a float.
     * @param int num The number to uncompress
     * @param string type See compress()
     * @param float mini See compress()
     * @param float maxi See compress()
     * @return int
     */
    FCOMPRESS.uncompress = function(num,type,mini,maxi){
	var mm = maxmin(type);
	var max = mm[0], min = mm[1];
	mini = mini===undefined ? -1e6 : mini;
	maxi = maxi===undefined ? 1e6 : maxi;
	return (num - min)/(max-min) * (maxi-mini) - mini;
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
    }

    // Node.js module export
    if (typeof module !== 'undefined'){
	module.exports.compress = FCOMPRESS.compress;
	module.exports.uncompress = FCOMPRESS.uncompress;
    } else {
	this.FCOMPRESS = FCOMPRESS;
    }

}).apply(this);