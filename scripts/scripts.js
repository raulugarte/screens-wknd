import {
  sampleRUM,
  buildBlock,
  getMetadata,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  toClassName,
} from './lib-franklin.js';

import decoratePolarisAssets from './lib-polaris.js';
const LCP_BLOCKS = []; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'project-1'; // add your RUM generation information here

// Define the custom audiences mapping for experimentation
const EXPERIMENTATION_CONFIG = {
  audiences: {
    device: {
      mobile: () => window.innerWidth < 600,
      desktop: () => window.innerWidth >= 600,
    },
    visitor: {
      new: () => !localStorage.getItem('franklin-visitor-returning'),
      returning: () => !!localStorage.getItem('franklin-visitor-returning'),
    },
  },
};

/**
 * Determine if we are serving content for the block-library, if so don't load the header or footer
 * @returns {boolean} True if we are loading block library content
 */
export function isBlockLibrary() {
  return window.location.pathname.includes('block-library') || window.location.pathname.includes('screens-demo');
}

/**
 * Convience method for creating tags in one line of code
 * @param {string} tag Tag to create
 * @param {object} attributes Key/value object of attributes
 * @param {HTMLElement | HTMLElement[] | string} children Child element
 * @returns {HTMLElement} The created tag
 */
export function createTag(tag, attributes, children) {
  const element = document.createElement(tag);
  if (children) {
    if (children instanceof HTMLElement
      || children instanceof SVGElement
      || children instanceof DocumentFragment) {
      element.append(children);
    } else if (Array.isArray(children)) {
      element.append(...children);
    } else {
      element.insertAdjacentHTML('beforeend', children);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      element.setAttribute(key, val);
    });
  }
  return element;
}

function buildHeroBlock(main) {
  const h1 = main.querySelector('main > div > h1');
  const picture = main.querySelector('main > div > p > picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function patchDemoBlocks(config) {
  if (window.wknd.demoConfig.blocks && window.wknd.demoConfig.blocks[config.blockName]) {
    const url = window.wknd.demoConfig.blocks[config.blockName];
    const splits = new URL(url).pathname.split('/');
    const [, owner, repo, , branch] = splits;
    const path = splits.slice(5).join('/');

    const franklinPath = `https://little-forest-58aa.david8603.workers.dev/?url=https://${branch}--${repo}--${owner}.hlx.live/${path}`;
    return {
      ...config,
      jsPath: `${franklinPath}/${config.blockName}.js`,
      cssPath: `${franklinPath}/${config.blockName}.css`,
    };
  }
  return (config);
}

async function loadDemoConfig() {
  const demoConfig = {};
  const pathSegments = window.location.pathname.split('/');
  if (window.location.pathname.startsWith('/drafts/') && pathSegments.length > 4) {
    const demoBase = pathSegments.slice(0, 4).join('/');
    const resp = await fetch(`${demoBase}/theme.json?sheet=default&sheet=blocks&`);
    if (resp.status === 200) {
      const json = await resp.json();
      const tokens = json.data || json.default.data;
      const root = document.querySelector(':root');
      tokens.forEach((e) => {
        root.style.setProperty(`--${e.token}`, `${e.value}`);
        demoConfig[e.token] = e.value;
      });
      demoConfig.tokens = tokens;
      demoConfig.demoBase = demoBase;
      const blocks = json.blocks ? json.blocks.data : [];
      demoConfig.blocks = {};
      blocks.forEach((block) => {
        demoConfig.blocks[block.name] = block.url;
      });

      window.hlx.patchBlockConfig.push(patchDemoBlocks);
    }

    if (!demoConfig.demoBase) {
      const navCheck = await fetch(`${demoBase}/nav.plain.html`);
      if (navCheck.status === 200) {
        demoConfig.demoBase = demoBase;
      }
    }
  }
  window.wknd = window.wknd || {};
  window.wknd.demoConfig = demoConfig;
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);

  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decoratePolarisAssets(main);
}

