if (typeof module !== 'undefined') {
	// export for node
	module.exports = M3D;
} else {
	// assign to window
	this.M3D = M3D;
}


}).apply(this);