{div, i, button, input, form} = React.DOM
{Dropdown} = require './basic_components'
{MessageFilter, Tooltips} = require '../constants/app_constants'
SearchInput = require './search_input'

RouterMixin           = require '../mixins/router_mixin'

LayoutActionCreator = require '../actions/layout_action_creator'

filters =
    from: t "list filter from"
    dest: t "list filter dest"


module.exports = SearchToolbarMessagesList = React.createClass
    displayName: 'SearchToolbarMessagesList'

    propTypes:
        accountID: React.PropTypes.string.isRequired
        mailboxID: React.PropTypes.string.isRequired

    getInitialState: ->
        type:  'from'
        value: ''

    prevent: (e) -> e.preventDefault()

    onTypeChange: (filter) ->
        @setState type: filter, value: ''

    onValueChange: (newvalue) ->
        @props.onFilterChange
            type: @state.type
            value: newvalue

    render: ->
        form
            role: 'group'
            className: 'search'
            onSubmit: @prevent

            Dropdown
                options:   filters
                valueLink:
                    value: @state.type
                    requestChange: @onTypeChange

            SearchInput
                value: @state.value
                placeholder: t 'filters search placeholder'
                onSubmit: @onValueChange
