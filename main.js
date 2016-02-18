var http = require('http'),
    querystring = require("querystring"),
    fs = require('fs'),
    ApiServer = require('apiserver')


var qqbot = JSON.parse(fs.readFileSync("qqbot.json"))

apiserver = new ApiServer({
	port: 8080,
  	server: http.createServer(),
  	standardHeaders: {
    	'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  	},
  	timeout: 2000
})

apiserver.listen(this.port, function (err) {
  if (err) {
    console.error('Something terrible happened: %s', err.message)
  } else {
    console.log('Successful bound to port %s', apiserver.port)
  }
})

apiserver.use(ApiServer.payloadParser())

// modules
apiserver.addModule('redmine', 'eventnotify', {
  notify: {
    post: function (request, response) {
      request.resume()
      request.once('end', function () {
        // console.log(request.body.payload.journal.details)
        var botmsg = redmine_webhook_parse(request.body.payload)
        // console.log(botmsg)
        var qqbot_querystring= querystring.stringify({type :request.querystring.type, to: request.querystring.to, msg: botmsg})
        // console.log(qqbot.uri)
        http.get(qqbot.uri + '?' + qqbot_querystring, function(res) {
          console.log(res.statusCode);
        })

        response.serveJSON({
          type: request.querystring.type,
          to: request.querystring.to,
          method: 'POST',
          payload: request.body // thanks to payloadParser
        })
      })
    }
  }
})

// custom routing
apiserver.router.addRoutes([
  ['/notify/:type/:to', 'redmine/eventnotify#notify', {}, true]
])

function redmine_webhook_parse(payload) {
  // console.log(payload)
  // return 'WHO DO ISSUSEID ISSUSETITLE [URL]'
  var who = '',
      action = '',
      issueid = payload.issue.id,
      issuetitle = payload.issue.subject,
      issueurl = payload.url,
      brief = ''

  if(payload.action=='opened') {
    action = '新建了'
    who = payload.issue.author.lastname + payload.issue.author.firstname
  } else if (payload.action == 'updated') {
    action = '更新了'
    who = payload.journal.author.lastname + payload.journal.author.firstname
    if(payload.journal.details.length>0) {
      console.log(payload.journal.details)
      payload.journal.details.forEach(function(detail) {
        if(detail.prop_key=='status_id') {
          brief += '\
          - 状态 变更为 ' + payload.issue.status.name
        }
      })
    }
  }

  return who + ' ' + action + ' #' + issueid + ' ' + issuetitle + ' [' + issueurl + '] ' + brief
}
