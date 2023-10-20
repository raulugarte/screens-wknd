import { onNavigate, renderCartButton, sendAnalyticsEvent, sendAnalyticsEventForProduct, renderCartInfo } from '../../scripts/scripts.js';

let isLoading = false;
let perPage = 10;
let totalPages = 2;
let currentPage = 1;
let items;
let ratingslocationURL;
let ratingsData;
let offers;
let offersData;
let store;
let latitude;
let longitude;
let getProductsInCategory = `query getProductsInCategory($uid: String!) {   
    products(filter: { category_uid: { eq: $uid} }) {
      items {
        name
        sku
        url_key
        is_returnable
        image {
          label
          url
        }
        short_description{
          html
        }
        small_image{
          label
          url
        }
        swatch_image
        price_range{
        maximum_price{
          final_price{
            currency
            value
          }
        }
        minimum_price{
          final_price{
            currency
            value
          }
        }
        }
      }
        page_info {
          current_page
          page_size
          total_pages
        }
        total_count
      }
    }
  `;

getProductsInCategory = getProductsInCategory.split(/(?:\r\n|\r|\n|\t|[\s]{4})/g).join(' ');
const fetchCoordinates = async () => {
  if (navigator && navigator.geolocation) {
    try {
      await navigator.geolocation.getCurrentPosition((position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      });
    } catch (err) {
      console.log(err);
    }
  }
};
const homeButtonClick = () => {
  sendAnalyticsEvent({
    type: 'click',
    start: (new Date()).toISOString(),
    end: (new Date()).toISOString(),
    value: 'Home button clicked on product listing page',
    action: 'Home',
    amount: 0,
    quantity: 0,
    contentType: 'Button',
    count: 1,
    subType: 'end'
  });
  onNavigate('category-container');
};

const hasOffer = () => {
  const isOfferEnabled = offers && offers.type && offers.count && offers.order && offers.discount;
  return isOfferEnabled;
};

const productOnOffer = (sku) => {
  const isOfferEnabled = hasOffer();
  if (!isOfferEnabled || !offersData) return false;
  return offersData.find((productInOffer) => productInOffer.sku === sku);
};

const railStatus = () => {
  const leftRail = document.getElementsByClassName('left-rail');
  const rightRail = document.getElementsByClassName('right-rail');
  console.log('status', currentPage, totalPages);
  if (leftRail && rightRail) {
    if (currentPage === 1 && currentPage === totalPages) {
      leftRail[0].classList.add('disable-button');
      rightRail[0].classList.add('disable-button');
    } else if (currentPage === 1) {
      leftRail[0].classList.add('disable-button');
      rightRail[0].classList.remove('disable-button');
    } else if (currentPage === totalPages) {
      leftRail[0].classList.remove('disable-button');
      rightRail[0].classList.add('disable-button');
    } else {
      leftRail[0].classList.remove('disable-button');
      rightRail[0].classList.remove('disable-button');
    }
  }
};

const onProductClick = (event) => {
  console.log(event.currentTarget);
  const selectedProductSKU = event.currentTarget.getAttribute('sku');
  if (!selectedProductSKU) {
    return;
  }
  const selectedProduct = event.currentTarget.dataset?.object
    && JSON.parse(event.currentTarget.dataset.object);
  console.log(selectedProductSKU, selectedProduct);
  if (!selectedProduct) return;
  const productDetail = document.getElementsByClassName('product-detail')[0];
  productDetail.textContent = '';
  productDetail.setAttribute('sku', selectedProductSKU);
  productDetail.setAttribute('data-object', JSON.stringify(selectedProduct));
  sendAnalyticsEventForProduct({
    type: 'click',
    start: (new Date()).toISOString(),
    end: (new Date()).toISOString(),
    value: `Product with SKU ${selectedProductSKU} visited`,
    amount: selectedProduct.price_range.maximum_price.final_price.value,
    quantity: 1,
    count: 1,
    action: selectedProduct.name +' '+ selectedProduct.url_key,
    product: selectedProduct.url_key,
    contentType: 'Product',
    subType: 'end'
  });
  onNavigate('product-detail-container');
};

const getHeaderAndSearch = (heading) => {
  const headerDiv = document.createElement('div');
  headerDiv.className = 'header-search';
  const header = document.createElement('H1');
  const text = document.createTextNode(heading);
  header.appendChild(text);
  headerDiv.append(header);
  // search bar
  // const formContainer = document.createElement('div');
  // formContainer.className = 'form-container';
  // const form = document.createElement('form');
  // form.className = 'form';
  // const inputField = document.createElement('input');
  // inputField.setAttribute('id', 'search');
  // inputField.className = 'input';
  // const searchButton = document.createElement('button');
  // searchButton.className = 'search-results';
  // searchButton.textContent = 'search';
  // form.append(inputField);
  // form.append(searchButton);
  // formContainer.append(form);
  // headerDiv.append(formContainer);
  // Home button
  const imgDiv = document.createElement('div');
  imgDiv.className = 'home';
  const backSvg = new Image();
  backSvg.src = 'https://main--wknd--hlxscreens.hlx.live/screens-demo/home-icon-silhouette-svgrepo-com.svg';
  backSvg.alt = 'Go Back';
  imgDiv.append(backSvg);
  const btnText = document.createElement('div');
  btnText.textContent = 'HOME';
  imgDiv.append(btnText);
  imgDiv.addEventListener('click', homeButtonClick);
  headerDiv.append(imgDiv);
  return headerDiv;
};

