requestPlugin( "agxOSG" )
require( "agx/nodeSync" )

function buildScene( sim, app )
  local root = agxOSG.Group:new()
  nodeSync( sim , root, {})
  return root
end
