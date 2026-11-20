# UI/UX Design System

## Product direction

The To-Do application uses a premium, minimal SaaS visual language: clean surfaces, clear hierarchy, restrained color, compact controls, and accessible contrast.

## Color palette

| Role | HEX | CSS variable |
|---|---|---|
| Primary | `#4F46E5` | `--color-primary` |
| Primary hover | `#4338CA` | `--color-primary-hover` |
| Primary soft | `#EEF2FF` | `--color-primary-soft` |
| Secondary lavender | `#A78BFA` | `--color-secondary` |
| Background | `#F5F7FB` | `--color-background` |
| Surface | `#FFFFFF` | `--color-surface` |
| Text | `#1F2937` | `--color-text` |
| Muted text | `#64748B` | `--color-text-muted` |
| Border | `#E2E8F0` | `--color-border` |
| Success | `#15803D` | `--color-success` |
| Success soft | `#DCFCE7` | `--color-success-soft` |
| Warning | `#B45309` | `--color-warning` |
| Warning soft | `#FEF3C7` | `--color-warning-soft` |
| Error | `#DC2626` | `--color-danger` |
| Error soft | `#FEE2E2` | `--color-danger-soft` |
| Information | `#2563EB` | `--color-info` |

## Typography

- Font stack: Inter, followed by system sans-serif fallbacks.
- H1: 32 px, bold, 1.15 line height.
- H2: 24 px, bold.
- Body: 16 px, regular.
- Small: 14 px.
- Caption: 12 px.
- Interactive labels: 14 px or 16 px, bold.

## Spacing

Use the provided `--space-*` scale: 4, 8, 12, 16, 20, 24, 32, 40, and 48 px. Base layout padding is 32 px on desktop and 16 px on small screens.

## Components

- **Primary button:** solid indigo, white text, 44 px minimum height.
- **Secondary button:** white surface, border, dark text.
- **Danger button:** red surface for confirmed destructive actions.
- **Input/select/textarea:** 46 px minimum field height, 1 px border, visible focus ring.
- **Task/stat/card:** white surface, light border, subtle low-elevation shadow.
- **Badges:** compact pill shapes; green for completed, amber for pending, red for high priority or errors.
- **Filter tabs:** pill controls with an indigo selected state.
- **Sidebar/navigation:** 260 px desktop width; fixed bottom navigation on mobile.
- **Modal:** centered, white surface, 20 px+ radius, strong but short-duration shadow.
- **Notifications:** inline success/error surfaces; do not use fake sample data.
- **Empty/loading/error states:** clear status text, optional action, and no fabricated counts.

## Accessibility

- Preserve visible keyboard focus.
- Use labels for every field and `aria-invalid="true"` for invalid fields.
- Keep icon-only controls accompanied by accessible names.
- Do not communicate status by color alone.
- Confirmation dialogs must identify the affected task.
- Maintain at least 44 px touch targets.

## Responsive behavior

- Desktop: 260 px sidebar and multi-column dashboards.
- Tablet: two-column task/card layouts.
- Mobile: one-column layout, bottom navigation, stacked actions, and horizontally scrollable tables.
