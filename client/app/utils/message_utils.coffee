module.exports =

    displayAddresses: (addresses, full = false) ->
        if not addresses?
            return ""

        res = []
        for item in addresses
            if not item?
                break
            if full
                if item.name? and item.name isnt ""
                    res.push "\"#{item.name}\" <#{item.address}>"
                else
                    res.push "#{item.address}"
            else
                if item.name? and item.name isnt ""
                    res.push item.name
                else
                    res.push item.address.split('@')[0]
        return res.join ", "

    generateReplyText: (text) ->
        text = text.split '\n'
        res  = []
        text.forEach (line) ->
            res.push "> #{line}"
        return res.join "\n"

    getAttachmentType: (type) ->
        sub = type.split '/'
        switch sub[0]
            when 'audio', 'image', 'text', 'video'
                return sub[0]
            when "application"
                switch sub[1]
                    when "vnd.ms-excel",\
                         "vnd.oasis.opendocument.spreadsheet",\
                         "vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        return "spreadsheet"
                    when "msword",\
                         "vnd.ms-word",\
                         "vnd.oasis.opendocument.text",\
                         "vnd.openxmlformats-officedocument.wordprocessingm" + \
                         "l.document"
                        return "word"
                    when "vns.ms-powerpoint",\
                         "vnd.oasis.opendocument.presentation",\
                         "vnd.openxmlformats-officedocument.presentationml." + \
                         "presentation"
                        return "presentation"

                    when "pdf" then return sub[1]
                    when "gzip", "zip" then return 'archive'

    # convert attachment to the format needed by the file picker
    convertAttachments: (file) ->
        return {
            name:               file.generatedFileName
            size:               file.length
            type:               file.contentType
            originalName:       file.fileName
            contentDisposition: file.contentDisposition
            contentId:          file.contentId
            transferEncoding:   file.transferEncoding
        }

    formatDate: (date) ->
        if not date?
            return
        today = moment()
        date  = moment date
        if date.isBefore today, 'year'
            formatter = 'DD/MM/YYYY'
        else if date.isBefore today, 'day'
            formatter = 'DD MMMM'
        else
            formatter = 'hh:mm'
        return date.format formatter
