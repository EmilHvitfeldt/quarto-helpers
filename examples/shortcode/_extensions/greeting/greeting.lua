-- Example custom shortcode
-- Usage: {{< greeting name >}}

return function(args)
  local name = pandoc.utils.stringify(args[1]) or "World"
  return pandoc.Str("Hello, " .. name .. "!")
end
