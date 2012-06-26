START     = src/Start.js
CORE      = src/Vec3.js src/Quat.js src/Renderer.js src/EventTarget.js src/World.js src/WebSocketWorld.js src/AgxWorld.js src/TimeStats.js src/rpc.js
END       = src/End.js

all:
	cat $(START) $(CORE) $(END) > public/javascripts/m3d.js