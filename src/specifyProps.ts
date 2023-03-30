export const SpecifyProps = {
  SCOPED_SLOTS: '@@vue-connector/SCOPED_SLOTS',
  /**
   * NOTE: `SLOTS` is an escape hatch compatible with some components of Vue2.
   * Please ensure that the rendering method used in
   * the wrapper component is similar to `this.$slots.default`, otherwise, only `SCOPED_SLOTS` are recommended.
   */
  SLOTS: '@@vue-connector/VUE2_SLOTS',
  /**
   * NOTE: `STATIC_CLASS` is an escape hatch compatible with some components of Vue2.
   */
  STATIC_CLASS: '@@vue-connector/VUE2_STATIC_CLASS',
  /**
   * NOTE: `CLASS` is an escape hatch compatible with some components of Vue2.
   */
  CLASS: '@@vue-connector/VUE2_CLASS',
  /**
   * NOTE: `STATIC_STYLE` is an escape hatch compatible with some components of Vue2.
   */
  STATIC_STYLE: '@@vue-connector/VUE2_STATIC_STYLE',
  /**
   * NOTE: `STYLE` is an escape hatch compatible with some components of Vue2.
   */
  STYLE: '@@vue-connector/VUE2_STYLE'
} as const

export type SpecifyProps = Record<SpecifyPropsValues, any>

export type SpecifyPropsValues = typeof SpecifyProps[keyof typeof SpecifyProps]

export const SpecifyPropsValues = Object.values<SpecifyPropsValues>(SpecifyProps)
