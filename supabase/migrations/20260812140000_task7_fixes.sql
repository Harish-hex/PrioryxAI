-- Unique peer connection pairs
CREATE UNIQUE INDEX IF NOT EXISTS unique_peer_connection 
ON peer_connections(
  LEAST(requester_id, receiver_id),
  GREATEST(requester_id, receiver_id)
);

-- Add Razorpay and Profile cols to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_expires_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_status boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_id text;
