// Test Utilities for Edge Functions
// Shared helpers for testing

export { assertEquals, assertExists, assert } from "https://deno.land/std@0.208.0/assert/mod.ts"

// Sample test data
export const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com'
}

export const mockAccount = {
    id: 'account-123',
    user_id: mockUser.id,
    name: 'Test Account',
    type: 'checking',
    balance: 10000,
    currency: 'MXN'
}

export const mockCategory = {
    id: 'category-123',
    user_id: mockUser.id,
    name: 'Comida',
    type: 'expense',
    icon: '🍔',
    color: '#FF6B6B'
}

export const mockTransaction = {
    id: 'transaction-123',
    user_id: mockUser.id,
    account_id: mockAccount.id,
    category_id: mockCategory.id,
    type: 'expense',
    amount: 500,
    description: 'Súper del mes',
    date: '2025-11-18',
    source: 'manual'
}

export const mockBudget = {
    id: 'budget-123',
    user_id: mockUser.id,
    category_id: mockCategory.id,
    amount: 5000,
    period: 'monthly',
    start_date: '2025-11-01',
    end_date: '2025-11-30'
}

export const mockDebt = {
    id: 'debt-123',
    user_id: mockUser.id,
    name: 'Tarjeta BBVA',
    type: 'credit_card',
    total_amount: 10000,
    remaining_amount: 7500,
    interest_rate: 2.5,
    minimum_payment: 500,
    status: 'active'
}

// Helper to calculate savings rate
export function calculateSavingsRate(income: number, expenses: number): number {
    if (income === 0) return 0
    return Math.round(((income - expenses) / income) * 100)
}

// Helper to calculate budget percentage
export function calculateBudgetPercentage(spent: number, budget: number): number {
    if (budget === 0) return 0
    return Math.min(Math.round((spent / budget) * 100), 100)
}

// Date helpers
export function getStartOfMonth(date: Date = new Date()): string {
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
}

export function getEndOfMonth(date: Date = new Date()): string {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
}
