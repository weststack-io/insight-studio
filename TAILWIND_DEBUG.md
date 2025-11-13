# Tailwind CSS Debugging Guide

## Current Setup
- Tailwind CSS v4.1.17
- Using `@tailwindcss/postcss` plugin
- CSS import: `@import "tailwindcss"` in `app/globals.css`

## Steps to Verify Tailwind is Working

### 1. Test Page
Visit `/test-tailwind` to see if basic Tailwind classes work:
- Should see colored boxes, buttons, and a gradient
- If you see colors, Tailwind is working!

### 2. Check Browser DevTools
1. Open browser DevTools (F12)
2. Inspect an element with Tailwind classes
3. Check the Computed styles - you should see Tailwind utility classes applied
4. Check the Styles panel - look for Tailwind-generated CSS

### 3. Check Generated CSS
1. In DevTools, go to Sources tab
2. Look for `_app/globals.css` or similar
3. Search for Tailwind class names (e.g., `bg-gray-50`, `rounded-xl`)
4. If classes are present, Tailwind is generating CSS

### 4. Common Issues

#### Issue: Classes not applying
**Possible causes:**
- Dev server needs restart after config changes
- CSS not being imported correctly
- Content paths not configured (Tailwind v4 should auto-detect)

**Solution:**
```bash
# Stop dev server (Ctrl+C)
# Restart it
npm run dev
```

#### Issue: Some classes work, others don't
**Possible causes:**
- Custom CSS overriding Tailwind
- Specificity issues
- Missing Tailwind utilities

**Check:**
- Look for `!important` in custom CSS
- Check if body/html styles are overriding

#### Issue: No Tailwind styles at all
**Possible causes:**
- PostCSS not processing correctly
- Tailwind import not working
- Config issue

**Solution:**
1. Verify `postcss.config.mjs` has `@tailwindcss/postcss`
2. Verify `app/globals.css` has `@import "tailwindcss"`
3. Check console for errors

## Quick Test

Add this to any page to test:
```tsx
<div className="bg-red-500 text-white p-4 rounded">
  If this is red with white text, Tailwind works!
</div>
```

## If Tailwind Still Doesn't Work

1. **Check package.json** - ensure `tailwindcss` and `@tailwindcss/postcss` are installed
2. **Check postcss.config.mjs** - should have the plugin configured
3. **Check app/globals.css** - should import Tailwind
4. **Restart dev server** - always restart after config changes
5. **Clear Next.js cache** - delete `.next` folder and restart

## Tailwind v4 Specific Notes

- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- Auto-detects content by default (no config needed)
- Uses `@tailwindcss/postcss` plugin
- May need explicit content paths in some cases

