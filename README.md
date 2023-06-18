# nuxt-cache-module
nuxt 2 page cache module. lightweight and straightforward

## usage 

```
npm i nuxt-cache-module -S
```

```javascript
// nuxt.config.js

modules: [
  ['nuxt-cache-module', 
    {
      hashKey: true,
      keyBuilder: (route, context) => {
        return ''
      },
      expireTime: 1000,
      cacheBuilder: (context) => {
        // build your cache or get it from somewhere
        return cache
      },
      hitHeader: 'x-page-cache',
      shouldCache: (route, context) => {
        return true
      },
      shouldSave: (context) => {
        // error flag found
        return !context.req.pageRenderError
      }
  }]
]

```

## options

| Property | Type | Required? | Description 
|:---|:---|:---|:---|
| hashKey | boolean | false | set `true` will hash the cache key
| keyBuilder | function | false | used to create the cache key, receive `route` and `context` params same as nuxt's renderRoute function [official doc](https://nuxtjs.org/api/nuxt-render-route#nuxt-renderroute-route-context-), default builder use `route` as the key
| expireTime | number | false | cache expire time, default 1800s
| cacheBuilder | function | true | pass `context` and return the cache instance you use
| shouldCache | function | true | filter the route, return false will not use cache
| hitHeader | string | false | set the given header to `hit` if hit cache
| shouldSave | function | false | you may not want to save a page with error in cache

## caveat

- `shouldCache` called before page render, `shouldSave` called after page render.
- your cache instance should support `get` and `set` method which used as follows:

```javascript
cache.get(key).then((res) => {}).catch(() => {})

cache.set(key, val, 'EX', expireTime).then(() => {}).catch(() => {})
```

## example

this cache is up to the user to provide.

the example below use `koa` and `ioredis`.

server.js
```
const Redis = require('ioredis')

// build the cache instance before server start listen
const redisClient = await new Promise((resolve, reject) => {
    const client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      connectTimeout: 10000,
      maxRetriesPerRequest: 1,
      // set app version in the key prefix
      keyPrefix: `${yourproject}${yourversion}`,
      retry_strategy (times) {
        // reconnect after
        return 100
      }
    })
    client.on('connect', () => {
      resolve(client)
    })
    client.on('error', (e) => {
      reject(e)
    })
  }).catch((e) => {
  })

 // inject cache to ctx in server app middleware, so the cache builder can get it.
 app.use(async (ctx, next) => {
    if (redisClient) {
      ctx.cache = redisClient
    }
    await next()
 })
```

nuxt.config.js
```
['nuxt-cache-module', {
      hashKey: true,
      keyBuilder: (route, context) => {
      },
      expireTime: 1800,
      hitHeader: 'x-page-cache',
      cacheBuilder: (context) => {
        // get cache from ctx
        return context.req && context.req.ctx.cache
      },
      shouldCache: (route, context) => {
          const r = route.split(/[?#]/)[0]
          // I use regex to check the route, only home page is allowed to cache
          if (pageRegex.home.test(r)) {
            return true
          }
      },
      shouldSave: (context) => {
      }
    }]
```
