import {
  computed,
  DefineComponent,
  defineComponent,
  getCurrentInstance,
  h,
  version,
  VNode
} from 'vue'
import { forwardRef } from 'vue-forward-ref'
import { useProps } from './composables/useProps'
import { useStateProps } from './composables/useStateProps'
import { SpecifyProps, SpecifyPropsValues } from './specifyProps'
import {
  ComponentCreationType,
  Connector,
  MapStateProps,
  MapStatePropsFactory,
  MapStaticProps,
  MergeProps,
  NormalizeProps,
  NormalizeStateProps,
  ScopedSlots
} from './types'

const isVue2 = +version.split('.')[0] !== 3

function isDefineComponent(component: ComponentCreationType): component is DefineComponent {
  return !!component && typeof component === 'object'
}

function defaultMergeProps<StateProps, StaticProps, OwnProps, MergedProps>(
  stateProps: StateProps,
  staticProps: StaticProps,
  ownProps: OwnProps
): MergedProps {
  return { ...ownProps, ...stateProps, ...staticProps } as MergedProps
}

// no-unnecessary-generics
export function defineConnector<
  StateProps = {},
  StaticProps = {},
  OwnProps = {},
  MergedProps = {}
>(): Connector<{}, {}>

// overload 1: mapStateProps only
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}>(
  mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>
): Connector<
  NormalizeProps<NormalizeStateProps<StateProps>> & NormalizeProps<StaticProps>,
  NormalizeProps<OwnProps>
>

// overload 2: mapStaticProps only
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}>(
  mapStateProps: null | undefined,
  mapStaticProps: MapStaticProps<StaticProps, OwnProps>
): Connector<
  NormalizeProps<NormalizeStateProps<StateProps>> & NormalizeProps<StaticProps>,
  NormalizeProps<OwnProps>
>

// overload 3: mapStateProps and mapStaticProps
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}>(
  mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>,
  mapStaticProps: MapStaticProps<StaticProps, OwnProps>
): Connector<
  NormalizeProps<NormalizeStateProps<StateProps>> & NormalizeProps<StaticProps>,
  NormalizeProps<OwnProps>
>

// overload 4: mergeProps only
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps: null | undefined,
  mapStaticProps: null | undefined,
  mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
): Connector<NormalizeProps<MergedProps>, NormalizeProps<OwnProps>>

// overload 5: mapStateProps and mergeProps
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>,
  mapStaticProps: null | undefined,
  mergeProps: MergeProps<NormalizeStateProps<StateProps>, StaticProps, OwnProps, MergedProps>
): Connector<NormalizeProps<MergedProps>, NormalizeProps<OwnProps>>

// overload 6: mapStaticProps and mergeProps
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps: null | undefined,
  mapStaticProps: MapStaticProps<StaticProps, OwnProps>,
  mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
): Connector<NormalizeProps<MergedProps>, NormalizeProps<OwnProps>>

// implementation
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps?:
    | MapStateProps<StateProps, OwnProps>
    | MapStatePropsFactory<StateProps, OwnProps>
    | null
    | undefined,
  mapStaticProps?: MapStaticProps<StaticProps, OwnProps> | null | undefined,
  mergeProps?: MergeProps<StateProps, StaticProps, OwnProps, MergedProps> | null | undefined
): unknown {
  return (component: ComponentCreationType) => {
    mapStaticProps =
      typeof mapStaticProps === 'function' ? mapStaticProps : () => null as StaticProps
    mergeProps = typeof mergeProps === 'function' ? mergeProps : defaultMergeProps

    const wrappedComponentName = (isDefineComponent(component) && component.name) || 'Component'
    const componentName = `Connect${wrappedComponentName}`

    const Connect = defineComponent({
      name: componentName,

      inheritAttrs: false,

      setup(props, context) {
        const instance = getCurrentInstance()!

        const ownProps = useProps<OwnProps>(props, context)
        const stateProps = useStateProps<StateProps, OwnProps>(mapStateProps, ownProps, instance)
        const staticProps = mapStaticProps!(ownProps, instance)

        const mergedProps = computed(() => {
          const specifyProps = {} as Record<string, any>
          const props = {} as Record<string, any>

          const mergedProps = mergeProps!(
            stateProps?.value as StateProps,
            staticProps as StaticProps,
            ownProps,
            instance
          )
          if (mergedProps) {
            Object.entries(mergedProps).forEach(([key, value]) => {
              if (SpecifyPropsValues.includes(key)) {
                specifyProps[key] = value
              } else {
                props[key] = value
              }
            })
          }

          return {
            specifyProps,
            props
          }
        })

        return () => {
          if (!component) {
            return
          }

          const {
            value: { specifyProps, props }
          } = mergedProps
          const specifyScopedSlots = specifyProps[SpecifyProps.SCOPED_SLOT] as ScopedSlots

          let vnode: VNode | undefined = undefined
          if (isVue2) {
            const realInstance = instance.proxy as any
            const inheritProps = realInstance.$vnode.data || {}
            const finalProps = {
              ...inheritProps,
              props: {},
              attrs: props,
              on: (context as any).listeners,
              scopedSlots: {
                ...realInstance.$scopedSlots,
                ...specifyScopedSlots
              }
            }

            if (typeof component === 'object') {
              // @ts-ignore: Vue2's `h` doesn't process vnode
              const EmptyVNode = h()
              if (component instanceof EmptyVNode.constructor) {
                vnode = component as VNode
                ;(vnode as any).data = finalProps
              }
            }

            if (!vnode) {
              vnode = h(component as any, finalProps)
            }
          } else {
            const children = instance.vnode.children
            const scopedSlots = {
              ...(children && typeof children === 'object'
                ? children
                : { default: () => children }),
              ...specifyScopedSlots
            }

            vnode = h(component as any, props, scopedSlots)
          }

          return forwardRef(vnode)
        }
      }
    }) as DefineComponent<OwnProps>

    return Connect
  }
}
