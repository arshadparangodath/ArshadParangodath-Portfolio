import { useSyncExternalStore } from 'react'
import { getProjects, isLoaded, subscribe } from '../data/projectStore'

/** Live view of the CMS-backed project list. */
export function useProjects() {
  return useSyncExternalStore(subscribe, getProjects, getProjects)
}

/** Whether the initial fetch from the server has completed. */
export function useProjectsLoaded() {
  return useSyncExternalStore(subscribe, isLoaded, isLoaded)
}
