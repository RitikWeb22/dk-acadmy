
Role: Senior UI/UX Designer & Frontend Engineer.
Task: Create a unified global design system for "DK Academy" (IIT-JEE EdTech platform).

Core Issues to Fix:

1. Low contrast on muted pill tags (e.g., light blue on white, faint yellow badges).
2. Cluttered text hierarchy and inconsistent card corner radiuses (mix of 8px, 12px, 16px).
3. Inconsistent CTA hierarchy (primary vs secondary buttons blending together).

Design Tokens to Implement:

- Colors:
  * Primary: Deep Electric Indigo (#2563EB or #1D4ED8)
  * Dark Surface: Rich Navy / Slate 950 (#0A0F1D) for Footers & Dark Cards
  * Background: Clean Crisp (#F8FAFC) for app pages, pure (#FFFFFF) for cards
  * Accent/Badge: Amber (#D97706) for warnings/tags, Emerald (#059669) for success/free
- Typography:
  * Inter or Plus Jakarta Sans
  * Headings: Font weight 700/800 with tight tracking (-0.02em)
  * Body: Slate-600/Slate-700 with 1.6 line-height for high readability
- Card & Container Architecture:
  * Uniform border-radius: 14px
  * Border: 1px solid #E2E8F0
  * Subtle hover lift: translateY(-2px) with soft elevation shadow
- Consistent Navbar & Footer across all 7 pages.
