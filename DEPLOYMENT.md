# Deployment Guide - Render

## Problem
The application was failing to deploy on Render with the following error:
```
Error: /lib/x86_64-linux-gnu/libm.so.6: version `GLIBC_2.38' not found
```

This was caused by the `sqlite3` npm package, which requires native compilation and has GLIBC version compatibility issues on Render's Linux environment.

## Solution
Switched from `sqlite3` to `sql.js`, a pure JavaScript implementation of SQLite that:
- ✅ Requires no native compilation
- ✅ Works on all platforms (Windows, Linux, macOS)
- ✅ Has no GLIBC dependencies
- ✅ Is fully compatible with SQLite databases

## Changes Made

### 1. package.json
- **Removed**: `sqlite3: ^6.0.1`
- **Added**: `sql.js: ^1.10.3`

### 2. database/db.js
- Replaced `sqlite3` with `sql.js`
- Added async initialization function `initializeDatabase()`
- Added `ensureInitialized()` for backward compatibility
- Added `saveDatabase()` to persist changes to disk
- Created Promise-wrapped helper functions: `dbRun()`, `dbGet()`, `dbAll()`, `dbExec()`
- Database is now loaded from/saved to file on each operation

### 3. database/sqlite-report-repository.js
- Updated imports to use new helper functions from `db.js`
- Changed from callback-based to Promise-based database operations
- Updated to use `result.lastInsertRowid` instead of `this.lastID`

### 4. database/export-run-repository.js
- Updated imports to use new helper functions from `db.js`
- Changed from callback-based to Promise-based database operations
- Updated to use `result.lastInsertRowid` instead of `this.lastID`

### 5. database/migrate.js
- Updated imports to use new helper functions from `db.js`
- Added `saveDatabase()` call after migrations complete
- Simplified database operations using Promise wrappers

### 6. app.js
- Added database initialization before server starts
- Added graceful shutdown handlers to save database on exit
- Wrapped server startup in async function

## Important Notes for Deployment

### Database Persistence
With `sql.js`, the database is stored in memory and must be explicitly saved to disk:
- **On every write operation**: Changes are made in memory
- **On server shutdown**: Database is automatically saved via signal handlers
- **On migration**: Database is saved after migrations complete

### Render Configuration
No special configuration needed. The application will:
1. Start and initialize the database
2. Load existing database from `storage/data/quick-report.db` if it exists
3. Create a new database if it doesn't exist
4. Run migrations automatically on first run

### Environment Variables
No changes needed. The app still respects:
- `DB_PATH`: Custom database path (optional)
- `PORT`: Server port (default: 3000)

### File Storage
Ensure the `storage/data/` directory exists and is writable. The application will create it automatically if needed.

## Testing
All tests pass successfully:
```bash
npm test
# ✓ 27 tests passed
```

## Local Development
```bash
# Install dependencies
npm install

# Run server
npm start

# Run migrations
npm run migrate

# Run tests
npm test
```

## Rollback Plan
If issues arise, you can temporarily rollback to the previous `sqlite3` version by:
1. Reverting package.json to use `sqlite3: ^6.0.1`
2. Reverting the database files to their previous versions
3. Deploying with a Docker image that includes GLIBC 2.38+ compatibility

However, the `sql.js` solution is recommended for long-term stability across all deployment platforms.

## Performance Considerations
- `sql.js` is slightly slower than native `sqlite3` for very large datasets
- For typical web application workloads (thousands to tens of thousands of records), the performance difference is negligible
- The benefit of cross-platform compatibility outweighs the minor performance cost
- Database is saved to disk on shutdown, so no data loss occurs

## Support
If you encounter any issues with the new implementation:
1. Check that the `storage/data/` directory is writable
2. Verify the database file is not corrupted
3. Check Render logs for any initialization errors
4. Ensure the application has proper signal handling (SIGINT, SIGTERM)