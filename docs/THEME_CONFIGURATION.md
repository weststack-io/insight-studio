# Theme Configuration Guide

Insight Studio supports multi-tenant white-label branding through a flexible theme system. Each tenant can have its own custom colors, fonts, and logo that are automatically applied based on the domain.

## Overview

Themes are stored in the database as `Tenant` records and are automatically detected based on the request domain. The theme system uses CSS custom properties (variables) that are dynamically applied to the document root.

## How It Works

1. **Domain Detection**: The app extracts the domain from request headers (`app/layout.tsx`)
2. **Tenant Lookup**: The tenant is loaded from the database by domain (`lib/branding/theme.ts`)
3. **CSS Variable Application**: The `ThemeProvider` component applies CSS variables to the document root (`components/branding/ThemeProvider.tsx`)
4. **CSS Usage**: Your stylesheets use these variables via utility classes (`app/globals.css`)

## Theme Fields

Each tenant theme supports the following configuration:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | - | Display name of the tenant/company |
| `domain` | string | Optional | - | Unique domain for automatic theme detection |
| `primaryColor` | string | Yes | `#000000` | Primary brand color (hex format) |
| `secondaryColor` | string | Yes | `#666666` | Secondary brand color (hex format) |
| `fontFamily` | string | Optional | `system-ui, sans-serif` | Custom font family |
| `logoUrl` | string | Optional | - | URL to the tenant's logo image |

## CSS Variables

The theme system exposes the following CSS custom properties:

- `--color-primary`: Primary brand color
- `--color-secondary`: Secondary brand color
- `--font-family`: Custom font family
- `--logo-url`: Logo image URL (as CSS `url()`)

## Available CSS Utility Classes

The following utility classes are available in `app/globals.css`:

- `.bg-primary` - Background using primary color
- `.bg-secondary` - Background using secondary color
- `.text-primary` - Text color using primary color
- `.text-secondary` - Text color using secondary color
- `.border-primary` - Border color using primary color
- `.border-secondary` - Border color using secondary color

## Adding a New Theme

### Option 1: Using the Script (Recommended)

We provide a script template for adding new themes. You can use the existing West Stack Advisors script as a template:

```bash
npm run theme:add-weststack
```

To create a new theme script, copy `scripts/add-weststack-theme.ts` and modify it with your tenant details.

### Option 2: Using Prisma Studio

1. Run Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. Navigate to the `Tenant` model
3. Click "Add record"
4. Fill in the theme fields
5. Save

### Option 3: Direct Database Insert

You can insert a tenant directly using SQL:

```sql
INSERT INTO tenants (
  id, 
  name, 
  domain, 
  primary_color, 
  secondary_color, 
  font_family, 
  logo_url, 
  created_at, 
  updated_at
)
VALUES (
  NEWID(),
  'Your Company Name',
  'yourcompany.com',
  '#1E3A5F',
  '#4A90E2',
  'Inter, system-ui, sans-serif',
  'https://example.com/logo.png',
  GETDATE(),
  GETDATE()
);
```

### Option 4: Using Prisma Client in Code

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTheme() {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Your Company Name',
      domain: 'yourcompany.com',
      primaryColor: '#1E3A5F',
      secondaryColor: '#4A90E2',
      fontFamily: 'Inter, system-ui, sans-serif',
      logoUrl: 'https://example.com/logo.png',
    },
  });
  
  console.log('Theme created:', tenant);
}

createTheme();
```

## Example: West Stack Advisors Theme

The West Stack Advisors theme demonstrates a modern, professional look:

```typescript
{
  name: 'West Stack Advisors',
  domain: 'weststackadvisors.com',
  primaryColor: '#1E3A5F',      // Deep navy blue - strength & reliability
  secondaryColor: '#4A90E2',    // Modern slate blue - professional
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
}
```

## Updating an Existing Theme

### Using Prisma Studio

1. Run `npm run db:studio`
2. Find your tenant record
3. Edit the fields you want to change
4. Save

### Using Prisma Client

```typescript
await prisma.tenant.update({
  where: { domain: 'yourcompany.com' },
  data: {
    primaryColor: '#NEW_COLOR',
    // ... other fields
  },
});
```

## Testing Themes Locally

To test a theme locally, you can:

1. **Modify hosts file** (for domain-based testing):
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - Mac/Linux: `/etc/hosts`
   
   Add: `127.0.0.1 yourcompany.com`

2. **Access via domain**: `http://yourcompany.com:3000`