/**
 * loads everything needed to get to LCP.
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();

  // load experiments
  const experiment = toClassName(getMetadata('experiment'));
  const instantExperiment = getMetadata('instant-experiment');
  if (instantExperiment || experiment) {
    const { runExperiment } = await import('./experimentation/index.js');
    await runExperiment(experiment, instantExperiment, EXPERIMENTATION_CONFIG);
  }

  // load demo config
  await loadDemoConfig();

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await waitForLCP(LCP_BLOCKS);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? main.querySelector(hash) : false;
  if (hash && element) element.scrollIntoView();

  if (!isBlockLibrary()) {
    loadHeader(doc.querySelector('header'));
    loadFooter(doc.querySelector('footer'));
  }

  if (window.wknd.demoConfig.fonts) {
    const fonts = window.wknd.demoConfig.fonts.split('\n');
    fonts.forEach(async (font) => {
      const [family, url] = font.split(': ');
      const ff = new FontFace(family, `url('${url}')`);
      await ff.load();
      document.fonts.add(ff);
    });
  } else {
    loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  }
  addFavIcon(`${window.wknd.demoConfig.demoBase || window.hlx.codeBasePath}/favicon.png`);
  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));

  // Load experimentation preview overlay
  if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.hlx.page')) {
    const preview = await import(`${window.hlx.codeBasePath}/tools/preview/preview.js`);
    await preview.default();
    if (window.hlx.experiment) {
      const experimentation = await import(`${window.hlx.codeBasePath}/tools/preview/experimentation.js`);
      experimentation.default();
    }
  }

  // Mark customer as having viewed the page once
  localStorage.setItem('franklin-visitor-returning', true);
}

/**
 * loads everything that happens a lot later, without impacting
 * the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}
async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  await decoreateThreeZoneMenuBoard(document,getMetadata('pos-data'));
  await decoreateThreeZoneMenu(document,getMetadata('pos-data'));
  if(document.querySelector('header'))
    document.querySelector('header').remove();
  loadDelayed();
  registerServiceWorker();
}

loadPage();
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(function(error) {
        console.error('Service Worker registration failed:', error);
      });
  }  
}
// Orchestrator

export function onNavigate(pathName) {
  // window.history.pushState(
  //   {},
  //   pathName,
  //   window.location.origin + pathName
  // )
  const allSections = document.getElementsByClassName('section');
  console.log(allSections);
  // eslint-disable-next-line no-restricted-syntax
  for (const item of allSections) {
    item.classList.remove('displaySection');
  }
  const section = document.getElementsByClassName(`section ${pathName}`);
  console.log(section, pathName);
  // eslint-disable-next-line no-unused-expressions
  section && section.length > 0 && section[0].classList.add('displaySection');
  window.lastNavigationTime = (new Date());
}

export function sendAnalyticsEvent(capturedData) {
  const data = {
    'event.type': capturedData.type,
    'event.coll_dts': capturedData.start,
    'event.dts_start': capturedData.start,
    'content.type': capturedData.contentType,
    'content.action': capturedData.action,
    'trn.product': capturedData.action,
    'trn.amount': capturedData.amount,
    'event.dts_end': capturedData.end,
    'event.count': capturedData.count,
    'event.value': capturedData.value,
    'trn.quantity': capturedData.quantity,
    'event.subtype': capturedData.subType
  };
  console.log(capturedData.value);
  window.parent.postMessage(JSON.stringify({
    namespace: 'screens-player',
    type: 'analytics-tracking-event',
    data,
  }),"*");
}

export function sendAnalyticsEventForProduct(capturedData) {
  const data = {
    'event.type': capturedData.type,
    'event.coll_dts': capturedData.start,
    'event.dts_start': capturedData.start,
    'content.type': capturedData.contentType,
    'content.action': capturedData.action,
    'trn.product': capturedData.product,
    'trn.amount': capturedData.amount,
    'event.dts_end': capturedData.end,
    'event.count': capturedData.count,
    'event.value': capturedData.value,
    'trn.quantity': capturedData.quantity,
    'event.subtype': capturedData.subType
  };
  console.log(capturedData.value);
  window.parent.postMessage(JSON.stringify({
    namespace: 'screens-player',
    type: 'analytics-tracking-event',
    data,
  }),"*");
}

function decoreateThreeZoneMenuBoard(document,posDataUrl){
  if(document.querySelector('.three-zone-menu-board')){
    document.querySelector('body').classList.add('menuboardbody');
    document.querySelector('header').remove();
    var columnscontainer = document.querySelector('.columns-container');
    columnscontainer.className = '';
    var menuboarddiv = document.querySelector('.three-zone-menu-board');
    menuboarddiv.className = '';
    menuboarddiv.classList.add('three-zone-menu-board');
    var childDivs = menuboarddiv.children;
    // Iterate over the first-level child div elements and add a class to each
    for (var i = 0; i < childDivs.length; i++) {
      var div = childDivs[i];
      div.classList.add('menucolumn');
      var menuchildDivs = div.children;
      // Append the outer <div> element to the document body
      menuchildDivs[3].className = 'menu-div';
      menuchildDivs[4].className = 'menu-div';
    }
    loadMenuItems(childDivs,'soup-menu','soup-menu-right',posDataUrl);
  }
}

function decoreateThreeZoneMenu(document,posDataUrl){
  if(document.querySelector('.three-zone-menu')){
    document.querySelector('body').classList.add('wknd-menuboardbody');
    document.querySelector('header').remove();
    var columnscontainer = document.querySelector('.columns-container');
    columnscontainer.className = '';
    var menuboarddiv = document.querySelector('.three-zone-menu');
    menuboarddiv.className = '';
    menuboarddiv.classList.add('three-zone-menu');
    var childDivs = menuboarddiv.children;
    // Iterate over the first-level child div elements and add a class to each
    for (var i = 0; i < childDivs.length; i++) {
      var div = childDivs[i];
      div.classList.add('wknd-menucolumn');
      var menuchildDivs = div.children;
      // Append the outer <div> element to the document body
      menuchildDivs[3].className = 'menu-div';
      menuchildDivs[4].className = 'menu-div';
    }
    loadMenuItems(childDivs,'soup-menu-wknd','soup-menu-wknd-right',posDataUrl);
    sampleRUM('screensthreezonemenuboard',{source:'screens-three-zone-menu',target:'wknd-cafe-menu'});
  }
}

function createMenuItems(menuItems,className,start,end){
// Create the outer <div> element
      var divElement = document.createElement("div");

      // Create the <ul> element with class "soup-menu"
      var ulElement = document.createElement("ul");
      ulElement.className = className;

      // Iterate over the soup items array
      for (var j = start; j < end; j++) {

        if(menuItems[j].availability === "true"){

              var menuItem = menuItems[j];

              // Create the <li> element
              var liElement = document.createElement("li");

              // Create the <p> element for the soup name
              var nameElement = document.createElement("p");
              nameElement.className = "name";
              nameElement.textContent = menuItem.product_name;

              // Create the <span> element for the seperator
              var separator = document.createElement("span");
              separator.className = "separator";
              

              // Create the <span> element for the soup price
              var priceElement = document.createElement("span");
              priceElement.className = "price";
              priceElement.textContent = '$'+menuItem.price;

              //nameElement.style.display = "inline";
              //priceElement.style.display = "inline";
              // Append the name and price elements to the <li> element
              liElement.appendChild(nameElement);
              liElement.appendChild(separator);
              liElement.appendChild(priceElement);

              var liElementDesciption = document.createElement("li");
              var descriptionElement = document.createElement("span");
              descriptionElement.className = "description";
              descriptionElement.textContent = menuItem.description;
              liElementDesciption.appendChild(descriptionElement);


              // Append the <li> element to the <ul> element
              ulElement.appendChild(liElement);
              ulElement.appendChild(liElementDesciption);
        }
      }

      // Append the <ul> element to the outer <div> element
      divElement.appendChild(ulElement);

      return divElement;
  }

  function loadMenuItems(childDivs,className,classNameRight,posDataUrl){
      fetch(posDataUrl)
      .then(response => response.json())
      .then(data => {
        for (var i = 0; i < childDivs.length; i++) {
          var div = childDivs[i];
          var menuchildDivs = div.children;
          var menuName = menuchildDivs[1].innerText.replace(/\s/g, "").toLowerCase();
          var picturediv = menuchildDivs[3].children[0];
          var length = data[menuName].data.length;
          var start = 0;
          var mid = length/2;
          var end = length;
          menuchildDivs[3].insertBefore(createMenuItems(data[menuName].data,className,start,mid),picturediv);
          menuchildDivs[4].append(createMenuItems(data[menuName].data,classNameRight,mid,end));
        }
    })
    .catch(error => {
      console.log('Error:', error);
    });
  }

// Cart functions
let cart = {};
let total = 0;
let productInCart = {};

function calculateTotal() {
  console.log(cart);
  total = Object.values(cart).reduce((accm, val) => accm + val, 0);
  console.log(total);
}

function updateAllCartQuantity() {
  const quantityElements = document.querySelectorAll('.cartQuantity');
  [...quantityElements].forEach((quantityElement) => {
    if (quantityElement.dataset.sku) {
      quantityElement.textContent = cart[quantityElement.dataset.sku] || 0;
    } else {
      quantityElement.querySelector('span').textContent = `${total}`;
      quantityElement.querySelector('img').style.animation = 'wiggle 2s linear';
      setTimeout(() => { quantityElement.querySelector('img').style.animation = ''; }, 2000);
    }
  });
}

export function addToCart(event) {
  const selectedProduct = event.currentTarget.dataset?.object
    && JSON.parse(event.currentTarget.dataset.object);
  event.stopPropagation();
  const sku = selectedProduct.sku;
  if (cart[sku]) cart[sku] += 1;
  else cart[sku] = 1;
  productInCart[sku] = selectedProduct;
  calculateTotal();
  updateAllCartQuantity();
  // send analytics data
  sendAnalyticsEventForProduct({
    type: 'click',
    start: (new Date()).toISOString(),
    end: (new Date()).toISOString(),
    value: `Product with SKU ${selectedProduct.sku} added to cart`,
    amount: selectedProduct.price_range.maximum_price.final_price.value,
    quantity: 1,
    count: 1,
    action: selectedProduct.name +' '+ selectedProduct.url_key,
    product: selectedProduct.url_key,
    contentType: 'Add To Cart',
    subType: 'end'
  });
}

export function removeFromCart(event) {
  const selectedProduct = event.currentTarget.dataset?.object
    && JSON.parse(event.currentTarget.dataset.object);
  event.stopPropagation();
  const sku = selectedProduct.sku;
  if (cart[sku] && cart[sku] !== 1) cart[sku] -= 1;
  else if (cart[sku]) {
    delete cart[sku];
  }
  calculateTotal();
  updateAllCartQuantity();
  // send analytics data
  sendAnalyticsEventForProduct({
    type: 'click',
    start: (new Date()).toISOString(),
    end: (new Date()).toISOString(),
    value: `Product with SKU ${selectedProduct.sku} removed from cart`,
    amount: selectedProduct.price_range.maximum_price.final_price.value,
    quantity: 1,
    count: 1,
    action: selectedProduct.name +' '+ selectedProduct.url_key,
    product: selectedProduct.url_key,
    contentType: 'Removed From Cart',
    subType: 'end'
  });
}

export function getCartInfo() {
  return cart;
}

export function getTotalCart() {
  return total;
}

export const renderCartInfo = (product) => {
  let quantity = getCartInfo()[product.sku];
  if (!quantity) {
    quantity = 0;
  }
  const cartInfo = document.createElement('div');
  cartInfo.className = 'cart-info';
  const addToCartButton = document.createElement('button');
  addToCartButton.style.lineHeight = 1;
  addToCartButton.style.borderRadius = '100px';
  addToCartButton.style.border = '1px';
  addToCartButton.textContent = '+';
  addToCartButton.setAttribute('data-object', JSON.stringify(product));
  addToCartButton.addEventListener('click', addToCart);
  const removeFromCartButton = document.createElement('button');
  removeFromCartButton.style.lineHeight = 1;
  removeFromCartButton.style.borderRadius = '100px';
  removeFromCartButton.style.border = '1px';
  removeFromCartButton.textContent = '-';
  removeFromCartButton.setAttribute('data-object', JSON.stringify(product));
  removeFromCartButton.addEventListener('click', removeFromCart);
  const quantityInfo = document.createElement('div');
  quantityInfo.textContent = quantity;
  quantityInfo.className = 'cartQuantity';
  quantityInfo.dataset.sku = product.sku;
  // if (!quantity) {
  //   removeFromCartButton.disabled = true;
  // }
  cartInfo.appendChild(addToCartButton);
  cartInfo.appendChild(quantityInfo);
  cartInfo.appendChild(removeFromCartButton);
  return cartInfo;
};

let qrData = {};

const getQRCode = () => {
  /* eslint-disable no-undef, no-unused-vars */
  const qrcode = new QRCode(document.getElementsByClassName('qrcode')[0], {
    text: JSON.stringify(qrData), width: 400, height: 400, correctLevel: QRCode.CorrectLevel.H,
  });
  console.log('qrData', qrData);
  // send analytics data
  const iterableArray = Object.entries(qrData);
  for (const [sku] of iterableArray) {
    const productCheckedOut = productInCart[sku]
    sendAnalyticsEventForProduct({
      type: 'check out',
      start: (new Date()).toISOString(),
      end: (new Date()).toISOString(),
      value: `Product with SKU ${productCheckedOut.sku} checked out`,
      amount: productCheckedOut.price_range.maximum_price.final_price.value,
      quantity: 1,
      count: 1,
      action: productCheckedOut.name +' '+ productCheckedOut.url_key,
      product: productCheckedOut.url_key,
      contentType: 'Check Out',
      subType: 'end'
    });
  }
  afterCheckout();
};

