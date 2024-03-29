import { Component, DefineComponent, ExtractPropTypes, VNode } from 'vue-module-demi'
import { ComponentInternalInstance } from 'vue-lib-toolkit'

export type { ComponentInternalInstance }

export type ComponentCreationType<Props = any> =
  | string
  | Component<Props>
  | DefineComponent<Props>
  | Symbol // Text | Comment | Teleport | Suspense
  | { __isSuspense: true } // Suspense
  | Function // FunctionalComponent
  | VNode

export type Props = Record<string, any>

export const PreserveProps = ['class', 'style', '$$slots', '$$nativeOn'] as const
export type PreserveProps = Partial<Record<(typeof PreserveProps)[number], any>>

export type UnionPreserveProps<T> = T | (T & PreserveProps)

export type OmitPreserveProps<T> = Omit<T, keyof PreserveProps>

export type NormalizeProps<Props> = NonNullable<Props> extends never ? {} : NonNullable<Props>

export type MapStateProps<StateProps, OwnProps> = (
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) => UnionPreserveProps<StateProps>

export type MapStatePropsFactory<StateProps, OwnProps> = (
  initialOwnProps: OwnProps,
  instance: ComponentInternalInstance
) => MapStateProps<StateProps, OwnProps>

export type MapStaticProps<StaticProps, OwnProps> = (
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) => UnionPreserveProps<StaticProps>

export type MergeProps<StateProps, StaticProps, OwnProps, MergedProps> = (
  stateProps: UnionPreserveProps<StateProps>,
  staticProps: UnionPreserveProps<StaticProps>,
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) => UnionPreserveProps<MergedProps>

export type ConnectedComponent<Props> = DefineComponent<Props>

export type ExtractComponentPropTypes<T> = T extends ComponentCreationType<infer Props>
  ? ExtractPropTypes<Props>
  : {}

type AssignProps<
  Props extends Record<string, any>[],
  Target extends Record<string, any> = {}
> = Props extends [infer First, ...infer Extras extends Record<string, any>[]]
  ? AssignProps<Extras, Target & NonNullable<Omit<First, keyof Target>>>
  : Target

export type InheritProps<InheritedProps extends Record<string, any>> =
  | boolean
  | ((inheritedProps: InheritedProps) => Partial<InheritedProps>)

export type ExtractInheritedProps<
  T extends InheritProps<any>,
  InheritedProps extends Record<string, any> = never
> = T extends true
  ? InheritedProps
  : T extends (...args: any[]) => any
  ? ReturnType<T>
  : Record<string, any>

export type Connector<
  InjectedProps extends Record<string, any>,
  NeedsProps extends Record<string, any>
> = <
  C extends ComponentCreationType<NeedsProps>,
  I extends InheritProps<ExtractComponentPropTypes<C>> = false
>(
  component: C,
  propsDefinition?: NeedsProps,
  inheritProps?: I
) => ConnectedComponent<
  AssignProps<
    [
      Partial<InjectedProps>,
      ExtractInheritedProps<I, ExtractComponentPropTypes<C>>,
      Omit<ExtractComponentPropTypes<C>, keyof InjectedProps | keyof NeedsProps>
    ]
  >
>

export interface DefineConnector {
  // no-unnecessary-generics
  <StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(): Connector<{}, {}>

  // overload 1: mapStateProps only
  <StateProps = {}, StaticProps = {}, OwnProps = {}>(
    mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>
  ): Connector<
    OmitPreserveProps<NormalizeProps<StateProps> & NormalizeProps<StaticProps>>,
    NormalizeProps<OwnProps>
  >

  // overload 2: mapStaticProps only
  <StateProps = {}, StaticProps = {}, OwnProps = {}>(
    mapStateProps: null | undefined,
    mapStaticProps: MapStaticProps<StaticProps, OwnProps>
  ): Connector<
    OmitPreserveProps<NormalizeProps<StateProps> & NormalizeProps<StaticProps>>,
    NormalizeProps<OwnProps>
  >

  // overload 3: mapStateProps and mapStaticProps
  <StateProps = {}, StaticProps = {}, OwnProps = {}>(
    mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>,
    mapStaticProps: MapStaticProps<StaticProps, OwnProps>
  ): Connector<
    OmitPreserveProps<NormalizeProps<StateProps> & NormalizeProps<StaticProps>>,
    NormalizeProps<OwnProps>
  >

  // overload 4: mergeProps only
  <StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
    mapStateProps: null | undefined,
    mapStaticProps: null | undefined,
    mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
  ): Connector<OmitPreserveProps<NormalizeProps<MergedProps>>, NormalizeProps<OwnProps>>

  // overload 5: mapStateProps and mergeProps
  <StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
    mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>,
    mapStaticProps: null | undefined,
    mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
  ): Connector<OmitPreserveProps<NormalizeProps<MergedProps>>, NormalizeProps<OwnProps>>

  // overload 6: mapStaticProps and mergeProps
  <StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
    mapStateProps: null | undefined,
    mapStaticProps: MapStaticProps<StaticProps, OwnProps>,
    mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
  ): Connector<OmitPreserveProps<NormalizeProps<MergedProps>>, NormalizeProps<OwnProps>>
}
