-- simple table-to-json convert.
-- @todo add array support
function table.json(t)

   -- Converts a number to string and removes trailing zeros. Saves some bytes
   function num(n)
      return string.gsub(string.gsub(string.format("%f",n),"0+$",""),"%.$",".0");
   end

   if type(t)=="number" then
      return num(t)
   end
   if type(t)=="string" then
      return "\""..t.."\""
   end

   -- check if all keys are numbers
   local isarray = true
   for key,val in pairs(t) do
      if type(key)~="number" then
	 isarray = false
	 break
      end
   end

   if isarray then
      local json = "["
      local del = ""
      for key,val in pairs(t) do
	 json = json .. del .. table.json(val)
	 del = ","
      end
      return json .."]"
   else
      local json = "{"
      local del = ""
      for key,val in pairs(t) do
	 if type(key) == "number" then
	    key = key -1
	 end
	 json = json .. del .. "\"" .. key .. "\":" .. table.json(val)
	 del = ","
      end
      return json .."}"
   end
end
