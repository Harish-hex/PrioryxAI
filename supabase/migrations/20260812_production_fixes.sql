-- 1. Deduplicate peer_connections (keep the oldest)
DELETE FROM peer_connections
WHERE id NOT IN (
  SELECT MIN(id)
  FROM peer_connections
  GROUP BY LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id)
);

-- 2. Add Unique Constraint on bidirectional pair
CREATE UNIQUE INDEX IF NOT EXISTS unique_friendship ON peer_connections (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));