const loadQRscript = (callback) => {
  const script = document.createElement('script');
  script.setAttribute('src', '/scripts/qrcode.min.js');
  script.onload = callback;
  document.head.appendChild(script);
};

const closeCart = () => {
  if (!document.querySelector('.modal')) return;
  document.querySelector('.modal').classList.add('hidden');
  document.querySelector('.overlay').classList.add('hidden');

  onNavigate('category-container');
};

export const renderCart = () => {
  if (document.body.querySelector('.cardModal')) {
    document.body.removeChild(document.body.querySelector('.cardModal'));
  }
  const sectionCart = document.createElement('div');
  sectionCart.classList.add('cardModal');
  const cartDiv = document.createElement('div');
  cartDiv.classList.add('modal', 'hidden');
  const overlay = document.createElement('div');
  overlay.classList.add('overlay', 'hidden');
  const cartInfos = getCartInfo();
  const closeButton = document.createElement('button');
  closeButton.classList.add('btn-close');
  closeButton.textContent = 'X';
  closeButton.addEventListener('click', closeCart);
  cartDiv.appendChild(closeButton);
  if (cartInfos) {
    Object.keys(cartInfos).forEach((key) => {
      const productInCart = document.createElement('div');
      productInCart.style.display = 'flex';
      const productDescription = document.createElement('div');
      productDescription.textContent = key;
      productInCart.appendChild(productDescription);
      qrData[key] = cart[key];
      // productInCart.appendChild(renderCartInfo(key));
      // cartDiv.appendChild(productInCart);
    });
  }
  const QRCodeContainer = document.createElement('div');
  QRCodeContainer.className = 'qrcode-container';
  const QRCodeEle = document.createElement('div');
  QRCodeEle.className = 'qrcode';
  const QRCodeEleTitle = document.createElement('div');
  QRCodeEleTitle.className = 'qrcode-title';
  QRCodeEleTitle.textContent = 'Scan QR for cart';
  QRCodeContainer.appendChild(QRCodeEleTitle);
  QRCodeContainer.appendChild(QRCodeEle);
  cartDiv.appendChild(QRCodeContainer);
  sectionCart.appendChild(overlay);
  sectionCart.appendChild(cartDiv);
  document.body.appendChild(sectionCart);
  loadQRscript(getQRCode);
};

