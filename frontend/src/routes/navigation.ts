export function getSelectedNavKey(pathname: string): string {
  if (pathname.startsWith('/clients')) {
    return '/clients'
  }

  if (pathname.startsWith('/projects')) {
    return '/projects'
  }

  if (pathname.startsWith('/audit')) {
    return '/audit'
  }

  return '/dashboard'
}

export function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard' || pathname === '/') {
    return 'Dashboard'
  }

  if (pathname === '/clients') {
    return 'Clients'
  }

  if (pathname === '/clients/new') {
    return 'Create Client'
  }

  if (pathname.startsWith('/clients/')) {
    return 'Client Detail'
  }

  if (pathname === '/projects') {
    return 'Projects'
  }

  if (pathname === '/projects/new') {
    return 'Create Project'
  }

  if (pathname.startsWith('/projects/')) {
    return 'Project Detail'
  }

  if (pathname.startsWith('/audit')) {
    return 'Audit Event Viewer'
  }

  return 'CBOS'
}
