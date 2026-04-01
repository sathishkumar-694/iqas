'use strict'

export const config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'IQAS Server BackEnd'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  
  // Only enable agent if a valid key is provided to prevent local crashes
  agent_enabled: !!process.env.NEW_RELIC_LICENSE_KEY && process.env.NEW_RELIC_LICENSE_KEY !== 'YOUR_NEW_RELIC_LICENSE_KEY_HERE',
  
  logging: {
    level: 'error'
  },
  
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
}
