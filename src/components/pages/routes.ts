export type Route = 'home' | 'works' | 'self' | 'contact'

/** Maps each in-app route to its real URL path. */
export const ROUTE_PATHS: Record<Route, string> = {
  home: '/',
  works: '/works',
  self: '/self',
  contact: '/contact',
}

/** The persistent bottom bar, present on every page. */
export const NAV: { label: string; route: Route }[] = [
  { label: 'Home', route: 'home' },
  { label: 'Works', route: 'works' },
  { label: 'Self', route: 'self' },
]

export const EMAIL = 'arshadparangodat@gmail.com'

export const SOCIALS = [
  { label: 'Behance', href: 'https://www.behance.net/arshadParangodath', handle: '/arshadparangodath' },
  { label: 'Github', href: 'https://github.com/arshadparangodath', handle: '/arshadparangodath' },
  { label: 'Instagram', href: 'https://www.instagram.com/arshad.design/', handle: '@arshad.designs' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/arshadparangodath', handle: '/in/arshadparangodath' },
  { label: 'Medium', href: 'https://medium.com/@arshadparangodath', handle: '@arshadparangodath' },
  { label: 'Pinterest', href: 'https://www.pinterest.com/arshadparangodat', handle: '/arshadparangodath' },
  { label: 'Facebook', href: 'https://www.facebook.com/M.Arshad.parangodath/', handle: '/arshadparangodath' },
  { label: 'Email', href: `mailto:${EMAIL}`, handle: EMAIL },
]
