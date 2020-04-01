const crypto = require('crypto')
const { serialize, deserialize } = require('./serializer')
const keyPrefix = '_page_cache_'
const seed = '_s1je4opw'
const defaultExpireTime = 1800

module.exports = function cacheRenderer (moduleOptions) {
  const keyBuilder = typeof moduleOptions.keyBuilder === 'function'
    ? moduleOptions.keyBuilder : defaultCacheKeyBuilder
  const shouldCache = typeof moduleOptions.shouldCache === 'function'
    ? moduleOptions.shouldCache : () => false
  const cacheBuilder = typeof moduleOptions.cacheBuilder === 'function'
    ? moduleOptions.cacheBuilder : () => null
  const shouldSave = typeof moduleOptions.shouldSave === 'function'
    ? moduleOptions.shouldSave : () => true
  // cache expire time in seconds
  const expireTime = moduleOptions.expireTime || defaultExpireTime
  const hashKey = moduleOptions.hashKey

  function defaultCacheKeyBuilder (route, context) {
    return route
  }

  this.nuxt.hook('render:before', (renderer, options) => {
    const renderRoute = renderer.renderRoute.bind(renderer)

    // rewrite the renderRoute funtion
    renderer.renderRoute = async function (route, context) {
      const cacheable = shouldCache(route, context)
      const cache = cacheBuilder(context)
      const saveable = shouldSave(context)

      function renderSetCache (cacheKey) {
        return renderRoute(route, context)
          .then(function (result) {
            if (!result.error && saveable) {
              cache.set(cacheKey, serialize(result), 'EX', expireTime).catch(() => {
                // no handler
              })
            }
            return result
          })
      }

      if (!cacheable || !cache) {
        return renderRoute(route, context)
      }

      const version = await cache.get(moduleOptions.versionKey).catch(() => {
        return null
      })

      if (version !== moduleOptions.appVersion) {
        return renderRoute(route, context)
      }

      const key = keyPrefix + keyBuilder(route, context)
      const cacheKey = hashKey
        ? crypto.createHmac('md5', seed).update(key).digest('hex')
        : key

      return cache.get(cacheKey)
        .then(function (cachedResult) {
          if (cachedResult) {
            // add hit flag
            context.req.hitCache = true
            return deserialize(cachedResult)
          }
          return renderSetCache(cacheKey)
        })
        .catch(function () {
          return renderSetCache(cacheKey)
        })
    }
  })

  // add cache hit header
  this.nuxt.hook('render:route', (url, result, context) => {
    if (moduleOptions.hitHeader && context.req.hitCache) {
      context.res.setHeader(moduleOptions.hitHeader, 'hit')
    }
  })
}
