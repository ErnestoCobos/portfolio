-- Helper function to increment account balance
CREATE OR REPLACE FUNCTION increment_balance(account_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE accounts
  SET balance = balance + amount
  WHERE id = account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
