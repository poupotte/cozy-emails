should = require('should')
helpers = require './helpers'
client = helpers.getClient()

describe "Accounts Tests", ->

    before helpers.cleanDB
    before helpers.loadFixtures
    before helpers.startImapServer
    before helpers.startApp
    after helpers.stopApp

    describe "Account creation", =>

        it "When I get the index", (done) ->
            @timeout 6000
            client.get '/', (err, res, body) =>
                res.statusCode.should.equal 200
                done()

        it "And I post a new account to /accounts", (done) =>
            @timeout 10000
            account = helpers.imapServerAccount()
            client.post '/account', account, (err, res, body) =>
                res.statusCode.should.equal 201
                body.should.have.property('mailboxes').with.lengthOf(4)
                @accountID = body.id
                @mailboxID = body.mailboxes[0].id
                done()

        it "And I update an account", (done) =>
            changes = label: "New Name"
            client.put "/account/#{@accountID}", changes, (err, res, body) =>
                res.statusCode.should.equal 200
                body.should.have.property 'label', 'New Name'
                done()

        it "And for mails fetching", (done) ->
            @timeout 30000
            setTimeout done, 29000

        it "Then I get a mailbox count", (done) =>
            client.get "/mailbox/#{@mailboxID}/count", (err, res, body) =>
                body.should.have.property 'count', 7
                done()

        it "And I get a mailbox", (done) =>
            client.get "/mailbox/#{@mailboxID}/page/1/limit/3", (err, res, body) =>
                body.should.have.lengthOf 3
                body[0].subject.should.equal 'Flagged Orange'
                # @TODO add a thread in the mailbox to test threading
                # body[0].conversationID.should.equal body[1].conversationID
                done()

    describe "Recover all accounts", ->

        it "When I recover accounts list", (done)->
            client.get '/account', (err, res, body) =>
                res.statusCode.should.equal 200
                @body = body
                done()

        it "Then list should be contained new account", ->
            @body.should.have.lengthOf 3
            @body[0].label.should.equal "New Name"
            @body[1].label.should.equal "DoveCot"
            @body[2].label.should.equal "Gmail"

    describe "Recover a specific account", =>

        it "When I recover account detail", (done) =>
            client.get "/account/#{@accountID}", (err, res, result) =>
                res.statusCode.should.equal 200
                @body = result
                done()

        it "Then list should be contained new account", =>
            @body.label.should.equal "New Name"
            @body.login.should.equal "testuser"
            @body.password.should.equal "applesauce"
            @body.mailboxes.should.have.lengthOf 4

    describe "Try to recover a non existing account", =>

        it "When I recover account detail", (done) =>
            client.get "/account/3", (err, res, result) =>
                @statusCode = res.statusCode
                done()

        it "Then 404 should be returned as error code", =>
            @statusCode.should.equal 404

    describe "Account removal", =>

        it "When I delete an account", (done) =>
            client.del "/account/#{@accountID}", (err, res, body) =>
                res.statusCode.should.equal 204
                done()

        it "And I recover all accounts", (done) ->
            client.get "/account", (err, res, body) =>
                res.statusCode.should.equal 200
                @body = body
                done()

        it "And account should be removal from list", ->
            @body.should.have.lengthOf 2
            @body[0].label.should.equal "DoveCot"
            @body[1].label.should.equal "Gmail"