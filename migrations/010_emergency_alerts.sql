CREATE TABLE IF NOT EXISTS blood_request_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_user_id TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, donor_user_id)
)