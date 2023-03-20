export const SpecifyProps = {
  SCOPED_SLOTS: '@@vue-connector/SCOPED_SLOTS',
  /**
   * NOTE: `SLOTS` is an escape hatch compatible with some components of Vue2.
   * Please ensure that the rendering method used in
   * the wrapper component is similar to `this.$slots.default`, otherwise, only `SCOPED_SLOTS` are recommended.
   */
  SLOTS: '@@vue-connector/VUE2_SLOTS'
} as const

export const specifyPropsValues = Object.values<string>(SpecifyProps)
