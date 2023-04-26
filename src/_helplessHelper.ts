import { getAllPossibleProps } from 'vue-lib-toolkit'

export function omitRedundantProps<MergedProps, ProcessedProps = MergedProps>(
  mergedProps: MergedProps,
  keys: string[]
) {
  if (!mergedProps) return mergedProps as unknown as ProcessedProps

  const excludeKeys = getAllPossibleProps(keys)
  const finalProps = {} as any
  for (const prop in mergedProps) {
    if (!excludeKeys.includes(prop)) {
      finalProps[prop] = mergedProps[prop]
    }
  }

  return finalProps
}
