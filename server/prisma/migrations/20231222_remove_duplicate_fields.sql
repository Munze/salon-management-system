-- Copy data from Therapist to User
UPDATE "User" u
SET name = t.name,
    email = t.email,
    phone = t.phone
FROM "Therapist" t
WHERE u.id = t.userId;

-- Drop columns from Therapist
ALTER TABLE "Therapist" DROP COLUMN IF EXISTS name;
ALTER TABLE "Therapist" DROP COLUMN IF EXISTS email;
ALTER TABLE "Therapist" DROP COLUMN IF EXISTS phone;
