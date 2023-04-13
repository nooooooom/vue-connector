import { isVue2 } from 'vue-lib-toolkit'
import { ComponentCreationType } from './types'
import { DefineComponent } from 'vue'

export function normalizeFunction<T extends (...args: any[]) => any>(
  func: unknown,
  candidate: Function = () => null
): T {
  return (typeof func === 'function' ? func : candidate) as T
}

export interface NormalizedSlots {
  scoped: boolean
  slots: Record<string, any> | undefined
}

export function normalizeSlots(slots?: Record<string, any>): NormalizedSlots {
  if (!slots) {
    return {
      scoped: false,
      slots
    }
  }

  if (isVue2) {
    let isScoped = false
    for (const name in slots) {
      if (typeof slots[name] === 'function') {
        isScoped = true
        break
      }
    }
    if (!isScoped) {
      return {
        scoped: false,
        slots
      }
    }
  }

  const normalizedSlots = {} as Record<string, any>
  for (const name in slots) {
    const slot = slots[name]
    normalizedSlots[name] = typeof slot === 'function' ? slot : () => slot
  }

  return {
    scoped: true,
    slots: normalizedSlots
  }
}

export function isDefineComponent(component: ComponentCreationType): component is DefineComponent {
  return !!component && typeof component === 'object'
}
