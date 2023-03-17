import { computed, shallowReactive, watchEffect } from 'vue'

const camelizeRE = /-(\w)/g
export const camelize = (str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
}

export interface SetupContext {
  attrs: Record<string, any>
}

// Handle the situation that vue can only receive `props` by passing `options.props`
export function useProps<T>(props: Record<string, any>, { attrs }: SetupContext) {
  const mergedProps = shallowReactive({}) as T

  const normalizeAttrs = computed(() => {
    const asProps = {} as Record<string, any>
    for (const attr of Object.keys(attrs)) {
      asProps[camelize(attr)] = attrs[attr]
    }
    return Object.assign(asProps, attrs)
  })

  watchEffect(
    () => {
      Object.assign(mergedProps as any, normalizeAttrs.value, props)
    },
    {
      flush: 'pre'
    }
  )

  return mergedProps
}
