americano = require 'americano'

application = module.exports = (callback) ->
    options =
        name: 'cozy-emails'
        root: __dirname
        port: process.env.PORT or 9125
        host: process.env.HOST or '127.0.0.1'
    console.log options
    americano.start options, callback

if not module.parent
    application()
