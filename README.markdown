# Remote 3D physics via WebSocket

This app runs AgX on a server machine along with a web- and websocket-server application. The client can connect, visualize and interact with the simulation on remote.

## Install on Linux

Note: The server app has only been tested successfully on a Ubuntu 12.04 Linux machine.

You need
* Node.js along with NPM, download the most recent packages of these from nodejs.org.
* AgX Multiphysics compiled with Lua support.

Install all NPM dependencies by running
```
npm install -d
```

Then copy config-sample.js to config.php and edit it so it fits your environment.

To start the app, run
```
node app.js
```
in the app directory. Hopefully there will be no errors.

To start a "long run" with the servers running in a background daemon, you can consider starting the Node.js app in Forever. Install forever from NPM: ```sudo npm install forever -g``` (g is for global install). Then run:

```
forever start -a -l forever.log -o out.log -e err.log app.js
```

For more help on how to use forever, just run the command "forever".

## Todo

* Show number of players connected
* More examples
* Sort and send packages by priority, eg. if a body sleeps then don't update. If it is hinged to mouse, then update often.
* Lua API more similar to agxOSG.addVisual() that throws errors if a non-renderable was found
* Being able to add THREE.js compatible 3D models instead of the basic shapes
* Simulation title and description