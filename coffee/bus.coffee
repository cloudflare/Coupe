{Store} = require('./store')
{Evented} = require('./events')

randomId = -> (Math.random() * 1000000)|0

class Bus extends Evented
  constructor: (clientId=randomId()) ->
    @state = new Store('BusMessages', clientId)

    @state.on 'create', ({key, value}) =>
      @handle key, value

  flash: (name, options) ->
    @set(name, options)

    @clear(name)

  set: (name, options) ->
    @state.set(name, options)

  clear: (name) ->
    @state.set(name, undefined)

  ready: ->
    @state.each @handle.bind(@)

  handle: (name, options) ->
    out =
      key: name
      value: options

    @trigger "set:#{ name }", out
    @trigger "set", out

module.exports = {Bus}
