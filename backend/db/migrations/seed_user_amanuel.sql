-- Seed the users table with Amanuel Yohannes if not already present
INSERT INTO users (
    email,
    name,
    is_verified,
    hashed_password,
    created_at,
    updated_at
)
SELECT
    'amanuel@reliancefactoring.com',
    'Amanuel Yohannes',
    TRUE,
    NULL,
    NOW(),
    NOW()
FROM (
    SELECT 1 AS available
) AS guard
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'amanuel@reliancefactoring.com'
);