const getSkeleton = () => {
  const skeletonGrid = document.createElement('div');
  skeletonGrid.className = 'skeleton-grid';
  const times = 4;
  for (let id = 0; id < times; id += 1) {
    const skeletonDiv = document.createElement('div');
    skeletonDiv.className = 'skeleton';
    skeletonDiv.setAttribute('id', id);
    skeletonGrid.append(skeletonDiv);
  }
  return skeletonGrid;
};

const renderSkeleton = (target) => {
  const heading = target.getAttribute('category-name');
  target.textContent = '';
  target.append(getHeaderAndSearch(heading));
  target.append(getSkeleton());
};

const getDetails = (product) => {
  const details = document.createElement('div');
  details.className = 'product-details';
  const title = document.createElement('span');
  title.textContent = product.name;
  const productPrice = document.createElement('div');
  const priceSpan = document.createElement('span');
  const price = document.createElement('span');
  price.className = 'product-price';
  priceSpan.textContent = 'Starts at $';
  price.textContent = `${product.price_range.minimum_price.final_price.value}`;
  if (store && store === 'noida') {
    priceSpan.textContent = 'Starts at ₹';
    price.textContent = `${product.price_range.minimum_price.final_price.value * 80}`;
  }
  productPrice.append(priceSpan);
  productPrice.append(price);
  if (productOnOffer(product.sku)) {
    price.classList.add('strike');
    let originalPrice;
    originalPrice = product.price_range.minimum_price.final_price.value;
    if (store && store === 'noida') {
      originalPrice *= 80;
    }
    const discount = Number(offers.discount.slice(0, -1));
    const newPrice = (originalPrice * (100 - discount)) / 100;
    const newPriceSpan = document.createElement('span');
    newPriceSpan.className = 'newproduct-price';
    const discountPrice = document.createElement('span');
    discountPrice.textContent = `$${newPrice}`;
    if (store && store === 'noida') {
      discountPrice.textContent = `₹${newPrice}`;
    }
    const discountDetail = document.createElement('span');
    discountDetail.textContent = `(-${discount}%)`;
    newPriceSpan.append(discountPrice);
    newPriceSpan.append(discountDetail);
    productPrice.append(newPriceSpan);
  }
  const ratingsDiv = document.createElement('div');
  ratingsDiv.className = 'Stars';
  ratingsDiv.style.setProperty('--rating', ratingsData.find((rating) => rating.SKU === product.sku).Rating);
  const cartInfo = renderCartInfo(product);
  details.append(title);
  details.append(productPrice);
  details.append(ratingsDiv);
  details.append(cartInfo);
  return details;
};

const getItem = (product) => {
  const productDiv = document.createElement('div');
  productDiv.className = 'product';
  productDiv.setAttribute('sku', product.sku);
  productDiv.setAttribute('data-object', JSON.stringify(product));
  productDiv.addEventListener('click', onProductClick);
  const imgDiv = document.createElement('div');
  imgDiv.className = 'product-img';
  imgDiv.setAttribute('id', product.sku);
  const img = new Image();
  img.src = product.image.url;
  img.alt = product.image.label;
  imgDiv.append(img);
  productDiv.append(getDetails(product));
  productDiv.append(imgDiv);
  return productDiv;
};

const leftButtonClick = (event) => {
  console.log(event.currentTarget);
  if (currentPage !== 1) {
    console.log(currentPage);
    currentPage -= 1;
    railStatus();
    const productGrid = document.getElementsByClassName('product-grid');
    // eslint-disable-next-line no-use-before-define
    if (productGrid) renderProductsGrid(productGrid[0]);
    // eslint-disable-next-line no-use-before-define
  }
};
const rightButtonClick = (event) => {
  console.log(event.currentTarget);
  if (currentPage !== totalPages) {
    currentPage += 1;
    railStatus();
    const productListing = document.getElementsByClassName('product-listing')[0];
    // eslint-disable-next-line no-use-before-define
    renderProductsPage(productListing, items);
  }
};

const getRail = (className, url, callback, alt) => {
  const rail = document.createElement('div');
  rail.classList.add(className);
  const btnSVG = new Image();
  btnSVG.src = url;
  btnSVG.alt = alt || 'btn';
  rail.append(btnSVG);
  rail.addEventListener('click', callback);
  return rail;
};

const renderProductsGrid = (productGrid) => {
  console.log(currentPage, totalPages, perPage);
  if (!items) return;
  console.log('rendering productGrid');
  productGrid.textContent = '';
  const totalItems = items.length;
  const startIdx = (currentPage - 1) * perPage;
  const renderProducts = items.slice(startIdx, Math.min(startIdx + perPage, totalItems));
  renderProducts.forEach((product) => {
    productGrid.append(getItem(product));
  });
};

