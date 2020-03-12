# nuxt-cache-module
nuxt page cache module. lightweight and straightforward

## useage 

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
      versionKey: '',
      appVersion: '',
      cacheBuilder: (context) => {
        // build your cache or get it from somewhere
        return context.req && context.req.ctx.cache
      },
      hitHeader: 'x-page-cache',
      shouldCache: (route, context) => {
        return true
      },
      shouldSave: (context) => {
        // error flag found in koa ctx
        return !context.req.ctx.pageRenderError
      }
  }]
]

```

## options

| Property | Type | Required? | Description 
|:---|:---|:---|:---|
| hashKey | boolean | false | set `true` will hash the cache key
| keyBuilder | function | false | used to create the cache key, receive `route` and `context` params same as nuxt's renderRoute function [official doc](https://nuxtjs.org/api/nuxt-render-route#nuxt-renderroute-route-context-), default builder use url as the key
| expireTime | number | false | cache expire time, default 1800s
| versionKey | string | true | app version cache key
| appVersion | string | true | app version
| cacheBuilder | function | true | pass `context` and return the cache instance you use
| shouldCache | function | true | filter the route, return false will not use cache
| hitHeader | string | false | set the given header to `hit` if hit cache
| shouldSave | function | false | you may not want to save a page with error in cache

## caveat

- you should store the appVersion(eg: commit hash) in the cache before render page. version not match will result in not use cache
- your cache instance should support `get` and `set` method which used as follows:

```javascript
cache.get(key).then((res) => {}).catch(() => {})

cache.set(key, val, 'EX', expireTime).then(() => {}).catch(() => {})
```
