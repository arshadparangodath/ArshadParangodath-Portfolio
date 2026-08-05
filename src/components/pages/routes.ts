export type Route = 'home' | 'works' | 'self' | 'contact'

/** The persistent bottom bar, present on every page. */
export const NAV: { label: string; route: Route }[] = [
  { label: 'Home', route: 'home' },
  { label: 'Works', route: 'works' },
  { label: 'Self', route: 'self' },
]

export const EMAIL = 'arshadparangodat@gmail.com'

export const SOCIALS = [
  { label: 'Behance', href: 'https://www.behance.net/', handle: '/arshadparangodath' },
  { label: 'Dribbble', href: 'https://dribbble.com/', handle: '/arshadp' },
  { label: 'Instagram', href: 'https://www.instagram.com/', handle: '@arshad.designs' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/', handle: '/in/arshadparangodath' },
  { label: 'Medium', href: 'https://medium.com/', handle: '@arshadparangodath' },
  { label: 'Pinterest', href: 'https://www.pinterest.com/', handle: '/arshadparangodath' },
  { label: 'Facebook', href: 'https://www.facebook.com/', handle: '/arshadparangodath' },
  { label: 'Email', href: `mailto:${EMAIL}`, handle: EMAIL },
]
