import { useSyncExternalStore } from 'react'
import { getProjects, subscribe } from '../data/projectStore'

/** Live view of the CMS-backed project list. */
export function useProjects() {
  return useSyncExternalStore(subscribe, getProjects, getProjects)
}
