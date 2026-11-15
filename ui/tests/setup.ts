import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { resetStubSdk } from './stubs/app-sdk'

// jsdom has no PointerEvent: without one a `pointermove` arrives as a plain
// Event with no `clientX`, and the popover drag never moves.
if (typeof window !== 'undefined' && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number
    readonly pointerType: string
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
      this.pointerType = params.pointerType ?? ''
    }
  }
  ;(window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventPolyfill
  ;(globalThis as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventPolyfill
}

// jsdom does not lay out, so it has no scrollIntoView; the thread view calls it.
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = function () {}

// jsdom has no canvas: answer a no-op 2D context so a scene mounts. A test that
// asserts on what a scene drew installs its own recording context.
const realGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string) {
  if (type === '2d') {
    // Whatever a draw call returns (a gradient, a pattern) takes any call too.
    const inert: object = new Proxy(function () {}, { get: () => () => inert, apply: () => inert })
    const noop = () => inert
    const store: Record<string | symbol, unknown> = {}
    const measureText = (text: string) => ({ width: String(text ?? '').length * 7 })
    return new Proxy(store, {
      get: (_t, p) => (p === 'measureText' ? measureText : p in store ? store[p] : noop),
      set: (_t, p, v) => { store[p] = v; return true },
    }) as unknown as CanvasRenderingContext2D
  }
  return realGetContext.call(this, type as '2d')
} as typeof HTMLCanvasElement.prototype.getContext

afterEach(() => {
  cleanup()
  resetStubSdk()
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})
