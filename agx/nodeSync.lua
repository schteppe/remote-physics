require('io')
require('os')
require('agx/json')

-- Sync an Agx simulation with M3D / Node.js
-- @param agxSDK.Simulation sim
-- @param table keyCallbacks A table that maps event.keyCode to callable function, where event.keyCode is the key code that comes from jQuery
function nodeSync(sim,keyCallbacks,title,description)
   
   -- Get the process id to be able to find correct fifo
   local stat = io.open("/proc/self/stat", "r")
   local pid = stat:read("*n")
   stat:close()

   -- Fix if keycallbaks was not given
   if (keyCallbacks==nil) then
      keyCallbacks = {}
   end
   
   -- Send velocities to node?
   local sendVelocities = true

   -- Converts a number to string and removes trailing zeros. Saves some bytes
   function num(n)
      return string.gsub(string.gsub(string.format("%f",n),"0+$",""),"%.$",".0");
   end
   
   -- Get bodies to sync
   local bodies = sim:getDynamicsSystem():getRigidBodies()

   -- Setup mouse joint
   local mouseJoint = nil
   
   -- Data out
   worldInfoDumper = agxSDK.LuaStepEventListener()
   worldInfoDumper:setMask( agxSDK.StepEventListener.PRE_STEP )
   fp = io.open("/tmp/agxout"..pid, "w")
   function worldInfoDumper:pre( t )
      local data = ""
      local del = ""
      for i=0,bodies:size()-1 do
	 local b = bodies:at(i)
	 local pos = b:getPosition()
	 local rot = b:getCmRotation()
	 if not sendVelocities then
	    -- x y z qz qy qz qw
	    data = data..string.format(del.."%s %s %s %s %s %s %s",
				       num(pos:x()),num(pos:y()),num(pos:z()),
				       num(rot:x()),num(rot:y()),num(rot:z()),num(rot:w()))
	 else
	    local v = b:getVelocity()
	    local w = b:getAngularVelocity()
	    -- x y z qz qy qz qw vx vy vz wx wy wz
	    data = data..string.format(del.."%s %s %s %s %s %s %s %s %s %s %s %s %s",
				       num(pos:x()),num(pos:y()),num(pos:z()),
				       num(rot:x()),num(rot:y()),num(rot:z()),num(rot:w()),
				       num(v:x()),num(v:y()),num(v:z()),
				       num(w:x()),num(w:y()),num(w:z()))
	 end
	 del = "|"
      end
      data = string.gsub(data,"0+ "," ")
      data = string.gsub(data,"0+$","")
      
      fp:write(data.."\n")
      fp:flush()
   end
   sim:add( worldInfoDumper )

   local pickCount = 0

   -- data in
   -- The reader step listener will block until it gets data from node. This way Node can step AgX however it wants.
   -- Messages from node are on the form "command1 arguments|command2 arguments" and so on. One set of commands per step. If no commands need to be given, the command "step" can be given to just step
   f = io.open("/tmp/agxin"..pid,"r")
   reader = agxSDK.LuaStepEventListener()
   reader:setMask( agxSDK.StepEventListener.PRE_STEP )
   function reader:pre(t)
      -- read from inpipe
      local l = f:read()
      if ( l ) then
	 local commands = explode("|",l)
	 for i,command in pairs(commands) do
	    if string.find(command,"step") then
	       -- do nothing
	    elseif string.find(command,"keydown")~=nil then
	       local keyCode = nil
	       for n in command:gmatch("[%d]+") do
		  keyCode = tonumber(n)
	       end
	       if keyCode~=nil and keyCallbacks[keyCode]~=nil then
		  keyCallbacks[keyCode](true)
	       end
	    elseif string.find(command,"keyup")~=nil then
	       local keyCode = nil
	       for n in command:gmatch("[%d]+") do
		  keyCode = tonumber(n)
	       end
	       if keyCode~=nil and keyCallbacks[keyCode]~=nil then
		  keyCallbacks[keyCode](false)
	       end
	    elseif string.find(command,"mouseup")~=nil then
	       -- remove mousejoint
	       if mouseJoint then
		  mouseJoint:setEnable(false)
		  sim:remove( mouseJoint )
		  mouseJoint = nil
	       end
	    elseif string.find(command,"mousedown")~=nil then
	       if mouseJoint then
		  mouseJoint:setEnable(false)
		  sim:remove( mouseJoint )
		  mouseJoint = nil
	       end
	       -- attach mousejoint
	       local nums = {}
	       for n in command:gmatch("[%-%w%d%.]+") do
		  -- parse x,y,z, body_number
		  if n~="mousedown" then
		     table.insert(nums,tonumber(n))
		  end
	       end
	       local worldPoint = agx.Vec3( nums[1],nums[2],nums[3] )
	       local body_number = math.floor(nums[4])
	       local body = bodies:at(body_number)
	       if body then
		  local loc = body:getFrame():transformPointToLocal( worldPoint )
		  mouseJoint = agx.BallJoint( body , loc )
		  calculateComplianceAndDamping( mouseJoint,body )
		  att = mouseJoint:getAttachment(1)
		  att:setTranslate(worldPoint:x(),worldPoint:y(),worldPoint:z())
		  sim:add( mouseJoint )
	       end
	       
	    elseif string.find(command,"mousemove")~=nil then
	       if mouseJoint ~= nil then
		  -- Update mouse joint
		  local nums = {}
		  for n in command:gmatch("[%-%w%d%.]+") do
		     if n~="mousemove" then
			table.insert(nums,tonumber(n))
		     end
		  end
		  if att~=0 then
		     att:setTranslate(nums[1],nums[2],nums[3])
		  end
	       end
	    end
	 end
      end --while
   end
   sim:add( reader )

   -- Dump JSON info on sim start
   -- @todo Should be sent whenever the system changes. How to do this?
   local json = {}
   local data = {}
   for i=0,bodies:size()-1 do
      local b = bodies:at(i)
      local geos = b:getGeometries()
      local body = {}
      local bodyjson = {}
      for j=0,geos:size()-1 do
	 local g = geos:at(j)
	 local shapes = g:getShapes()
	 local geometry = {}
	 local shapesjson = {}
	 for k=0,shapes:size()-1 do
	    local s = shapes:at(k)
	    local t = s:getType()
	    local props = {}
	    local shape = {}
	    -- how to get agxCollide.Shape.Types enum?
	    if t==0 then
	       -- Group
	    elseif t==1 then
	       -- Box
	       local h = s:getHalfExtents()
	       table.insert(props,string.format("\"halfExtents\":[%s,%s,%s]",num(h:x()),num(h:y()),num(h:z())))
	       shape['halfExtents'] = {h:x(),h:y(),h:z()}
	       -- elseif t==2 then print("capsule\n")
	    elseif t==3 then -- cylinder
	       local r = s:getRadius()
	       local h = s:getHeight()
	       table.insert(props,string.format("\"radius\":%s",num(r)))
	       table.insert(props,string.format("\"height\":%s",num(h)))
	       shape['radius'] = r
	       shape['height'] = h
	       -- elseif t==4 then print("line\n")
	       -- elseif t==5 then print("plane\n")
	    elseif t==6 then 
	       -- Sphere
	       local r = s:getRadius()
	       table.insert(props,string.format("\"radius\":%s",num(r)))
	       shape['radius'] = r
	       -- elseif t==7 then print("trimesh\n")
	       -- elseif t==8 then print("heightfield\n")
	       -- elseif t==9 then print("convex\n")
	    else
	       print("Shape not supported yet!")
	    end
	    table.insert(geometry,string.format("{\"type\":%d,%s}",t,table.concat(props,",")))
	    shape['type'] = t
	    table.insert(shapesjson,shape)
	 end
	 table.insert(body,"\"shapes\":["..table.concat(geometry,",").."]")
	 bodyjson['shapes'] = shapesjson
	 table.insert(json,bodyjson)
      end
      table.insert(data,"{"..table.concat(body,",").."}")
   end
   data = "["..table.concat(data,",").."]"

   local debugf = io.open("/tmp/json.txt", "w")
   debugf:write(table.json(json).."\n")
   debugf:close()

   debugf = io.open("/tmp/json2.txt", "w")
   debugf:write(data.."\n")
   debugf:close()

   --data = string.gsub(data,"0+ "," ")
   --data = string.gsub(data,"0+$","")
   --fp:write(data)
   fp:write(table.json(json))
   fp:write("\n")
   fp:flush()

   -- @fn explode(sep, str)
   -- @brief split a string
   -- @param string sep Separator/delimiter
   -- @param string str String to explode
   -- @return string
   function explode(d,p)
      local t, ll
      t={}
      ll=0
      if(#p == 1) then return {p} end
      while true do
	 l=string.find(p,d,ll,true) -- find the next d in the string
	 if l~=nil then -- if "not not" found then..
	    table.insert(t, string.sub(p,ll,l-1)) -- Save it in our array.
	    ll=l+1 -- save just after where we found it for searching next time.
	 else
	    table.insert(t, string.sub(p,ll)) -- Save what's left in our array.
	    break -- Break at end, as it should be, according to the lua manual.
	 end
      end
      return t
   end

   -- Fixes the compliance and damping for the pick constraint.
   function calculateComplianceAndDamping( constraint, rb )
      if ( constraint == nil or rb == nil ) then
	 return
      end
      
      local rbFrame = constraint:getAttachment( rb );
      local worldFrame = constraint:getAttachment( 0 );

      if ( rbFrame == 0 or worldFrame == 0 ) then
	 return
      end
      
      local rbMass = rb:getMassProperties():getMass();                             
      local dist2 = rb:getFrame():transformPointToWorld( rbFrame:getLocalTranslate() ):distance2( worldFrame:getLocalTranslate() ) + 0.1;                       
      if dist2 > 1.5 then
	 dist2 = dist2 * dist2
      end
      local clampedMass = rbMass
      if clampedMass < 1 then
	 clampedMass = 1
      end
      constraint:setCompliance( 1E-3 / (dist2 * clampedMass))
      constraint:setDamping( 10.0 / 60.0 )
   end

   -- @fn sleep
   -- @brief In lack of a sleep function, here is my solution
   -- @deprecated Needed?
   function sleep(n)
      if n > 0 then os.execute("sleep "..n) end
   end

end