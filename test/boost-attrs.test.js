describe('optimistic-updates extension swaps', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('a boost swap only applies when boosting', function() {
    this.server.respondWith('GET', '/test', '&amp;')
    make('<div hx-ext="boost-attrs" hx-boost-swap="textContent">' +
         '  <a id="boosted"   href="/test" hx-boost="true" hx-target="this">Foo</a>' +
         '  <a id="unboosted" hx-get="/test">Bar</a>' +
         '</div>')

    var a = byId('boosted')
    a.click()
    this.server.respond()
    a.textContent.should.equal('&amp;')

    var a = byId('unboosted')
    a.click()
    this.server.respond()
    a.textContent.should.equal('&')
  })

  it('a boost select only applies when boosting', function() {
    this.server.respondWith('GET', '/test', '<div><span id="inner">Result</span></div>')
    make('<div hx-ext="boost-attrs" hx-boost-select="#inner">' +
         '  <a id="boosted"   href="/test" hx-boost="true" hx-target="this">Foo</a>' +
         '  <a id="unboosted" hx-get="/test">Bar</a>' +
         '</div>')

    var a = byId('boosted')
    a.click()
    this.server.respond()
    a.innerHTML.should.equal('<span id="inner">Result</span>')

    var a = byId('unboosted')
    a.click()
    this.server.respond()
    a.innerHTML.should.equal('<div><span id="inner">Result</span></div>')
  })

  it('a boost target only applies when boosting', function() {
    this.server.respondWith('GET', '/test', 'Result')
    // Have to specify a value of hx-target where hx-ext="boost-attrs" is active,
    // since the default target for a boost is the body where it isn't active.
    make('<div id="outer" hx-ext="boost-attrs" hx-boost-target="closest div">' +
         '  <div id="d1"><a id="a1" href="/test" hx-boost="true" hx-target="#outer">Foo</a></div>' +
         '  <div id="d2"><a id="a2" hx-get="/test">Bar</a></div>' +
         '</div>')

    var a = byId('a1') // boosted
    a.click()
    this.server.respond()
    var div = byId('d1')
    div.innerHTML.should.equal('Result')

    var a = byId('a2') // unboosted
    a.click()
    this.server.respond()
    a.innerHTML.should.equal('Result')
  })

  it('a boost swap overrides hx-swap', function() {
    this.server.respondWith('GET', '/test', '&amp;')
    make('<div hx-ext="boost-attrs" hx-boost="true" hx-boost-swap="textContent" hx-target="closest a">' +
         '  <a id="a1" href="/test" hx-swap="innerHTML">Foo</a>' +
         '  <a id="a2" href="/test">Bar</a>' +
         '</div>')

    var as = [byId('a1'), byId('a2')]
    for (var a of as) {
      a.click()
      this.server.respond()
      a.textContent.should.equal('&amp;') // Not escaped to '&'
    }
  })

  it('a boost select overrides hx-select', function() {
    var response = '<div id="inner1"></div> <div id="inner2"></div>'
    this.server.respondWith('GET', '/test', response)
    make('<div hx-ext="boost-attrs" hx-boost="true" hx-boost-select="#inner2" hx-target="closest a">' +
         '  <a id="a1" href="/test" hx-select="#inner1">Foo</a>' +
         '  <a id="a2" href="/test">Bar</a>' +
         '</div>')

    var as = [byId('a1'), byId('a2')]
    for (var a of as) {
      a.click()
      this.server.respond()
      a.firstElementChild.id.should.equal('inner2')
    }
  })

  it('a boost target overrides hx-target', function() {
    this.server.respondWith('GET', '/test', '<div>Result</div>')
    make('<div hx-ext="boost-attrs" hx-boost="true" hx-boost-target="#boostTarget" hx-target="closest a">' +
         '  <a id="a1" href="/test" hx-target="#otherTarget">Foo</a>' +
         '  <a id="a2" href="/test">Bar</a>' +
         '  <div id="boostTarget"></div>' +
         '  <div id="otherTarget"></div>' +
         '</div>')
    var as = [byId('a1'), byId('a2')]
    for (var a of as) {
      a.click()
      this.server.respond()
      var boostTarget = byId('boostTarget')
      var otherTarget = byId('otherTarget')
      boostTarget.childElementCount.should.equal(1)
      otherTarget.childElementCount.should.equal(0)
    }
  })

  it('a boost target should accept "this" as a value', function() {
    this.server.respondWith('GET', '/test', '<div id="result"></div>')
    make('<div hx-ext="boost-attrs" hx-boost="true" hx-target="this">' +
         '  <div id="boostTarget" hx-boost-target="this">' +
         '    <a id="a1" href="/test">Foo</a>' +
         '  </div>' +
         '</div>')

    var a = byId('a1')
    a.click()
    this.server.respond()
    var target = byId('boostTarget')
    target.firstElementChild.id.should.equal('result')
  })

  it('a boost swap should only override boost scolling when the modifier is specified', function() {
    var originalScroll = htmx.config.scrollIntoViewOnBoost
    try {
      var swapSpec = htmx._('getSwapSpecification') // internal function for swap spec
      var a = make('<a href="/test" hx-target="this" hx-boost="true" hx-ext="boost-attrs">Foo</a>')

      // I can't think of a good way to test which actually uses hx-boost-swap
      htmx.config.scrollIntoViewOnBoost = true
      swapSpec(a).show.should.equal('top')
      swapSpec(a, 'innerHTML').show.should.equal('top')
      swapSpec(a, 'innerHTML show:bottom').show.should.equal('bottom')

      htmx.config.scrollIntoViewOnBoost = false
      should.equal(swapSpec(a).show, undefined)
      should.equal(swapSpec(a, 'innerHTML').show, undefined)
      should.equal(swapSpec(a, 'innerHTML show:bottom').show, 'bottom')
    } finally {
      htmx.config.scrollIntoViewOnBoost = originalScroll
    }
  })

  it('a boost swap should use innerHTML swap style when missing', function() {
    var originalStyle = htmx.config.defaultSwapStyle
    htmx.config.defaultSwapStyle = 'textContent' // show it's irrelevant
    try {
      var swapSpec = htmx._('getSwapSpecification') // internal function for swap spec
      var a = make('<a href="/test" hx-target="this" hx-boost="true" hx-ext="boost-attrs">Foo</a>')

      // I can't think of a good way to test which actually uses hx-boost-swap
      swapSpec(a).swapStyle.should.equal('innerHTML')
      swapSpec(a, 'outerHTML settle:234ms').swapStyle.should.equal('outerHTML')
      swapSpec(a, 'outerHTML settle:234ms').settleDelay.should.equal(234)
      swapSpec(a, 'settle:345ms').swapStyle.should.equal('innerHTML')
      swapSpec(a, 'settle:345ms').settleDelay.should.equal(345)
    } finally {
      htmx.config.defaultSwapStyle = originalStyle
    }
  })

  it('htmx:boostTargetError should fire when the target does not exist', function() {
    var called
    var handler = htmx.on('htmx:boostTargetError', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('GET', '/test', 'Result')
      make('<div hx-ext="boost-attrs" hx-boost="true">' +
           '  <a id="a1" href="/test" hx-target="this" hx-boost-target="#real"></a>' +
           '  <a id="a2" href="/test" hx-target="this" hx-boost-target="#fake"></a>' +
           '  <div id="real"></div>' +
           '</div>')

      called = false
      var a = byId('a1')
      var target = byId('real')
      a.click()
      this.server.respond()
      target.innerHTML.should.equal('Result')
      called.should.equal(false)

      called = false
      var a = byId('a2')
      a.click()
      this.server.respond()
      a.innerHTML.should.be.empty // no swap should occur
      called.should.equal(true)
    } finally {
      htmx.off('htmx:boostTargetError', handler)
    }
  })

  it('htmx:beforeBoostSwap only fires when boosting', function() {
    var called
    var handler = htmx.on('htmx:beforeBoostSwap', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('GET', '/test', 'Result')
      make('<div hx-ext="boost-attrs">' +
           '  <a id="boosted"   href="/test" hx-boost="true" hx-target="this">Foo</a>' +
           '  <a id="unboosted" hx-get="/test">Bar</a>' +
           '</div>')

      called = false
      var a = byId('boosted')
      a.click()
      this.server.respond()
      a.innerHTML.should.equal('Result')
      called.should.equal(true)

      called = false
      var a = byId('unboosted')
      a.click()
      this.server.respond()
      a.innerHTML.should.equal('Result')
      called.should.equal(false)
    } finally {
      htmx.off('htmx:beforeBoostSwap', handler)
    }
  })

  it('htmx:beforeBoostSwap should override htmx:beforeSwap values', function() {
    var beforeSwapCalled = false
    var beforeBoostSwapCalled = false
    var onBS = htmx.on('htmx:beforeSwap', function(evt) {
      beforeSwapCalled = true
      evt.detail.target = byId('target2')
      evt.detail.selectOverride = '#select2'
      evt.detail.swapOverride = 'afterend'
    })
    var onBBS = htmx.on('htmx:beforeBoostSwap', function(evt) {
      beforeBoostSwapCalled = true
      evt.detail.target.id.should.equal('target2')
      evt.detail.selectOverride.should.equal('#select2')
      evt.detail.swapOverride.should.equal('afterend')
      evt.detail.target = byId('target3')
      evt.detail.selectOverride = '#select3'
      evt.detail.swapOverride = 'innerHTML'
    })
    try {
      this.server.respondWith('GET', '/test', '<div>' +
        '  <div id="select1">Result</div>' +
        '  <div id="select2">Result</div>' +
        '  <div id="select3">Result</div>' +
        '</div>')
      make('<div hx-ext="boost-attrs" hx-boost="true">' +
           '  <a id="a1" href="/test" hx-target="#target1" hx-select="#select1" hx-swap="beforebegin"></a>' +
           '  <div>' +
           '    <div id="target1"></div>' +
           '    <div id="target2"></div>' +
           '    <div id="target3"></div>' +
           '  </div>' +
           '</div>')

      var a = byId('a1')
      a.click()
      this.server.respond()
      should.equal(beforeSwapCalled, true)
      should.equal(beforeBoostSwapCalled, true)
      var target1 = byId('target1')
      var target2 = byId('target2')
      var target3 = byId('target3')
      target1.innerHTML.should.be.empty
      target2.innerHTML.should.be.empty
      target3.innerHTML.should.not.be.empty
      var selected = target3.firstElementChild
      selected.id.should.equal('select3')
      selected.innerHTML.should.equal('Result')
    } finally {
      htmx.off('htmx:beforeSwap', onBS)
      htmx.off('htmx:beforeBoostSwap', onBBS)
    }
  })

  it('a boost swap should be overridden by HX-Reswap', function() {
    var swapOverride
    var onBBS = htmx.on('htmx:beforeBoostSwap', function(evt) {
      swapOverride = evt.detail.swapOverride
    })
    try {
      var useResponseHeader
      this.server.respondWith('GET', '/test', function(xhr) {
        var header = useResponseHeader ? { 'HX-Reswap': 'innerHTML ignoreTitle:true' } : {}
        xhr.respond(200, header, '<div>foo</div>')
      })
      make('<div hx-ext="boost-attrs" hx-boost="true" hx-target="closest a">' +
           '  <a id="a1" href="/test" hx-boost-swap="beforeend"></a>')
      var a = byId('a1')

      useResponseHeader = false
      a.innerHTML = '<div></div>'
      a.click()
      this.server.respond()
      swapOverride.should.equal('beforeend')
      a.childElementCount.should.equal(2)

      useResponseHeader = true
      a.innerHTML = '<div></div>'
      a.click()
      this.server.respond()
      swapOverride.should.equal('innerHTML ignoreTitle:true')
      a.childElementCount.should.equal(1)
    } finally {
      htmx.off('htmx:beforeBoostSwap', onBBS)
    }
  })

  it('a boost select should be overridden by HX-Reselect', function() {
    var useResponseHeader
    this.server.respondWith('GET', '/test', function(xhr) {
      var header = useResponseHeader ? { 'HX-Reselect': '#inner' } : {}
      xhr.respond(200, header, '<section><div id="outer"><div id="inner"></div></div></section>')
    })
    make('<div hx-ext="boost-attrs" hx-boost="true" hx-target="closest a">' +
         '  <a id="a1" href="/test" hx-boost-select="#outer"></a>')
    var a = byId('a1')

    useResponseHeader = false
    a.click()
    this.server.respond()
    a.firstElementChild.id.should.equal('outer')

    useResponseHeader = true
    a.click()
    this.server.respond()
    a.firstElementChild.id.should.equal('inner')
  })

  it('a boost target should be overridden by HX-Retarget', function() {
    var useResponseHeader
    this.server.respondWith('GET', '/test', function(xhr) {
      var header = useResponseHeader ? { 'HX-Retarget': '#target2' } : {}
      xhr.respond(200, header, '<div id="response">foo</div>')
    })
    make('<div hx-ext="boost-attrs" hx-boost="true" hx-target="this">' +
         '  <a id="a1" href="/test" hx-boost-target="#target1"></a>' +
         '  <div>' +
         '    <div id="target1"></div>' +
         '    <div id="target2"></div>' +
         '  </div>')
    var a = byId('a1')

    useResponseHeader = false
    a.click()
    this.server.respond()
    var responseElement = byId('response')
    responseElement.parentElement.id.should.equal('target1')
    responseElement.remove()

    useResponseHeader = true
    a.click()
    this.server.respond()
    var responseElement = byId('response')
    responseElement.parentElement.id.should.equal('target2')
    responseElement.remove()
  })
})