const openCart = () => {
  renderCart();
  document.querySelector('.modal').classList.remove('hidden');
  document.querySelector('.overlay').classList.remove('hidden');
};

export const renderCartButton = () => {
  const cartButton = document.createElement('div');
  cartButton.classList.add('cartQuantity', 'cartButton');
  cartButton.style.display = 'flex';
  cartButton.style.flexDirection = 'column';
  cartButton.style.alignItems = 'center';
  const cartButtonSvg = new Image();
  cartButtonSvg.style.height = '4rem';
  cartButtonSvg.src = 'https://main--wknd--hlxscreens.hlx.live/screens-demo/cart-shopping-svgrepo-com.svg';
  cartButtonSvg.alt = 'cart-button';
  const cartDescription = document.createElement('span');
  cartDescription.textContent = `${getTotalCart()}`;
  cartDescription.style.position = 'relative';
  cartDescription.style.top = '1rem';
  cartDescription.style.paddingLeft = '0.5rem';
  cartButton.appendChild(cartDescription);
  cartButton.appendChild(cartButtonSvg);

  cartButton.addEventListener('click', openCart);
  return cartButton;
};

export const clearCart = () => {
  cart = {};
  productInCart = {};
  closeCart();
  calculateTotal();
  updateAllCartQuantity();
  qrData = {};
};

