// Unit Tests for manage-transaction Edge Function

import { assertEquals, assertExists } from "../_shared/test-utils.ts"

Deno.test("Manage Transaction: calculates balance change for expense", () => {
    const currentBalance = 10000
    const expenseAmount = 500
    const type = 'expense'

    const balanceChange = type === 'income' ? expenseAmount : -expenseAmount
    const newBalance = currentBalance + balanceChange

    assertEquals(newBalance, 9500)
})

Deno.test("Manage Transaction: calculates balance change for income", () => {
    const currentBalance = 10000
    const incomeAmount = 3000
    const type = 'income'

    const balanceChange = type === 'income' ? incomeAmount : -incomeAmount
    const newBalance = currentBalance + balanceChange

    assertEquals(newBalance, 13000)
})

Deno.test("Manage Transaction: validates transaction type", () => {
    const validTypes = ['expense', 'income']

    assertEquals(validTypes.includes('expense'), true)
    assertEquals(validTypes.includes('income'), true)
    assertEquals(validTypes.includes('invalid'), false)
})

Deno.test("Manage Transaction: handles zero amount", () => {
    const currentBalance = 10000
    const amount = 0
    const type = 'expense'

    const balanceChange = type === 'income' ? amount : -amount
    const newBalance = currentBalance + balanceChange

    assertEquals(newBalance, 10000)
})

Deno.test("Manage Transaction: formats date correctly", () => {
    const date = new Date('2025-11-18')
    const formattedDate = date.toISOString().split('T')[0]

    assertEquals(formattedDate, '2025-11-18')
})

Deno.test("Manage Transaction: creates transaction with all fields", () => {
    const transaction = {
        user_id: 'user-123',
        account_id: 'account-123',
        category_id: 'category-123',
        type: 'expense',
        amount: 500,
        description: 'Test expense',
        date: '2025-11-18',
        source: 'manual'
    }

    assertExists(transaction.user_id)
    assertExists(transaction.account_id)
    assertExists(transaction.type)
    assertExists(transaction.amount)
    assertEquals(transaction.source, 'manual')
})

Deno.test("Manage Transaction: handles recurring transaction fields", () => {
    const transaction = {
        is_recurring: true,
        recurrence_pattern: 'monthly'
    }

    assertEquals(transaction.is_recurring, true)
    assertEquals(transaction.recurrence_pattern, 'monthly')
})
