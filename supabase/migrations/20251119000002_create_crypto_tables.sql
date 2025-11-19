-- Create tables for cryptocurrency tracking via Binance

-- Crypto Accounts (Binance connections)
CREATE TABLE IF NOT EXISTS crypto_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL DEFAULT 'binance',
  api_key_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crypto Transactions
CREATE TABLE IF NOT EXISTS crypto_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crypto_account_id UUID NOT NULL REFERENCES crypto_accounts(id) ON DELETE CASCADE,
  external_id TEXT, -- Binance transaction ID
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'deposit', 'withdrawal', 'transfer', 'staking_reward', 'fee')),
  asset TEXT NOT NULL, -- BTC, ETH, USDT, etc.
  amount DECIMAL(20, 8) NOT NULL,
  price_usd DECIMAL(15, 2),
  total_usd DECIMAL(15, 2),
  fee_asset TEXT,
  fee_amount DECIMAL(20, 8),
  status TEXT NOT NULL DEFAULT 'completed',
  transaction_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crypto Balances (snapshot)
CREATE TABLE IF NOT EXISTS crypto_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crypto_account_id UUID NOT NULL REFERENCES crypto_accounts(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  free DECIMAL(20, 8) NOT NULL DEFAULT 0,
  locked DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total DECIMAL(20, 8) NOT NULL DEFAULT 0,
  value_usd DECIMAL(15, 2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(crypto_account_id, asset)
);

-- Enable RLS
ALTER TABLE crypto_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crypto_accounts
CREATE POLICY "Users can view their own crypto accounts" ON crypto_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crypto accounts" ON crypto_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crypto accounts" ON crypto_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for crypto_transactions
CREATE POLICY "Users can view their own crypto transactions" ON crypto_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crypto transactions" ON crypto_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for crypto_balances
CREATE POLICY "Users can view their own crypto balances" ON crypto_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crypto balances" ON crypto_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crypto balances" ON crypto_balances
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_crypto_transactions_user_time ON crypto_transactions(user_id, transaction_time DESC);
CREATE INDEX idx_crypto_transactions_account ON crypto_transactions(crypto_account_id);
CREATE INDEX idx_crypto_balances_account ON crypto_balances(crypto_account_id);