export const afterCheckout = () => {
  cart = {};
  productInCart = {};
  calculateTotal();
  updateAllCartQuantity();
  qrData = {};
};

sampleRUM.always.on('screensloopingcontent', (data) => { 
  console.log('screensloopingcontent event captured..........');
  const sendPing = (pdata = data) => {
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const weight = 1;
        const id = window.hlx.rum.id;
        const body = JSON.stringify({ weight, id, referer: window.location.href, generation: window.hlx.RUM_GENERATION, checkpoint: 'screensloopingcontent', ...data });
        const url = `https://rum.hlx.page/.rum/${weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
        // eslint-disable-next-line no-console
        console.debug(`ping:${checkpoint}`, pdata);
      };
      sampleRUM.cases = sampleRUM.cases || {
        cwv: () => sampleRUM.cwv(data) || true,
        lazy: () => {
          // use classic script to avoid CORS issues
          const script = document.createElement('script');
          script.src = 'https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^1/src/index.js';
          document.head.appendChild(script);
          return true;
        },
      };
      sendPing(data);
});

sampleRUM.always.on('screensthreezonemenuboard', (data) => { 
  console.log('screensthreezonemenuboard event captured..........');
  const sendPing = (pdata = data) => {
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const weight = 1;
        const id = window.hlx.rum.id;
        const body = JSON.stringify({ weight, id, referer: window.location.href, generation: window.hlx.RUM_GENERATION, checkpoint: 'screensthreezonemenuboard', ...data });
        const url = `https://rum.hlx.page/.rum/${weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
        // eslint-disable-next-line no-console
        console.debug(`ping:${checkpoint}`, pdata);
      };
      sampleRUM.cases = sampleRUM.cases || {
        cwv: () => sampleRUM.cwv(data) || true,
        lazy: () => {
          // use classic script to avoid CORS issues
          const script = document.createElement('script');
          script.src = 'https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^1/src/index.js';
          document.head.appendChild(script);
          return true;
        },
      };
      sendPing(data);
});
