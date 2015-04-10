# Coupe

Coupe is a tool for communicating between web pages which may be on different
domains.

It works by opening an iframe on each communicating frame.  The pages use
`postMessage` to communicate with the iframe.  The frames use `localStorage`
to share values between them.

You can set and clear values, and bind to events which are triggered when these values
are changed.

## Usage

The `build/index.html` file and the accompanying `build/iframe.js` file, must
be deployed somewhere.  If you wish to support communication between HTTPS pages,
this location must itself support HTTPS.

On any page you wish to communicate with include `./client.js`, then:

```javascript
var client = Coupe.createClient({
  host: "https://bus.eager.io/index.html" // The location of the deployed file
})
```

To set values:

```javascript
client.set('name', 'bob')
```

To get notified:

```javascript
client.on('set:name', function(opts){
  // opts.value will be 'bob'
})
```

When the iframe is initialized, events will be triggered for all existing
properties.

If you wish to trigger events for a value, but not store it:

```javascript
client.flash('clicked-save', true)
```

You can also clear values:

```javascript
client.clear('name')
```
