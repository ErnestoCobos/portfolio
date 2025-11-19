-- Seed data: Default categories for a new user
-- This migration creates a trigger that automatically creates default categories when a user signs up

-- Function to create default categories for a new user
CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default expense categories
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES
    (NEW.id, 'Comida', 'expense', '🍔', '#FF6B6B'),
    (NEW.id, 'Transporte', 'expense', '🚗', '#4ECDC4'),
    (NEW.id, 'Servicios', 'expense', '💡', '#45B7D1'),
    (NEW.id, 'Entretenimiento', 'expense', '🎬', '#FFA07A'),
    (NEW.id, 'Salud', 'expense', '🏥', '#98D8C8'),
    (NEW.id, 'Educación', 'expense', '📚', '#95E1D3'),
    (NEW.id, 'Ropa', 'expense', '👕', '#F38181'),
    (NEW.id, 'Hogar', 'expense', '🏠', '#AA96DA'),
    (NEW.id, 'Mascotas', 'expense', '🐶', '#FCBAD3'),
    (NEW.id, 'Regalos', 'expense', '🎁', '#FFD93D'),
    (NEW.id, 'Otros Gastos', 'expense', '📦', '#A8DADC');
  
  -- Create default income categories
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES
    (NEW.id, 'Salario', 'income', '💰', '#6BCF7F'),
    (NEW.id, 'Freelance', 'income', '💼', '#51CF66'),
    (NEW.id, 'Inversiones', 'income', '📈', '#94D82D'),
    (NEW.id, 'Otros Ingresos', 'income', '💵', '#A9E34B');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table to automatically create categories for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories_for_user();
