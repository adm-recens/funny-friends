-- Teen Patti Local Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable, but included for completeness)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- (These will be created by Prisma, but we can add custom ones here if needed)

-- Grant permissions to the user
-- (This is handled by Docker environment variables)

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Teen Patti database initialized successfully';
END $$;