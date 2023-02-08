# vue-connector

<a href="https://npmjs.com/package/vue-connector"><img src="https://badgen.net/npm/v/vue-connector?color=blue" alt="npm package"></a>

🪡 Connect anything to your vue components.

The idea for this library comes from an article about [Presentational and Container Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0). If you are wondering whether to use it, I would recommend this article to you.

## Installation

```bash
pnpm install vue-connector
```

## Usage

Our purpose is straightforward, connect the state to the presentation component, or intercept and preprocess the props of the presentation component.

`vue-connector` has already intercepted props for you. The important thing is that you need to tell it how you get the state, combine it into props, and pass it to the presentation component.

We use defineConnector, which will accept your stateful composition logic.

```js
import { defineConnector } from 'vue-connector'

/**
 * mapStateProps allows you to define reactive props
 * that it will be executed every time props and reactive dependencies inside mapStateProps change
 *
 * @param ownProps - component props
 * @param instance - the current component instance
 */
const mapStateProps = (ownProps, instance) => {
  return {
    // return state props
  }
}

/**
 * since mapStateProps is reactive, you can also define a factory function,
 * which allows you to define some closure variables before mapStateProps is executed
 *
 * Note: mapStatePropsFactory will only be executed once during `setup`
 *
 * @param initialProps - the first props
 * @param instance - the current component instance
 */
const mapStatePropsFactory = (initialProps, instance) => {
  return (ownProps, instance) => {
    return {
      // return state props
    }
  }
}

/**
 * mapStaticProps allows you to define static props
 * that it will only be executed once during `setup`.
 *
 * @param ownProps - component props
 * @param instance - the current component instance
 */
const mapStaticProps = (ownProps, instance) => {
  return {
    // return static props
  }
}

/**
 * mergeProps allows you to customize the merging logic of props,
 * it is eventually passed to the connected component
 *
 * The default is `{ ...ownProps, ...stateProps, ...staticProps }`.
 *
 * @param stateProps - props from mapStateProps
 * @param staticProps - props from mapStaticProps
 * @param ownProps - component props
 */
const mergeProps = (stateProps, staticProps, ownProps) => {
  return {
    // merged props
  }
}

/**
 * Define your connector, which defines how you get the state
 *
 * @param {?mapStateProps|mapStatePropsFactory} mapStateProps
 * @param {?mapStatePropsFactory} mapStatePropsFactory
 * @param {?mergeProps} mergeProps
 */
const connector = defineConnector(mapStateProps, mapStaticProps, mergeProps)

const ConnectComponent = connector(PresentationComponent)
```

The [playground](./playground) contains usage in conjunction with some popular state libraries.

## License

[MIT](./LICENSE)
