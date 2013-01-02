#!/bin/bash

source /home/steffe/physen/agx/agx-trunk/setup_env.bash;
cd /home/steffe/forever/remote-physics;
/usr/local/bin/forever -a -l forever.log -o out.log -e err.log remotephysics.js;
