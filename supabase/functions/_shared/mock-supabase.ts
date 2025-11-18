// Mock Supabase Client for Testing
// Simulates Supabase client responses for unit tests

export interface MockData {
    accounts?: any[]
    payment_methods?: any[]
    categories?: any[]
    transactions?: any[]
    budgets?: any[]
    debts?: any[]
    debt_payments?: any[]
    products?: any[]
    documents?: any[]
    receipt_line_items?: any[]
    merchant_patterns?: any[]
    product_price_history?: any[]
}

export function createMockSupabaseClient(mockData: MockData = {}) {
    return {
        auth: {
            getUser: () => Promise.resolve({
                data: {
                    user: {
                        id: 'test-user-id',
                        email: 'test@example.com'
                    }
                },
                error: null
            })
        },
        from: (table: string) => {
            const data = mockData[table as keyof MockData] || []

            return {
                select: (columns?: string) => ({
                    eq: (column: string, value: any) => ({
                        single: () => Promise.resolve({ data: data[0] || null, error: null }),
                        maybeSingle: () => Promise.resolve({ data: data[0] || null, error: null }),
                        limit: (n: number) => Promise.resolve({ data: data.slice(0, n), error: null }),
                        gte: (col: string, val: any) => ({
                            lte: (col2: string, val2: any) => Promise.resolve({ data, error: null })
                        }),
                        order: (col: string, opts?: any) => Promise.resolve({ data, error: null })
                    }),
                    gte: (column: string, value: any) => ({
                        lte: (col: string, val: any) => Promise.resolve({ data, error: null })
                    }),
                    in: (column: string, values: any[]) => Promise.resolve({ data, error: null })
                }),
                insert: (values: any) => ({
                    select: () => ({
                        single: () => Promise.resolve({
                            data: { id: 'new-id', ...values },
                            error: null
                        })
                    })
                }),
                update: (values: any) => ({
                    eq: (column: string, value: any) => ({
                        select: () => ({
                            single: () => Promise.resolve({
                                data: { ...data[0], ...values },
                                error: null
                            })
                        })
                    })
                }),
                delete: () => ({
                    eq: (column: string, value: any) => Promise.resolve({ error: null })
                }),
                rpc: (fnName: string, params: any) => {
                    if (fnName === 'increment_balance') {
                        return Promise.resolve({ error: null })
                    }
                    return Promise.resolve({ data: null, error: null })
                }
            }
        },
        storage: {
            from: (bucket: string) => ({
                upload: (path: string, file: any, options?: any) =>
                    Promise.resolve({ data: { path }, error: null }),
                getPublicUrl: (path: string) => ({
                    data: { publicUrl: `https://example.com/storage/${path}` }
                })
            })
        }
    }
}

// Mock Request helper
export function createMockRequest(body: any = {}, headers: Record<string, string> = {}) {
    return {
        method: 'POST',
        headers: {
            get: (key: string) => headers[key] || 'Bearer test-token',
            ...headers
        },
        json: () => Promise.resolve(body),
        formData: () => {
            const formData = new FormData()
            if (body.file) {
                formData.append('file', body.file)
            }
            return Promise.resolve(formData)
        }
    } as Request
}

// Mock Response helper
export function parseMockResponse(response: Response) {
    return {
        status: response.status,
        json: () => response.json()
    }
}
