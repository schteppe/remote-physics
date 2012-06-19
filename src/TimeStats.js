/**
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
