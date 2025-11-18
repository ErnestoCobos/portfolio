-- Seed data: Default categories for a new user
-- This migration adds common expense and income categories

-- Note: This will run for all users. The categories are user-specific.
-- In production, you might want to create these via an Edge Function when a user signs up.

-- Common expense categories
INSERT INTO categories (user_id, name, type, icon, color) VALUES
  (auth.uid(), 'Comida', 'expense', '🍔', '#FF6B6B'),
  (auth.uid(), 'Transporte', 'expense', '🚗', '#4ECDC4'),
  (auth.uid(), 'Servicios', 'expense', '💡', '#45B7D1'),
  (auth.uid(), 'Entretenimiento', 'expense', '🎬', '#FFA07A'),
  (auth.uid(), 'Salud', 'expense', '🏥', '#98D8C8'),
  (auth.uid(), 'Educación', 'expense', '📚', '#95E1D3'),
  (auth.uid(), 'Ropa', 'expense', '👕', '#F38181'),
  (auth.uid(), 'Hogar', 'expense', '🏠', '#AA96DA'),
  (auth.uid(), 'Mascotas', 'expense', '🐶', '#FCBAD3'),
  (auth.uid(), 'Regalos', 'expense', '🎁', '#FFD93D'),
  (auth.uid(), 'Otros Gastos', 'expense', '📦', '#A8DADC')
ON CONFLICT DO NOTHING;

-- Common income categories
INSERT INTO categories (user_id, name, type, icon, color) VALUES
  (auth.uid(), 'Salario', 'income', '💰', '#6BCF7F'),
  (auth.uid(), 'Freelance', 'income', '💼', '#51CF66'),
  (auth.uid(), 'Inversiones', 'income', '📈', '#94D82D'),
  (auth.uid(), 'Otros Ingresos', 'income', '💵', '#A9E34B')
ON CONFLICT DO NOTHING;