const renderItems = () => {
  const productView = document.createElement('div');
  productView.className = 'product-view';
  const leftArrowURL = 'https://main--wknd--hlxscreens.hlx.live/screens-demo/left-arrow-svgrepo-com-1.svg';
  const rightArrowURL = 'https://main--wknd--hlxscreens.hlx.live/screens-demo/right-arrow-backup-2-svgrepo-com.svg';
  const leftRail = getRail('left-rail', leftArrowURL, leftButtonClick, 'left-rail');
  const rightRail = getRail('right-rail', rightArrowURL, rightButtonClick, 'right-rail');
  if (currentPage === 1) {
    leftRail.classList.add('disable-button');
  }
  if (currentPage === totalPages) {
    rightRail.classList.add('disable-button');
  }
  const productGrid = document.createElement('div');
  productGrid.className = 'product-grid';
  console.log(productGrid);
  renderProductsGrid(productGrid);
  productView.append(leftRail);
  productView.append(productGrid);
  productView.append(rightRail);
  return productView;
};

const renderProductsPage = (target, products) => {
  const heading = target.getAttribute('category-name');
  target.textContent = '';
  target.append(getHeaderAndSearch(heading));
  const itemsPage = renderItems(products);
  target.append(itemsPage);
  target.append(renderCartButton());
};
const endpoint = 'https://graphql.aem-screens.com';
const storeView = 'wknd';

const fetchGet = async (endpoint, storeView, query, variables) => {
  const api = new URL(endpoint);
  api.searchParams.append('query', query);
  api.searchParams.append('variables', JSON.stringify(variables));
  return await fetch(api, {
      method: 'GET',
      headers: {
          'content-Type': 'application/json',
          'store': storeView,
          'X-Cache-Strategy':'external-cache'
      },
  });
}
const observer = new MutationObserver((mutations) => {
  Promise.all(mutations.map(async (mutation) => {
    if (mutation.type === 'attributes') {
      console.log('Mutation target', mutation.target);
      const categoryId = mutation.target.getAttribute('category-id');
      if (!categoryId) return;
      if (isLoading) {
        console.log('returning subsequent calls');
        return;
      }
      renderSkeleton(mutation.target);
      // fetch data
      isLoading = true;
      try {
        let rawResponse;
        let ratingsLocationRawResponse;
        let offersRawResponse;
        let url = ratingslocationURL;
        await fetchCoordinates();
        if (latitude && longitude) {
          //url = `${ratingslocationURL}?latitude=${latitude}&longitude=${longitude}`;
          url = `${ratingslocationURL}`;
        }
        
        if (hasOffer()) {
          [rawResponse, ratingsLocationRawResponse, offersRawResponse] = await Promise.all([
            fetchGet(endpoint,storeView,getProductsInCategory,{ uid: categoryId }),
            fetch(url,{ headers:{ 'X-Cache-Strategy':'external-cache'}}),
            fetch(`https://offers.aem-screens.com?type=${offers.type}&order=${offers.order}&count=${offers.count}`,{ headers:{ 'X-Cache-Strategy':'external-cache'}}),
          ]);
          offersData = await offersRawResponse.json();
        } else {
          [rawResponse, ratingsLocationRawResponse] = await Promise.all([
            fetchGet(endpoint,storeView,getProductsInCategory,{ uid: categoryId }),
            fetch(ratingslocationURL,{ headers:{ 'X-Cache-Strategy':'external-cache'}}),
          ]);
        }
        if (!rawResponse.ok || !ratingsLocationRawResponse.ok) {
          return;
        }
        console.log('ok response');
        // execute dom change
        currentPage = 1;
        const response = await rawResponse.json();
        const ratingsResponse = await ratingsLocationRawResponse.json();
        store = ratingsResponse.store;
        items = response.data.products.items;
        ratingsData = ratingsResponse.data;
        const width = window.innerWidth;
        if (width > 1500) {
          perPage = 10;
        } else if (width > 1250) {
          perPage = 8;
        } else if (width > 1000) {
          perPage = 6;
        } else {
          perPage = 4;
        }
        totalPages = Math.ceil(items.length / perPage);
        renderProductsPage(mutation.target, response.data.products.items);
      } catch (err) {
        console.log('loading failed');
      }
      isLoading = false;
    }
  }));
});
export default function decorate(block) {
  ratingslocationURL = block.closest('.section').dataset.ratingsLocation;
  const offerContainer = document.getElementsByClassName('section offers-container');
  if (offerContainer.length) {
    const offersList = document.getElementsByClassName('offers block');
    if (offersList.length) {
      const [offersBlock] = offersList;
      offers = {
        type: offersBlock.children[0].children[0].textContent,
        order: offersBlock.children[0].children[1].textContent,
        count: offersBlock.children[0].children[2].textContent,
        discount: offersBlock.children[0].children[3].textContent,
      };
      console.log('[offers]', offers);
    }
  }
  observer.observe(block, {
    attributes: true, // configure it to listen to attribute changes
  });
  block.textContent = '';
}