3. **Or use a different domain** in your tenant record for local testing

## Color Selection Tips

When choosing colors for your theme:

- **Primary Color**: Should be your main brand color, used for primary actions, headings, and key UI elements
- **Secondary Color**: Should complement the primary, used for secondary actions, accents, and highlights
- **Accessibility**: Ensure sufficient contrast ratios (WCAG AA minimum: 4.5:1 for normal text, 3:1 for large text)
- **Professional Look**: For financial/wealth management, consider:
  - Deep blues and navies (trust, reliability)
  - Slate grays (professionalism)
  - Forest greens (growth, stability)

## Font Selection

Recommended fonts for professional applications:

- **Inter**: Modern, highly readable (`Inter, system-ui, sans-serif`)
- **Roboto**: Clean and professional (`Roboto, sans-serif`)
- **Open Sans**: Friendly yet professional (`'Open Sans', sans-serif`)
- **System Fonts**: Fast and native (`system-ui, -apple-system, sans-serif`)

Always include fallback fonts in your `fontFamily` string.

## Logo Guidelines

- **Format**: PNG, SVG, or JPG
- **Size**: Recommended 200x50px or similar aspect ratio
- **Background**: Transparent PNG preferred for flexibility
- **Hosting**: Use a CDN or reliable hosting service
- **URL**: Must be publicly accessible (not localhost)

## Architecture

### Key Files

- `lib/branding/theme.ts` - Tenant lookup functions
- `components/branding/ThemeProvider.tsx` - React context provider that applies CSS variables
- `app/layout.tsx` - Root layout that detects tenant and wraps app with ThemeProvider
- `app/globals.css` - Global styles and utility classes using CSS variables

### Flow Diagram

```
Request → Extract Domain → Lookup Tenant → Apply CSS Variables → Render UI
```

1. User visits `yourcompany.com`
2. `extractDomainFromHeaders()` gets domain from request
3. `getTenantByDomain()` queries database
4. `ThemeProvider` receives tenant and sets CSS variables on `document.documentElement`
5. CSS classes use `var(--color-primary)`, etc.

## Troubleshooting

### Theme Not Applying

1. **Check domain match**: Ensure the domain in your tenant record exactly matches the request domain
2. **Verify database connection**: Make sure your app can connect to the database
3. **Check browser console**: Look for any JavaScript errors
4. **Inspect CSS variables**: Use browser DevTools to check if CSS variables are set on `:root`

### Colors Not Showing

1. **Verify CSS variable names**: Check that you're using `--color-primary` and `--color-secondary`
2. **Check utility classes**: Ensure you're using the correct class names (`.bg-primary`, `.text-primary`, etc.)
3. **Inspect computed styles**: Use browser DevTools to see what values are being applied

### Font Not Loading

1. **Check font name**: Ensure the font name matches exactly (case-sensitive)
2. **Verify font availability**: If using a web font, ensure it's loaded before the theme applies
3. **Check fallbacks**: Make sure fallback fonts are included in the `fontFamily` string

## Best Practices

1. **Always include fallback colors**: The system provides defaults, but ensure your colors work well
2. **Test accessibility**: Use tools like WebAIM Contrast Checker to verify color contrast
3. **Use semantic naming**: Consider what each color represents in your brand
4. **Keep it simple**: Start with primary and secondary colors, add more complexity as needed
5. **Document your choices**: Note why you chose specific colors for future reference

## Future Enhancements

Potential additions to the theme system:

- Additional color variables (accent, background, text colors)
- Dark mode support
- Custom CSS injection
- Theme preview interface
- Bulk theme import/export


