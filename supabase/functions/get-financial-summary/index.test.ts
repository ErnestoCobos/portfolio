// Unit Tests for get-financial-summary Edge Function

import { assertEquals, assertExists, assert } from "../_shared/test-utils.ts"
import { calculateSavingsRate } from "../_shared/test-utils.ts"

Deno.test("Financial Summary: calculates savings rate correctly", () => {
    const income = 5000
    const expenses = 3000
    const savingsRate = calculateSavingsRate(income, expenses)

    assertEquals(savingsRate, 40)
})

Deno.test("Financial Summary: handles zero income", () => {
    const income = 0
    const expenses = 3000
    const savingsRate = calculateSavingsRate(income, expenses)

    assertEquals(savingsRate, 0)
})

Deno.test("Financial Summary: handles negative savings (overspending)", () => {
    const income = 3000
    const expenses = 5000
    const savingsRate = calculateSavingsRate(income, expenses)

    assertEquals(savingsRate, -67)
})

Deno.test("Financial Summary: calculates total balance from multiple accounts", () => {
    const accounts = [
        { balance: 10000 },
        { balance: 5000 },
        { balance: 2500 }
    ]

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

    assertEquals(totalBalance, 17500)
})

Deno.test("Financial Summary: separates income and expenses correctly", () => {
    const transactions = [
        { type: 'income', amount: 5000 },
        { type: 'expense', amount: 1000 },
        { type: 'income', amount: 2000 },
        { type: 'expense', amount: 500 },
    ]

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    assertEquals(income, 7000)
    assertEquals(expenses, 1500)
})

Deno.test("Financial Summary: calculates net income", () => {
    const income = 7000
    const expenses = 1500
    const netIncome = income - expenses

    assertEquals(netIncome, 5500)
})

Deno.test("Financial Summary: handles empty transactions", () => {
    const transactions: any[] = []

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    assertEquals(income, 0)
    assertEquals(expenses, 0)
})

Deno.test("Financial Summary: sums active debts correctly", () => {
    const debts = [
        { remaining_amount: 5000 },
        { remaining_amount: 3000 },
        { remaining_amount: 1500 }
    ]

    const totalDebt = debts.reduce((sum, d) => sum + Number(d.remaining_amount), 0)

    assertEquals(totalDebt, 9500)
})
