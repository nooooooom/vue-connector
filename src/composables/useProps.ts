import { shallowReactive, watchEffect } from 'vue'

export interface SetupContext {
  attrs: Record<string, any>
}

// Handle the situation that vue can only receive `props` by passing `options.props`
export function useProps<T>(props: Record<string, any>, context: SetupContext) {
  const mergedProps = shallowReactive({}) as T
  watchEffect(
    () => {
      Object.assign(mergedProps as any, context.attrs, props)
    },
    {
      flush: 'pre'
    }
  )

  return mergedProps
}
