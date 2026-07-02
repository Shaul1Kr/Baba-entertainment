-- Atomic check-and-decrement of available stock, plus reservation registration.
--
-- Redis executes this whole script as a single, uninterruptible unit (Redis is
-- single-threaded), so concurrent add-to-cart requests can never oversell:
-- there is no window between the "do we have enough?" check and the decrement.
--
-- KEYS[1] = stock:{itemId}          (the live available counter)
-- KEYS[2] = reservation:{cartItemId} (companion key that expires -> releases)
-- ARGV[1] = qty       (units to reserve, positive integer)
-- ARGV[2] = ttl       (reservation TTL in seconds)
--
-- Returns: the NEW remaining stock (>= 0) on success,
--          or -1 when there is not enough stock.

local available = tonumber(redis.call('GET', KEYS[1]))
if available == nil then
  -- Stock key not seeded yet -> treat as no stock.
  return -1
end

local qty = tonumber(ARGV[1])
if available < qty then
  return -1
end

local remaining = redis.call('DECRBY', KEYS[1], qty)
-- Register the reservation with its TTL so expiry restores stock event-driven.
redis.call('SET', KEYS[2], qty, 'EX', tonumber(ARGV[2]))
return remaining
