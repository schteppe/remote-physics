requestPlugin( "agxOSG" )
require('agx/nodeSync')

function buildScene( sim, app )
   local root = agxOSG.Group:new()
   sim:setUniformGravity(agx.Vec3(0,0,-20))

   -- Floor
   local floorGeometry 	= agxCollide.Geometry( agxCollide.Box( agx.Vec3( 10, 10, 0.5 )))
   local floor = agx.RigidBody()
   floor:add(floorGeometry)
   floor:setMotionControl(1)
   agxOSG.createVisual( floor, root ) -- not needed if we run via browser
   floor:setPosition( 0, 0, -0.5 )
   sim:add( floor )

   -- Box
   for i=1,10 do
      local boxShape = agxCollide.Box(  agx.Vec3(0.2,0.2,0.2) )
      local boxGeometry = agxCollide.Geometry( boxShape )
      local box = agx.RigidBody()
      box:add( boxGeometry )
      box:getAutoSleepProperties():setEnable(true)
      sim:add( box )
      agxOSG.createVisual( box, root )
      box:setPosition( 5*math.sin(i*0.1), 5*math.cos(i*0.1), 5 )
   end

   -- Sphere
   local sphereShape = agxCollide.Sphere(  0.5 )
   local sphereGeometry = agxCollide.Geometry( sphereShape )
   local sphere = agx.RigidBody()
   sphere:add( sphereGeometry )
   sphere:getAutoSleepProperties():setEnable(true)
   sim:add( sphere )
   agxOSG.createVisual( sphere, root )
   sphere:setPosition( -3, 3, 5 )

   -- Cylinder
   local cylinderShape = agxCollide.Cylinder(  0.5, 1 )
   local cylinderGeometry = agxCollide.Geometry( cylinderShape )
   local cylinder = agx.RigidBody()
   cylinder:add( cylinderGeometry )
   cylinder:getAutoSleepProperties():setEnable(true)
   sim:add( cylinder )
   agxOSG.createVisual( cylinder, root )
   cylinder:setPosition( -3, -3, 5 )

   nodeSync(sim)

   return root
end
