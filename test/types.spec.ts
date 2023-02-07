import { assertType, describe, it } from 'vitest'
import { Connector, defineConnector } from '../src'

describe('Types', () => {
  it('no unnecessary generics', () => {
    assertType(defineConnector())
  })

  it('mapStateProps only', () => {
    assertType<
      Connector<
        {
          foo: string
        },
        {}
      >
    >(
      defineConnector(() => ({
        foo: 'foo'
      }))
    )
  })

  it('mapStaticProps only', () => {
    assertType<
      Connector<
        {
          foo: string
        },
        {}
      >
    >(
      defineConnector(null, () => ({
        foo: 'foo'
      }))
    )
  })

  it('mapStateProps and mapStaticProps', () => {
    assertType<
      Connector<
        {
          foo: string
          bar: string
        },
        {}
      >
    >(
      defineConnector(
        () => ({
          foo: 'foo'
        }),
        () => ({
          bar: 'bar'
        })
      )
    )
  })

  it('mergeProps only', () => {
    assertType<
      Connector<
        {
          foo: string
        },
        {}
      >
    >(
      defineConnector(null, null, () => ({
        foo: 'foo'
      }))
    )
  })

  it('mapStateProps and mergeProps', () => {
    assertType<
      Connector<
        {
          foo: string
        },
        {}
      >
    >(
      defineConnector(
        () => ({
          bar: 'bar'
        }),
        null,
        () => ({
          foo: 'foo'
        })
      )
    )
  })

  it('mapStaticProps and mergeProps', () => {
    assertType<
      Connector<
        {
          foo: string
        },
        {}
      >
    >(
      defineConnector(
        null,
        () => ({
          bar: 'bar'
        }),
        () => ({
          foo: 'foo'
        })
      )
    )
  })
})
