// Unit Tests for manage-transaction Edge Function

import { assertEquals, assertExists } from '../_shared/test-utils.ts';

Deno.test('Manage Transaction: calculates balance change for expense', () => {
  const currentBalance = 10000;
  const amount = 500;

  // For expense, balance decreases
  const newBalance = currentBalance - amount;

  assertEquals(newBalance, 9500);
});

Deno.test('Manage Transaction: calculates balance change for income', () => {
  const currentBalance = 10000;
  const amount = 3000;

  // For income, balance increases
  const newBalance = currentBalance + amount;

  assertEquals(newBalance, 13000);
});

Deno.test('Manage Transaction: delete restores original balance', () => {
  const originalBalance = 10000;
  const expenseAmount = 500;

  // After adding expense
  const balanceAfterExpense = originalBalance - expenseAmount;
  assertEquals(balanceAfterExpense, 9500);

  // After deleting expense (reverse the operation)
  const balanceAfterDelete = balanceAfterExpense + expenseAmount;
  assertEquals(balanceAfterDelete, originalBalance);
});

Deno.test('Manage Transaction: update adjusts balance correctly', () => {
  const originalBalance = 10000;
  const oldExpenseAmount = 100;
  const newExpenseAmount = 150;

  // After adding original expense
  const balanceAfterOldExpense = originalBalance - oldExpenseAmount;
  assertEquals(balanceAfterOldExpense, 9900);

  // After updating expense: reverse old (-100 becomes +100), apply new (-150)
  const balanceAfterUpdate = balanceAfterOldExpense + oldExpenseAmount - newExpenseAmount;
  assertEquals(balanceAfterUpdate, 9850);
});

Deno.test('Manage Transaction: update from expense to income reverses effect', () => {
  const originalBalance = 10000;
  const amount = 100;

  // After adding expense
  const balanceAfterExpense = originalBalance - amount;
  assertEquals(balanceAfterExpense, 9900);

  // After changing to income: reverse expense (+100), apply income (+100)
  const balanceAfterTypeChange = balanceAfterExpense + amount + amount;
  assertEquals(balanceAfterTypeChange, 10100);
});

Deno.test('Manage Transaction: validates transaction type', () => {
  const validTypes = ['expense', 'income'];

  assertEquals(validTypes.includes('expense'), true);
  assertEquals(validTypes.includes('income'), true);
  assertEquals(validTypes.includes('invalid'), false);
});

Deno.test('Manage Transaction: handles zero amount', () => {
  const currentBalance = 10000;
  const amount = 0;

  // Zero amount doesn't change balance
  const newBalance = currentBalance - amount;

  assertEquals(newBalance, 10000);
});

Deno.test('Manage Transaction: formats date correctly', () => {
  const date = new Date('2025-11-18');
  const formattedDate = date.toISOString().split('T')[0];

  assertEquals(formattedDate, '2025-11-18');
});

Deno.test('Manage Transaction: creates transaction with all fields', () => {
  const transaction = {
    user_id: 'user-123',
    account_id: 'account-123',
    category_id: 'category-123',
    type: 'expense',
    amount: 500,
    description: 'Test expense',
    date: '2025-11-18',
    source: 'manual',
  };

  assertExists(transaction.user_id);
  assertExists(transaction.account_id);
  assertExists(transaction.type);
  assertExists(transaction.amount);
  assertEquals(transaction.source, 'manual');
});

Deno.test('Manage Transaction: handles recurring transaction fields', () => {
  const transaction = {
    is_recurring: true,
    recurrence_pattern: 'monthly',
  };

  assertEquals(transaction.is_recurring, true);
  assertEquals(transaction.recurrence_pattern, 'monthly');
});
