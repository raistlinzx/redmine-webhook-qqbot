var http = require('http'),
    ApiServer = require('apiserver')

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
        response.serveJSON({
          type: request.querystring.type,
          to: request.querystring.to,
          method: 'POST',
          payload: request.body.test // thanks to payloadParser
        })
      })
    }
  }
})

// custom routing
apiserver.router.addRoutes([
  ['/notify/:type/:to', 'redmine/eventnotify#notify', {}, true]
])
