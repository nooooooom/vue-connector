import { isVue2 } from 'vue-lib-toolkit'
import { ComponentCreationType } from './types'
import { DefineComponent, cloneVNode, h } from 'vue'

export function isDefineComponent(component: ComponentCreationType): component is DefineComponent {
  return !!component && typeof component === 'object'
}

export function normalizeFunction<T extends (...args: any[]) => any>(
  func: unknown,
  candidate: Function = () => null
): T {
  return (typeof func === 'function' ? func : candidate) as T
}

export function normalizeSlots(): null
export function normalizeSlots(_slots: Record<string, any>): {
  slots: Record<string, any>
  scopedSlots: Record<string, any>
}
export function normalizeSlots(_slots?: Record<string, any>) {
  if (!_slots) {
    return null
  }

  const slots = {} as Record<string, any>
  const scopedSlots = {} as Record<string, any>

  for (const name in _slots) {
    const slot = _slots[name]
    const isFn = typeof slot === 'function'
    if (isVue2 && !isFn) {
      if (slot && typeof slot === 'object' && !Array.isArray(slot)) {
        slots[name] = cloneVNode(slot, {
          slot: name
        })
      } else {
        slots[name] = h(
          'template',
          {
            slot: name
          },
          slot
        )
      }
    } else {
      scopedSlots[name] = isFn ? slot : () => slot
    }
  }

  return {
    slots,
    scopedSlots
  }
}
