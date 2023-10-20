// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

// eslint-disable-next-line import/no-cycle
import { onNavigate, sendAnalyticsEvent, clearCart } from './scripts.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here

function playVideo(divWrappingVideo) {
  divWrappingVideo.firstElementChild.muted = true;
  setTimeout(() => {
    divWrappingVideo.firstElementChild.play();
  }, 300);
}

function stopVideo(divWrappingVideo) {
  divWrappingVideo.firstElementChild.pause();
  divWrappingVideo.firstElementChild.load();
}

function deactivateCurrentElement(divWrapping) {
  if (divWrapping.classList.contains('active')) {
    divWrapping.classList.remove('active');
  }
  if (divWrapping.querySelectorAll('img').length === 0) {
    stopVideo(divWrapping);
  }
}

function activateNextElement(divWrapping) {
  if (!divWrapping.classList.contains('active')) divWrapping.classList.add('active');
  if (divWrapping.querySelectorAll('img').length === 0) {
    playVideo(divWrapping);
  }
}

let carouselTimeout;
let currentPlaying = 0;
let idleTimer;
let screenIdle = true;

function handleTransition(sequence) {
  deactivateCurrentElement(sequence.children[currentPlaying], currentPlaying);
  currentPlaying += 1;
  if (currentPlaying === sequence.childElementCount) {
    currentPlaying = 0;
  }
  activateNextElement(sequence.children[currentPlaying]);
  if(screenIdle) {
    if(sequence.children[currentPlaying].getElementsByTagName('video').length >0 ){
      let duration = parseInt(sequence.children[currentPlaying].getAttribute('duration'));
      let lastIndex = sequence.children[currentPlaying].getElementsByTagName('video')[0].getElementsByTagName('source')[0].src.lastIndexOf('/');
      let length = sequence.children[currentPlaying].getElementsByTagName('video')[0].getElementsByTagName('source')[0].src.length;
      let action = sequence.children[currentPlaying].getElementsByTagName('video')[0].getElementsByTagName('source')[0].src.substring(lastIndex,length);
      sendAnalyticsEvent({
        type: 'play',
        start: (new Date()).toISOString(),
        end: (new Date()).toISOString(),
        value: 'Played video content path '+ action,
        action: action,
        quantity: duration,
        contentType: 'VIDEO',
        count: 1,
        subType: 'end',
        amount: 0
      });
    }
    else {
      let lastIndex = sequence.children[currentPlaying].getElementsByTagName('img')[0].src.lastIndexOf('/');
      let length = sequence.children[currentPlaying].getElementsByTagName('img')[0].src.length;
      let action = sequence.children[currentPlaying].getElementsByTagName('img')[0].src.substring(lastIndex,length);
      sendAnalyticsEvent({
        type: 'play',
        start: (new Date()).toISOString(),
        end: (new Date()).toISOString(),
        value: 'Showing image '+ action,
        action: action,
        quantity: 8000,
        contentType: 'IMAGE',
        count: 1,
        subType: 'end',
        amount: 0
      });
    }
  }
  const switchTimeout = sequence.children[currentPlaying].getAttribute('duration') || 8000;
  console.log(switchTimeout);
  carouselTimeout = setTimeout(handleTransition, switchTimeout, sequence);
}

function startCarousel(sequence) {
  screenIdle = true;
  sequence.classList.add('idle');
  currentPlaying = 0;
  activateNextElement(sequence.children[currentPlaying]);
  const switchTimeout = sequence.children[currentPlaying].getAttribute('duration') || 8000;
  console.log(switchTimeout);
  carouselTimeout = setTimeout(handleTransition, switchTimeout, sequence);
}

function idleHandler() {
  const carousels = document.querySelectorAll('.sequence');
  carousels.forEach((sequence) => {
    if (!sequence.classList.contains('idle')) {
      onNavigate('idle-carousel-container');
      startCarousel(sequence);
    }
  });
  clearCart();
}

function stopCarousel(sequence) {
  screenIdle = false;
  sequence.classList.remove('idle');
  // eslint-disable-next-line no-restricted-syntax
  for (const item of sequence.children) {
    deactivateCurrentElement(item);
  }
}

function interactionEventHandler() {
  const carousels = document.querySelectorAll('.sequence');
  carousels.forEach((sequence) => {
    if (sequence.classList.contains('idle')) {
      onNavigate('category-container');
      sendAnalyticsEvent({
        type: 'click',
        start: (new Date()).toISOString(),
        end: (new Date()).toISOString(),
        value: 'Ineraction with Ideal Screen',
        action: 'Interaction with Ideal Screen',
        amount: 0,
        quantity: 1,
        count: 1,
        subType: 'end',
        contentType: 'Touch Me'
      });
      stopCarousel(sequence);
      clearTimeout(carouselTimeout);
    }
  });
}

const activityDetector = () => {
  idleHandler();
  const resetTimer = () => {
    interactionEventHandler();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(idleHandler, 20000);
  };
  window.onload = resetTimer;
  document.onclick = resetTimer;
  document.onkeydown = resetTimer;
};
activityDetector();
