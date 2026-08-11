/**
 * Atomic fixed-window counter executed by Redis.
 *
 * Contract:
 * - `KEYS[1]` identifies one subject, feature, and fixed window.
 * - `ARGV[1]` is the capacity requested by this attempt.
 * - `ARGV[2]` is the window's total capacity.
 * - `ARGV[3]` is the number of seconds until the counter can be discarded.
 *
 * The script is the concurrency boundary. It reads and conditionally updates
 * the counter in one Redis operation, so competing callers cannot push the
 * stored usage above the limit. A denied attempt never changes the counter.
 *
 * This lives separately from the Node Redis command definition so the
 * algorithm can be read without TypeScript protocol-mapping details.
 */
export const FIXED_WINDOW_COUNTER_LUA = `
local counterKey = KEYS[1]
local requestedCost = tonumber(ARGV[1])
local windowLimit = tonumber(ARGV[2])
local ttlSeconds = tonumber(ARGV[3])

local currentUsage = tonumber(redis.call('GET', counterKey))

if currentUsage == nil then
  if requestedCost > windowLimit then
    return { 0, windowLimit }
  end

  redis.call('SET', counterKey, requestedCost, 'EX', ttlSeconds)
  return { 1, windowLimit - requestedCost }
end

local nextUsage = currentUsage + requestedCost
if nextUsage > windowLimit then
  return { 0, windowLimit - currentUsage }
end

redis.call('INCRBY', counterKey, requestedCost)
return { 1, windowLimit - nextUsage }
`;
