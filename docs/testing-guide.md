# Testing Guide

## Local Testing

### Prerequisites

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Install Deno
brew install deno

# Verify installations
supabase --version
deno --version
```

### Quick Start

```bash
# Run all tests
./scripts/test-local.sh
```

This script will:
1. ✅ Start Supabase locally
2. ✅ Apply migrations
3. ✅ Run unit tests
4. ✅ Generate coverage
5. ✅ Test Edge Functions

### Manual Testing

#### 1. Start Supabase

```bash
supabase start
```

This will:
- Start PostgreSQL (port 54322)
- Start Studio UI (port 54323)
- Start Edge Functions runtime (port 54321)
- Apply migrations automatically

#### 2. Run Unit Tests

```bash
# All tests
deno test --allow-all supabase/functions/**/*.test.ts

# Specific function
deno test --allow-all supabase/functions/get-financial-summary/index.test.ts

# Watch mode
deno test --allow-all --watch supabase/functions/**/*.test.ts
```

#### 3. Run with Coverage

```bash
# Generate coverage
deno test --allow-all --coverage=coverage/ supabase/functions/**/*.test.ts

# View LCOV report
deno coverage coverage/ --lcov

# Generate HTML report
deno coverage coverage/ --html
open coverage/html/index.html
```

#### 4. Test Edge Functions

```bash
# Start functions server
supabase functions serve

# In another terminal, test with curl
curl -X POST http://localhost:54321/functions/v1/get-financial-summary \
  -H "Authorization: Bearer $(supabase status | grep 'anon key' | awk '{print $3}')" \
  -H "Content-Type: application/json" \
  -d '{"period": "monthly"}'
```

#### 5. Access Supabase Studio

```bash
# Get Studio URL
supabase status

# Open in browser
open http://localhost:54323
```

From Studio you can:
- View tables and data
- Run SQL queries
- Test RLS policies
- View logs

### Database Testing

#### Test Migrations

```bash
# Reset database (reapply all migrations)
supabase db reset

# Check migration status
supabase migration list

# Create new migration
supabase migration new my_migration_name
```

#### Test RLS Policies

```bash
# Access psql
psql postgresql://postgres:postgres@localhost:54322/postgres

# Test as authenticated user
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claim.sub = 'test-user-id';
SELECT * FROM accounts;

# Should only see that user's accounts
```

### Cleanup

```bash
# Stop Supabase
supabase stop

# Stop and remove volumes (fresh start)
supabase stop --no-backup
```

## CI/CD Testing

### GitHub Actions

Tests run automatically on:
- Push to `main`, `master`, or `feature/financial-assistant`
- Pull requests to `main` or `master`

Workflow: `.github/workflows/test.yml`

### What Gets Tested

1. **Database Tests**
   - Migrations apply cleanly
   - All tables exist
   - Schema is correct

2. **Unit Tests**
   - Financial calculations
   - Budget logic
   - Debt management
   - Transaction handling

3. **Integration Tests**
   - Edge Functions start correctly
   - Can make HTTP requests
   - Responses are valid JSON

4. **Lint & Format**
   - TypeScript code quality
   - Consistent formatting

### View Test Results

- Go to Actions tab in GitHub
- Click on latest workflow run
- View logs for each job

## Troubleshooting

### Supabase won't start

```bash
# Check if ports are in use
lsof -i :54321
lsof -i :54322

# Kill existing processes
supabase stop --no-backup

# Start fresh
supabase start
```

### Deno tests fail

```bash
# Clear Deno cache
deno cache --reload supabase/functions/**/*.ts

# Upgrade Deno
deno upgrade
```

### Migrations fail

```bash
# Check migration syntax
cat supabase/migrations/*.sql

# Apply manually
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/migrations/20251118_initial_schema.sql
```

### Edge Functions error

```bash
# Check logs
supabase functions logs get-financial-summary

# Test with verbose logging
supabase functions serve --debug
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Critical paths**: 100% (transactions, budgets)
- **Edge cases**: All error scenarios tested

## Adding New Tests

### For a new Edge Function

1. Create `your-function/index.test.ts`
2. Import test utilities
3. Write tests for:
   - Happy path
   - Error cases
   - Edge cases
   - Input validation

```typescript
import { assertEquals } from "../_shared/test-utils.ts"

Deno.test("Your Function: does something", () => {
  // Test logic
  assertEquals(result, expected)
})
```

### For database changes

1. Update migrations
2. Test with `supabase db reset`
3. Verify schema with `supabase db diff`

## Useful Commands

```bash
# Run specific test file
deno test --allow-all supabase/functions/manage-transaction/index.test.ts

# Run tests matching pattern
deno test --allow-all --filter "Budget" supabase/functions/**/*.test.ts

# Show test output
deno test --allow-all --nocapture

# Parallel test execution (default)
deno test --allow-all --parallel

# Sequential testing
deno test --allow-all --jobs=1
```
