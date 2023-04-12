import { computed, DefineComponent, defineComponent, getCurrentInstance, h, VNode } from 'vue'
import { forwardRef } from 'vue-forward-ref'
import {
  cloneVNode,
  isEventKey,
  isVue2,
  mergedClass,
  mergedStyle,
  mergeListeners,
  ShapeFlags,
  toListenerKey,
  useProps
} from 'vue-lib-toolkit'
import { SpecifyProps, SpecifyPropsValues } from './specifyProps'
import {
  ComponentCreationType,
  DefineConnector,
  MapStateProps,
  MapStatePropsFactory,
  MapStaticProps,
  MergeProps,
  Props
} from './types'

function normalizeFunction<T extends (...args: any[]) => any>(
  func: unknown,
  candidate: Function = () => null
): T {
  return (typeof func === 'function' ? func : candidate) as T
}

function keyLength(object: any) {
  return Object.keys(object).length
}

function defaultMergeProps<StateProps, StaticProps, OwnProps, MergedProps>(
  stateProps: StateProps,
  staticProps: StaticProps,
  ownProps: OwnProps
): MergedProps {
  return { ...ownProps, ...stateProps, ...staticProps } as MergedProps
}

function isDefineComponent(component: ComponentCreationType): component is DefineComponent {
  return !!component && typeof component === 'object'
}

// implementation
function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps?:
    | MapStateProps<StateProps, OwnProps>
    | MapStatePropsFactory<StateProps, OwnProps>
    | null
    | undefined,
  mapStaticProps?: MapStaticProps<StaticProps, OwnProps> | null | undefined,
  mergeProps?: MergeProps<StateProps, StaticProps, OwnProps, MergedProps> | null | undefined
) {
  // Normalize
  const normalizedMapStateProps = normalizeFunction<
    MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>
  >(mapStateProps)
  const normalizedMapStaticProps =
    normalizeFunction<MapStaticProps<StaticProps, OwnProps>>(mapStaticProps)
  const normalizedMergeProps = normalizeFunction(mergeProps, defaultMergeProps)

  return (component: ComponentCreationType) => {
    const wrappedComponentName = (isDefineComponent(component) && component.name) || 'Component'
    const connectComponentName = `Connect${wrappedComponentName}`

    const Connect = defineComponent({
      name: connectComponentName,

      inheritAttrs: false,

      setup(props, context) {
        const instance = getCurrentInstance()!

        const ownProps = useProps<OwnProps>()

        const initializedStateProps = normalizedMapStateProps(ownProps, instance)
        const stateProps =
          typeof initializedStateProps === 'function'
            ? // factory
              computed(() =>
                (initializedStateProps as MapStateProps<StateProps, OwnProps>)(ownProps, instance)
              )
            : computed(() => normalizedMapStateProps(ownProps, instance) as StateProps)
        const staticProps = normalizedMapStaticProps(ownProps, instance)
        const mergedProps = computed(() =>
          normalizedMergeProps(stateProps.value, staticProps, ownProps, instance)
        )

        // Specify props
        const classAndStyleProps = computed(() => {
          const { value: mergedPropsValue } = mergedProps
          const props = {} as Props

          const klass = mergedClass(
            mergedPropsValue.class,
            mergedPropsValue[SpecifyProps.CLASS],
            mergedPropsValue[SpecifyProps.STATIC_CLASS]
          )
          if (klass) {
            props.class = klass
          }

          const style = mergedStyle(
            mergedPropsValue.style,
            mergedPropsValue[SpecifyProps.STYLE],
            mergedPropsValue[SpecifyProps.STATIC_STYLE]
          )
          if (style && (typeof style !== 'object' || Object.keys(style).length)) {
            props.style = style
          }

          return props
        })

        const getComponentProps = () => {
          const props = { ...mergedProps.value }
          for (const s of SpecifyPropsValues) {
            delete props[s]
          }
          return props
        }

        if (isVue2) {
          return () => {
            const componentProps = getComponentProps()

            const props = {} as Props
            const listenersProps = {} as Props

            for (const prop in componentProps) {
              const value = componentProps[prop]
              if (isEventKey(prop)) {
                // onEvent -> event
                listenersProps[toListenerKey(prop)] = value
              } else if (prop !== 'class' && prop !== 'style') {
                props[prop] = value
              }
            }

            const finalProps = {
              attrs: { ...props },
              on: mergeListeners((context as any).listeners, listenersProps),
              ...classAndStyleProps.value
            } as any

            const scopedSlots = {
              ...(instance.proxy as any).$scopedSlots,
              ...mergedProps.value[SpecifyProps.SCOPED_SLOTS]
            }
            const slots = {
              ...(instance.proxy as any).$slots,
              ...mergedProps.value[SpecifyProps.SLOTS]
            }
            if (
              !keyLength(mergedProps.value[SpecifyProps.SCOPED_SLOTS]) &&
              (keyLength(mergedProps.value[SpecifyProps.SLOTS]) || keyLength(slots))
            ) {
              finalProps.slot = slots
            } else if (scopedSlots) {
              finalProps.scopedSlots = scopedSlots
            }

            let vnode: VNode | undefined
            if (typeof component === 'object') {
              // @ts-ignore: Vue2's `h` doesn't process vnode
              const EmptyVNode = h()
              if (component instanceof EmptyVNode.constructor) {
                vnode = cloneVNode(component as VNode, finalProps)
              }
            }

            if (!vnode) {
              vnode = h(component as any, finalProps)
            }

            return forwardRef(vnode)
          }
        }

        return () => {
          const props = { ...getComponentProps(), ...classAndStyleProps.value }
          const children = instance.vnode.children
          const slots = children
            ? instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN
              ? (children as any)
              : {
                  default: () => children
                }
            : null
          const mergedSlots = {
            ...slots,
            ...mergedProps.value[SpecifyProps.SCOPED_SLOTS]
          }

          const vnode = h(
            component as any,
            props,
            Object.keys(mergedSlots).length ? mergedSlots : null
          )

          return forwardRef(vnode)
        }
      }
    })

    return Connect as DefineComponent<OwnProps>
  }
}

export default defineConnector as DefineConnector
