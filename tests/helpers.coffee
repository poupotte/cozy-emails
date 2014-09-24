
# See cozy-fixtures documentation for testing on
# https://github.com/jsilvestre/cozy-fixtures#automatic-tests
fixtures = require 'cozy-fixtures'
{exec} = require 'child_process'
Client = require('request-json').JsonClient
Imap = require '../server/processes/imap_promisified'

helpers = {}

if process.env.COVERAGE
    helpers.prefix = '../instrumented/'
else if process.env.USE_JS
    helpers.prefix = '../build/'
else
    helpers.prefix = '../'

# server management
helpers.options =
    serverPort: '8888'
    serverHost: 'localhost'
helpers.app = null
client = new Client "http://#{helpers.options.serverHost}:#{helpers.options.serverPort}/"

# set the configuration for the server
process.env.HOST = helpers.options.serverHost
process.env.PORT = helpers.options.serverPort

helpers.getClient = -> client

helpers.startImapServer = (done) ->
    @timeout 60000 # this is damn slow
    DovecotStartScript = 'sh tests/DovecotTesting/SetupEnvironment.sh'
    exec DovecotStartScript, (err, stdout, stderr) ->
        if err
            console.log err, stderr
            done new Error('failed to start dovecot')
        else
            done null

helpers.imapServerAccount = ->
    label: "DoveCot"
    login: "testuser"
    password: "applesauce"
    smtpServer: "172.31.1.2"
    #smptServer:"172.0.0.1"
    smtpPort: 0
    imapServer: "172.31.1.2"
    #imapServer: "127.0.0.1"
    imapPort: 993
    imapSecure: true

initializeApplication = require "#{helpers.prefix}server"

helpers.getImapServerRawConnection = ->
    imap = new Imap
        user: "testuser"
        password: "applesauce"
        #host: "127.0.0.1"
        host:"172.31.1.2"
        port: 993
        tls: true
        tlsOptions: rejectUnauthorized: false

helpers.startApp = (done) ->
    @timeout 10000
    initializeApplication (app, server) =>
        @app = app
        @app.server = server
        done()

helpers.stopApp = (done) ->
    @timeout 10000
    if @app then @app.server.close done
    else done null

# database helper
helpers.cleanDB = (done) ->
    @timeout 20000
    fixtures.resetDatabase callback: done

helpers.cleanDBWithRequests = (done) ->
    @timeout 20000
    fixtures.resetDatabase removeAllRequests: true, callback: done

helpers.loadFixtures = (done) ->
    @timeout 20000
    fixtures.load
        dirPath: __dirname + '/fixtures'
        silent: true
        callback: done

module.exports = helpers
