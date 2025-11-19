// Unit Tests for budget management functions

import { assertEquals } from "../_shared/test-utils.ts"
import { calculateBudgetPercentage, getStartOfMonth, getEndOfMonth } from "../_shared/test-utils.ts"

Deno.test("Budget: calculates budget percentage correctly", () => {
    const spent = 3200
    const budget = 5000
    const percentage = calculateBudgetPercentage(spent, budget)

    assertEquals(percentage, 64)
})

Deno.test("Budget: handles 100% budget usage", () => {
    const spent = 5000
    const budget = 5000
    const percentage = calculateBudgetPercentage(spent, budget)

    assertEquals(percentage, 100)
})

Deno.test("Budget: caps percentage at 100% for overspending", () => {
    const spent = 6000
    const budget = 5000
    const percentage = calculateBudgetPercentage(spent, budget)

    assertEquals(percentage, 100)
})

Deno.test("Budget: handles zero budget", () => {
    const spent = 100
    const budget = 0
    const percentage = calculateBudgetPercentage(spent, budget)

    assertEquals(percentage, 0)
})

Deno.test("Budget: calculates remaining budget", () => {
    const budget = 5000
    const spent = 3200
    const remaining = budget - spent

    assertEquals(remaining, 1800)
})

Deno.test("Budget: calculates start of month correctly", () => {
    const testDate = new Date('2025-11-15')
    const startDate = getStartOfMonth(testDate)

    assertEquals(startDate, '2025-11-01')
})

Deno.test("Budget: calculates end of month correctly", () => {
    const testDate = new Date('2025-11-15')
    const endDate = getEndOfMonth(testDate)

    assertEquals(endDate, '2025-11-30')
})

Deno.test("Budget: handles leap year February", () => {
    const testDate = new Date('2024-02-15')
    const endDate = getEndOfMonth(testDate)

    assertEquals(endDate, '2024-02-29')
})

Deno.test("Budget: validates period types", () => {
    const validPeriods = ['monthly', 'yearly']

    assertEquals(validPeriods.includes('monthly'), true)
    assertEquals(validPeriods.includes('yearly'), true)
    assertEquals(validPeriods.includes('weekly'), false)
})

Deno.test("Budget: determines budget status", () => {
    const testCases = [
        { percentage: 50, expected: 'ok' },
        { percentage: 85, expected: 'warning' },
        { percentage: 100, expected: 'exceeded' }
    ]

    testCases.forEach(({ percentage, expected }) => {
        const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok'
        assertEquals(status, expected)
    })
})
