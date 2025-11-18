// Unit Tests for debt management

import { assertEquals } from "../_shared/test-utils.ts"

Deno.test("Debt: calculates remaining amount after payment", () => {
    const currentRemaining = 7500
    const paymentAmount = 1000
    const newRemaining = currentRemaining - paymentAmount

    assertEquals(newRemaining, 6500)
})

Deno.test("Debt: marks debt as paid off when remaining is zero", () => {
    const remaining = 500
    const payment = 500
    const newRemaining = remaining - payment
    const status = newRemaining <= 0 ? 'paid_off' : 'active'

    assertEquals(status, 'paid_off')
})

Deno.test("Debt: marks debt as paid off when overpaying", () => {
    const remaining = 500
    const payment = 1000
    const newRemaining = Math.max(0, remaining - payment)
    const status = newRemaining <= 0 ? 'paid_off' : 'active'

    assertEquals(newRemaining, 0)
    assertEquals(status, 'paid_off')
})

Deno.test("Debt: keeps debt active when partial payment", () => {
    const remaining = 7500
    const payment = 1000
    const newRemaining = remaining - payment
    const status = newRemaining <= 0 ? 'paid_off' : 'active'

    assertEquals(status, 'active')
})

Deno.test("Debt: validates debt types", () => {
    const validTypes = ['credit_card', 'loan', 'mortgage']

    assertEquals(validTypes.includes('credit_card'), true)
    assertEquals(validTypes.includes('loan'), true)
    assertEquals(validTypes.includes('mortgage'), true)
    assertEquals(validTypes.includes('invalid'), false)
})

Deno.test("Debt: calculates total interest for simple interest", () => {
    const principal = 10000
    const annualRate = 12 // 12% annual
    const months = 12

    // Simple interest formula
    const totalInterest = (principal * (annualRate / 100) * (months / 12))

    assertEquals(totalInterest, 1200)
})

Deno.test("Debt: calculates minimum payment percentage", () => {
    const remaining = 10000
    const minimumPayment = 500
    const percentage = (minimumPayment / remaining) * 100

    assertEquals(percentage, 5)
})
