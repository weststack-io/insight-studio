# How to Create an Advisor Test Account

There are two ways to create an advisor account:

## Method 1: Update Existing User (Recommended)

If you already have a user account in the system:

1. **Sign in** to the application at least once (so your user account exists in the database)

2. **Run the script** to set your role to advisor:

   ```bash
   npx tsx scripts/set-user-role.ts your-email@example.com advisor
   ```

3. **Sign out and sign back in** to refresh your session with the new role

4. **Verify** you can see the Reviews page in the navigation

## Method 2: Direct Database Update

If you prefer to update the database directly:

### Using SQL:

```sql
-- Find your user
SELECT id, email, name, role, tenant_id
FROM users
WHERE email = 'your-email@example.com';

-- Update your role to advisor
UPDATE users
SET role = 'advisor'
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, name, role
FROM users
WHERE email = 'your-email@example.com';
```

### Using Prisma Studio:

1. Run `npx prisma studio`
2. Navigate to the `User` model
3. Find your user by email
4. Edit the `role` field and set it to `"advisor"`
5. Save

## Method 3: Create New Test User

If you want to create a completely new test user:

1. **Sign in** with a new email address (via Azure AD)

   - The user will be automatically created with role `"family_member"`

2. **Update the role** using Method 1 or Method 2 above

## Verify Advisor Access

After setting your role to advisor:

1. **Sign out and sign back in**
2. **Check the Reviews page** - you should see:

   - All pending reviews (not just your own)
   - Approve/Reject/Request Changes buttons on pending reviews
   - Review actions should work

3. **Check the Header** - you should see the "Reviews" navigation link

## Troubleshooting

### "User not found" error

- Make sure you've signed in at least once
- Check that your email matches exactly (case-sensitive)
- Verify the user exists: `npx tsx scripts/list-tenants.ts` (if it shows users)

### Role not updating after sign in/out

- Clear your browser cookies/session
- Try signing out completely and signing back in
- Check the database to verify the role was actually updated

### Still can't see Reviews page

- Verify your role in the database: `SELECT email, role FROM users WHERE email = 'your-email@example.com'`
- Check that the role is exactly `"advisor"` (not `"Advisor"` or `"ADVISOR"`)
- Make sure you're looking at the correct tenant (if multi-tenant)

## Quick Reference

```bash
# Set your role to advisor
npx tsx scripts/set-user-role.ts your-email@example.com advisor

# Set role back to regular user
npx tsx scripts/set-user-role.ts your-email@example.com family_member

# Set role to trustee
npx tsx scripts/set-user-role.ts your-email@example.com trustee
```

## Valid Roles

- `family_member` - Regular user (default)
- `trustee` - Trustee role
- `advisor` - Advisor role (can review content)
