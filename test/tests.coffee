{createClient} = require('../coffee/client')

client = null

describe 'Bus', ->
  beforeEach ->
    client = createClient({
      host: "https://bus.eager.io"
    })

  it 'should create a client', (done) ->
    client.frame.ready.then ->
      expect(true).toBe(true)

      done()

  it 'should send messages', (done) ->
    client2 = createClient(0)

    client.on 'set:message', ({value}) ->
      expect(value).toBe('5')

      done()

    client2.set 'message', '5'

  it 'should fire events on existing values', (done) ->
    client.set 'existing', 5

    client2 = createClient(0)
    client2.on 'set:existing', ({value}) ->
      expect(value).toBe('5')

      done()

  it 'should not get events from other sites', ->
    client2 = createClient(1)
    client2.on 'set:message', ({value}) ->
      expect(true).toBe(false)

    client.set 'message', '5'
