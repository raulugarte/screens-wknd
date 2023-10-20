importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.2.0/workbox-sw.js');
//!function(){"use strict";try{self["workbox:sw:6.2.0"]&&_()}catch(t){}const t={backgroundSync:"background-sync",broadcastUpdate:"broadcast-update",cacheableResponse:"cacheable-response",core:"core",expiration:"expiration",googleAnalytics:"offline-ga",navigationPreload:"navigation-preload",precaching:"precaching",rangeRequests:"range-requests",routing:"routing",strategies:"strategies",streams:"streams",recipes:"recipes"};self.workbox=new class{constructor(){return this.v={},this.Pt={debug:"localhost"===self.location.hostname,modulePathPrefix:null,modulePathCb:null},this.$t=this.Pt.debug?"dev":"prod",this.Ct=!1,new Proxy(this,{get(e,s){if(e[s])return e[s];const o=t[s];return o&&e.loadModule("workbox-"+o),e[s]}})}setConfig(t={}){if(this.Ct)throw new Error("Config must be set before accessing workbox.* modules");Object.assign(this.Pt,t),this.$t=this.Pt.debug?"dev":"prod"}loadModule(t){const e=this.jt(t);try{importScripts(e),this.Ct=!0}catch(s){throw console.error(`Unable to import module '${t}' from '${e}'.`),s}}jt(t){if(this.Pt.modulePathCb)return this.Pt.modulePathCb(t,this.Pt.debug);let e=["https://storage.googleapis.com/workbox-cdn/releases/6.2.0"];const s=`${t}.${this.$t}.js`,o=this.Pt.modulePathPrefix;return o&&(e=o.split("/"),""===e[e.length-1]&&e.splice(e.length-1,1)),e.push(s),e.join("/")}}}();
//# sourceMappingURL=workbox-sw.js.map
// Cache your assets
workbox.setConfig({ debug: true });
workbox.routing.registerRoute(
  /\.(?:js|css|ttf)$/,
  new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.registerRoute(
  /\.(?:html|jpg|jpeg|png|gif|svg)$/,
  new workbox.strategies.CacheFirst()
);

workbox.routing.registerRoute(
  /\.(?:html|jpg|jpeg|png|gif|svg).*$/,
  new workbox.strategies.CacheFirst()
);

const imageDelivery = /^https:\/\/jnz3dtiuj77ca\.dummycachetest\.com\/.*\.(html|jpg|jpeg|png|gif|svg)$/;

workbox.routing.registerRoute(
  imageDelivery,
  new workbox.strategies.CacheFirst({
    cacheName: 'commerce-cache',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0], // Cache responses with a 200 status code
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Cache a maximum of 50 responses
        maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for 7 days
      }),
    ],
  })
);

const reviewLocation = /^https:\/\/reviewlocation\.aem-screens\.com\/.*$/;
workbox.routing.registerRoute(
  reviewLocation,
  new workbox.strategies.CacheFirst({
    cacheName: 'review-location',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [200], // Cache responses with a 200 status code
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Cache a maximum of 50 responses
        maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for 7 days
      }),
    ],
  })
);


const offers = /^https:\/\/offers\.aem-screens\.com\/.*$/;
workbox.routing.registerRoute(
  offers,
  new workbox.strategies.CacheFirst({
    cacheName: 'offers',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [200], // Cache responses with a 200 status code
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Cache a maximum of 50 responses
        maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for 7 days
      }),
    ],
  })
);


const graphQL = /^https:\/\/graphql\.aem-screens\.com\/.*$/;
workbox.routing.registerRoute(
  graphQL,
  new workbox.strategies.CacheFirst({
    cacheName: 'graphQL-Response',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [200], // Cache responses with a 200 status code
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Cache a maximum of 50 responses
        maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for 7 days
      }),
    ],
  })
);

const franklinPreview = /^https:\/\/main--wknd--hlxscreens\.hlx\.page\/.*$/
workbox.routing.registerRoute(
  franklinPreview,
  new workbox.strategies.CacheFirst({
    cacheName: 'franklin-prview',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0], // Cache responses with a 200 status code
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Cache a maximum of 50 responses
        maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for 7 days
      }),
    ],
  })
);

const franklinLive = /^https:\/\/main--wknd--hlxscreens\.hlx\.live\/.*$/
workbox.routing.registerRoute(
  franklinLive,
  new workbox.strategies.CacheFirst({
    cacheName: 'franklin-live',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0], // Cache responses with a 200 status code
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Cache a maximum of 50 responses
        maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for 7 days
      }),
    ],
  })
);

const appRoot = 'https://main--wknd--hlxscreens.hlx.live/screens-demo/wknd-kiosk-commerce'
workbox.routing.registerRoute(
  appRoot,
  new workbox.strategies.CacheFirst({
    cacheName: 'appRoot',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [200], // Cache responses with a 200 status code
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Cache a maximum of 50 responses
        maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for 7 days
      }),
    ],
  })
);

const fonts = /^https:\/\/fonts\.googleapis\.com\/.*$/
workbox.routing.registerRoute(
  fonts,
  new workbox.strategies.CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0], // Cache responses with a 200 status code
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Cache a maximum of 50 responses
        maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for 7 days
      }),
    ],
  })
);

