import type { HtmxExtension, HtmxBeforeSwapDetails, HtmxRequestConfig } from 'htmx.org'
import type HtmxNamespace from 'htmx.org'

export type ExtensionApi = {
  getClosestAttributeValue: (elt: Element, attributeName: string) => string|null
  findThisElement: (elt: Element, attribute: string) => Element|null
  querySelectorExt: (eltOrSelector: Element|string, selector: string) => Element|undefined
  triggerEvent: (elt: EventTarget|string, eventName: string, detail: object) => boolean
  triggerErrorEvent: (elt: EventTarget|string, eventName: string, detail: object) => void
}

// Events

type BaseEvent<T extends string, D extends object = object> = {
  readonly type: T // Generify
  readonly detail: D extends { boosted: unknown } ? D : { boosted?: never }
} & Omit<CustomEvent<D>, 'type'>

type RequestConfig = { elt: Element } & HtmxRequestConfig
type ConfigRequestEvent = BaseEvent<'htmx:configRequest', RequestConfig>
type BeforeSwapEvent = BaseEvent<'htmx:beforeSwap', HtmxBeforeSwapDetails & { requestConfig: RequestConfig }>
type UnknownEvent = BaseEvent<'???' /* a literal in order to get exhaustive inference */>
type AllEvents = ConfigRequestEvent | BeforeSwapEvent | UnknownEvent

// Extension Overrides

type OnEventArgs<E extends AllEvents = AllEvents> = E extends E ? [E['type'], E] : never
type Extension = {
  init: (api: ExtensionApi) => void // Add parameter type
  onEvent: (...args: OnEventArgs) => boolean|void
} & Omit<HtmxExtension, 'init'|'onEvent'>

export type Htmx = {
  defineExtension: (name: string, extension: Partial<Extension>) => void
} & Omit<typeof HtmxNamespace, 'defineExtension'>
