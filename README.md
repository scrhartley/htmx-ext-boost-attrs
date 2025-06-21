# htmx Boost Attributes Extension

## Description

The `boost-attrs` extension allows using boost functionality without the problems related to inheritance that come with using other htmx attributes alongside [`hx-boost`](https://htmx.org/attributes/hx-boost/). This extension adds boost-specific replacements for `hx-swap`, `hx-target` and `hx-select`.

### The problem being solved

With stock `hx-boost`, if you use `hx-swap`, `hx-target` or `hx-select` for your boosts, all normal non-boosted elements will need to undo these attributes by overriding or unsetting them each time. This means that adding `hx-boost` to an htmx project can easily break existing functionality. The alternative to this is having to specify these attributes for every boosted element, which mostly defeats the point.

Without the extension:
```html
<body hx-boost="true"
      hx-swap="outerHTML transition:true"
      hx-target="#main" hx-select="#main">
...
    <div id="main">
    ...
        <div hx-get="/lazy" hx-trigger="load"
             hx-swap="innerHTML transition:false"
             hx-target="this" hx-select="unset"></div>
    ...
    </div>
...
</body>
```


## Usage

```html
<body hx-boost="true" hx-ext="boost-attrs"
      hx-boost-swap="outerHTML transition:true"
      hx-boost-target="#main" hx-boost-select="#main">
...
</body>
```
> [!IMPORTANT]
> You must enable the extension specifically on the `body` tag, regardless of where you use its features. If `hx-ext="boost-attrs"` is specified elsewhere, then the extension is unlikely to work. This limitation only applies to its use of `hx-ext` and does not apply to the additional attributes it provides, nor `hx-boost`.

* **Attribute** — `hx-boost-swap` (optional)  
* **Attribute** — `hx-boost-target` (optional)  
When a bad selector is used, the event `htmx:boostTargetError` will fire for boosted elements. This event is designed to behave similarly to [`htmx:targetError`](https://htmx.org/events/#htmx:targetError).  
* **Attribute** — `hx-boost-select` (optional)  
* **Event** — `htmx:beforeBoostSwap` (conditional)  
This is designed to behave similarly to [`htmx:beforeSwap`](https://htmx.org/events/#htmx:beforeSwap) but only fires for boosted elements. It fires after `htmx:beforeSwap` and allows boost-only overriding of values. This extension can overwrite changes made in `htmx:beforeSwap` for boosted swaps and hence this event is necessary to reliably set overrides for boosts.

Boost attributes take precedence over their non-boost equivalents. A non-boost attribute will still apply to a boosted element only if its boost-specific counterpart hasn't been used. A boost attribute will ***not*** apply when its corresponding server response header is used (`HX-Reswap`, `HX-Retarget` and `HX-Reselect`).


## Installing

The fastest way to install `boost-attrs` is to load it via a CDN. Remember to always include the core htmx library before the extension and [enable the extension](#Usage). This extension only applies to boost swaps and so `hx-boost="true"` also needs to be used.

```html
<head>
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.6" integrity="sha384-Akqfrbj/HpNVo8k11SXBb6TlBWmXXlYQrCSqEWmyKJe+hDm3Z/B2WVG4smwBkRVm" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/gh/scrhartley/htmx-ext-boost-attrs@0.0.0/dist/boost-attrs.min.js" integrity="sha384-nYmSuzDSFrs+dq2leJam05mhnpHIvHmRuFdZL5tIVZb+Cuv6jBE+Tzrae3Mbwkaq" crossorigin="anonymous"></script>
</head>
<body hx-boost="true" hx-ext="boost-attrs">
...
```

An unminified version is also available at:  
https://cdn.jsdelivr.net/gh/scrhartley/htmx-ext-boost-attrs/dist/boost-attrs.js

For npm-style build systems, you can install `boost-attrs` via [npm](https://www.npmjs.com/):
```shell
npm install "scrhartley/htmx-ext-boost-attrs#semver:^0.0.0"
```
If you are using a bundler to manage your javascript:
* Install `htmx.org` and `scrhartley/htmx-ext-boost-attrs` via npm
* Import both packages in your `index.js` / `main.js`:
```js
import 'htmx.org';
import 'htmx-ext-boost-attrs';
```