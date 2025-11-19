-- Portfolio Snapshots: Daily/sync-based snapshots of total portfolio value
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crypto_account_id UUID NOT NULL REFERENCES crypto_accounts(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_value_usd DECIMAL(20, 8) NOT NULL,
  assets_count INTEGER NOT NULL,
  metadata JSONB, -- Store individual asset values for this snapshot
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_portfolio_snapshots_user_date ON portfolio_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_portfolio_snapshots_account ON portfolio_snapshots(crypto_account_id, snapshot_date DESC);

-- RLS Policies
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own portfolio snapshots" ON portfolio_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio snapshots" ON portfolio_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Crypto Price History: Cache of crypto prices over time
CREATE TABLE IF NOT EXISTS crypto_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset VARCHAR(20) NOT NULL,
  price_usd DECIMAL(20, 8) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'binance',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_crypto_price_history_asset_date ON crypto_price_history(asset, recorded_at DESC);

-- RLS not needed for price history (public data)

-- Function to get latest portfolio value
CREATE OR REPLACE FUNCTION get_latest_portfolio_value(p_user_id UUID)
RETURNS DECIMAL(20, 8) AS $$
  SELECT COALESCE(SUM(value_usd), 0)
  FROM crypto_balances
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Function to calculate ROI
CREATE OR REPLACE FUNCTION calculate_crypto_roi(p_user_id UUID, p_days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  initial_value DECIMAL(20, 8),
  current_value DECIMAL(20, 8),
  profit_loss DECIMAL(20, 8),
  roi_percent DECIMAL(10, 4)
) AS $$
  WITH initial AS (
    SELECT total_value_usd as init_val
    FROM portfolio_snapshots
    WHERE user_id = p_user_id
      AND snapshot_date >= NOW() - (p_days_back || ' days')::INTERVAL
    ORDER BY snapshot_date ASC
    LIMIT 1
  ),
  current AS (
    SELECT get_latest_portfolio_value(p_user_id) as curr_val
  )
  SELECT 
    initial.init_val as initial_value,
    current.curr_val as current_value,
    (current.curr_val - initial.init_val) as profit_loss,
    CASE 
      WHEN initial.init_val > 0 THEN
        ((current.curr_val - initial.init_val) / initial.init_val * 100)
      ELSE 0
    END as roi_percent
  FROM initial, current;
$$ LANGUAGE SQL STABLE;
