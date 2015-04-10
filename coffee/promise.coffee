class Promise
  constructor: ->
    @ready = false
    @waiting = []

  then: (fn) ->
    if @ready
      fn()
    else
      @waiting.push fn

  resolve: ->
    @ready = true

    if @waiting?
      fn() for fn in @waiting
      @waiting = []

module.exports = {Promise}
