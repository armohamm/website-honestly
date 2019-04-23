import 'es6-promise/auto';
import 'whatwg-fetch';
import { loadableReady } from '@loadable/component';

import { makeApp } from '../site/client';

const element = document.querySelector('.js-app');
const stateHash = document.getElementById('state-hash').value;

fetch(`/${process.env.URL_BASENAME || ''}state-${stateHash}.json`)
  .then(response => response.json())
  .then(state => {
    loadableReady(() => {
      makeApp({ element, state }).start();
    });
  });
