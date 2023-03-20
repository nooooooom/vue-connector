import { Component, DefineComponent, ExtractPropTypes, VNode } from 'vue'
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

export type NormalizeProps<Props> = NonNullable<Props> extends never ? {} : NonNullable<Props>

export type NormalizeStateProps<Props> = Props extends () => infer S ? S : Props

export type MapStateProps<StateProps, OwnProps> = (
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) => StateProps

export type MapStatePropsFactory<StateProps, OwnProps> = (
  initialOwnProps: OwnProps,
  instance: ComponentInternalInstance
) => MapStateProps<StateProps, OwnProps>

export type MapStaticProps<StaticProps, OwnProps> = (
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) => StaticProps

export type MergeProps<StateProps, StaticProps, OwnProps, MergedProps> = (
  stateProps: StateProps,
  dispatchProps: StaticProps,
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) => MergedProps

export type ScopedSlots = Record<string, (...args: any[]) => any>

export type ConnectedComponent<Props> = DefineComponent<Props>

export type ExtractComponentPropTypes<T> = T extends ComponentCreationType<infer Props>
  ? ExtractPropTypes<Props>
  : {}

export type Connector<InjectedProps, NeedsProps> = <C extends ComponentCreationType<NeedsProps>>(
  component: C
) => ConnectedComponent<
  Partial<InjectedProps> &
    NeedsProps &
    Omit<ExtractComponentPropTypes<C>, keyof InjectedProps | keyof NeedsProps>
>

export interface DefineConnector {
  // no-unnecessary-generics
  <StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(): Connector<{}, {}>

  // overload 1: mapStateProps only
  <StateProps = {}, StaticProps = {}, OwnProps = {}>(
    mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>
  ): Connector<
    NormalizeProps<NormalizeStateProps<StateProps>> & NormalizeProps<StaticProps>,
    NormalizeProps<OwnProps>
  >

  // overload 2: mapStaticProps only
  <StateProps = {}, StaticProps = {}, OwnProps = {}>(
    mapStateProps: null | undefined,
    mapStaticProps: MapStaticProps<StaticProps, OwnProps>
  ): Connector<
    NormalizeProps<NormalizeStateProps<StateProps>> & NormalizeProps<StaticProps>,
    NormalizeProps<OwnProps>
  >

  // overload 3: mapStateProps and mapStaticProps
  <StateProps = {}, StaticProps = {}, OwnProps = {}>(
    mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>,
    mapStaticProps: MapStaticProps<StaticProps, OwnProps>
  ): Connector<
    NormalizeProps<NormalizeStateProps<StateProps>> & NormalizeProps<StaticProps>,
    NormalizeProps<OwnProps>
  >

  // overload 4: mergeProps only
  <StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
    mapStateProps: null | undefined,
    mapStaticProps: null | undefined,
    mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
  ): Connector<NormalizeProps<MergedProps>, NormalizeProps<OwnProps>>

  // overload 5: mapStateProps and mergeProps
  <StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
    mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>,
    mapStaticProps: null | undefined,
    mergeProps: MergeProps<NormalizeStateProps<StateProps>, StaticProps, OwnProps, MergedProps>
  ): Connector<NormalizeProps<MergedProps>, NormalizeProps<OwnProps>>

  // overload 6: mapStaticProps and mergeProps
  <StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
    mapStateProps: null | undefined,
    mapStaticProps: MapStaticProps<StaticProps, OwnProps>,
    mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
  ): Connector<NormalizeProps<MergedProps>, NormalizeProps<OwnProps>>
}
