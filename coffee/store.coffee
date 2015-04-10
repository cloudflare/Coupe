{Evented} = require('./events')

class Store extends Evented
  constructor: (@name, @clientId) ->
    @data = {}

    window.addEventListener 'storage', ({key, oldValue, newValue, url}) =>
      return if key isnt @name

      @processChanges JSON.parse(oldValue), JSON.parse(newValue)

  processChanges: (oldValue, newValue) ->
    for key, value of newValue when value.modified.by isnt @clientId
      continue if value.value is oldValue?[key]?.value

      event = null
      if typeof oldValue?[key]?.value is 'undefined'
        event = 'create'
      else if typeof value.value is 'undefined'
        event = 'delete'
      else
        event = 'modify'

      if event
        @notify {
          event,
          key,
          previous: oldValue?[key]?.value,
          value: value.value,
          client: value.modified.by
        }

  notify: (options) ->
    @trigger options.event, options
    @trigger "#{ options.event }:#{ options.key }", options

  write: ->
    localStorage[@name] = JSON.stringify @data

  read: ->
    try
      @data = JSON.parse localStorage[@name]
    catch e
      @data = {}

  set: (k, v) ->
    @data[k] =
      modified:
        at: +new Date
        by: @clientId
      value: v

    @write()

  get: (k) ->
    @read()

    @data[k]

  each: (fn) ->
    @read()

    for key, {value} of @data when typeof value isnt 'undefined'
      fn(key, value)

module.exports = {Store}
