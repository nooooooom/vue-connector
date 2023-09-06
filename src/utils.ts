import { cloneVNode, isVue2 } from 'vue-lib-toolkit'
import Vue, { ComponentOptions, DefineComponent, h } from 'vue-module-demi'
import { ComponentCreationType } from './types'

export function isDefineComponent(component: ComponentCreationType): component is DefineComponent {
  return !!component && typeof component === 'object'
}

const camelizeRE = /-(\w)/g
const camelize = (str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
}

function normalizeProps(props: Record<string, any>) {
  const normalizedProps: Record<string, any> = {}
  for (const prop in props) {
    normalizedProps[camelize(prop)] = props[prop]
  }
  return normalizedProps
}

const defaultStrat = (parentVal: any, childVal: any): any => {
  return childVal === undefined ? parentVal : childVal
}

export function resolveComponentPropsDefinition(component: ComponentCreationType) {
  let propsDefinition = {}

  if (component !== null && typeof component === 'object') {
    const componentOptions = component as ComponentOptions<any> | DefineComponent

    if (isVue2) {
      const mergeProps = (child: any) => {
        if (child.props) {
          const strats = (Vue as any).config.optionMergeStrategies
          const start = strats.props || defaultStrat
          propsDefinition = start(propsDefinition, normalizeProps(child.props))
        }

        if (child.mixins) {
          for (let i = 0, l = child.mixins.length; i < l; i++) {
            mergeProps(child.mixins[i])
          }
        }
      }

      mergeProps((Vue as any).options.props)
      mergeProps(componentOptions)
    }
  }

  return propsDefinition
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
        slots[name] = cloneVNode!(slot, {
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
