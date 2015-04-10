{Bus} = require('./bus')

randomId = -> (Math.random() * 1000000)|0
clientId = parseInt(document.location.hash.substring(1), 10) or randomId()

debug = require('debug')("bus:iframe(#{ clientId })")

debug("Initializing")

bus = new Bus(clientId)

window.addEventListener 'message', ({data}) ->
  debug("Got message", data.type)

  if data.type is 'bus:set'
    bus.set data.key, data.value
  else if data.type is 'bus:clear'
    bus.clear data.key
  else if data.type is 'bus:flash'
    bus.flash data.key, data.value

bus.on 'set', ({key, value}) ->
  debug("Got sent event for #{ key }, posting message")

  parent.postMessage {
    type: 'bus:set',
    key,
    value
  }, '*'

debug("Ready")
parent.postMessage {type: 'bus:ready'}, '*'

bus.ready()
