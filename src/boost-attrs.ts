import type { Htmx, ExtensionApi } from './types.d.ts'

declare const htmx: Htmx

(function() {
  let api: ExtensionApi
  htmx.defineExtension('boost-attrs', {
    init: function(apiRef) {
      api = apiRef
    },
    onEvent: function(name, evt) {
      if (!evt.detail.boosted) return

      if (name === 'htmx:configRequest') {
        const elt = evt.detail.elt
        const targetOverride = api.getClosestAttributeValue(elt, 'hx-boost-target')
        if (targetOverride && !resolveTarget(elt, targetOverride)) return (triggerTargetError(elt, targetOverride), false)
      } else if (name === 'htmx:beforeSwap') {
        const elt = evt.detail.requestConfig.elt
        const targetOverride = api.getClosestAttributeValue(elt, 'hx-boost-target')
        const swapOverride = api.getClosestAttributeValue(elt, 'hx-boost-swap')
        const selectOverride = api.getClosestAttributeValue(elt, 'hx-boost-select')
        const headers = evt.detail.xhr.getAllResponseHeaders()

        if (targetOverride && !/HX-Retarget:/i.test(headers)) {
          const target = resolveTarget(elt, targetOverride)
          if (!target) return (triggerTargetError(elt, targetOverride), false)
          evt.detail.target = target
        }
        if (swapOverride && !/HX-Reswap:/i.test(headers)) evt.detail.swapOverride = swapOverride
        if (selectOverride && !/HX-Reselect:/i.test(headers)) evt.detail.selectOverride = selectOverride

        api.triggerEvent(evt.detail.target, 'htmx:beforeBoostSwap', evt.detail)
      }
    }
  })

  function resolveTarget(elt: Element, targetOverride: string) {
    return targetOverride === 'this' ? api.findThisElement(elt, 'hx-boost-target') : api.querySelectorExt(elt, targetOverride)
  }
  function triggerTargetError(elt: Element, targetOverride: string) {
    api.triggerErrorEvent(elt, 'htmx:boostTargetError', { target: targetOverride })
  }
})()
