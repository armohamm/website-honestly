import crypto from 'crypto';
import Helmet from 'react-helmet';
import path from 'path';

import { ChunkExtractor } from '@loadable/server';
import { renderToString } from 'react-dom/server';

import createStateNavigator from '../routes';
import layoutTemplate from '../index.ejs';
import { cssPath, jsPath } from './asset-paths';

const tracking = !!process.env.INSERT_TRACKING;

const TITLE_SUFFIX = 'Red Badger';

const statsFile = path.resolve('./dist/loadable-stats.json');
const extractor = new ChunkExtractor({ statsFile, entrypoints: ['index'] });

const titleFor = (def, props) => {
  if (typeof def.title === 'function') {
    return def.title(props);
  }

  return def.title;
};

/*
  Routes: /, /about-us/join-us/{slug}
  Expanded: /, /about-us/join-us/software-engineer etc.
*/

const routeFilePath = routePath => {
  if (routePath === '') {
    return 'index.html';
  }
  if (routePath === '404') {
    return '404.html';
  }
  return `${routePath}/index.html`;
};

const filePathFor = (stateNavigator, key, params) => {
  const route = stateNavigator.getNavigationLink(key, params);
  if (!route) {
    throw new Error(
      `The route could not be matched for key: ${key}, params: ${JSON.stringify(params)}`,
    );
  }
  return { link: route, filePath: routeFilePath(route.substring(1)) };
};

export const expandRoutes = (state, stateNavigator) => {
  const routeDefs = Object.keys(stateNavigator.states).map(key => stateNavigator.states[key]);
  const staticRoutes = routeDefs
    .filter(def => !def.gen)
    .map(def => ({
      ...def,
      title: titleFor(def, def.stateToProps && def.stateToProps(state)),
      ...filePathFor(stateNavigator, def.key),
      props: def.stateToProps && def.stateToProps(state),
    }));

  const dynamicRoutes = routeDefs
    .filter(def => !!def.gen)
    .map(def => {
      return def.gen(state).map(params => ({
        ...def,
        title: titleFor(def, def.stateToProps && def.stateToProps(state, params)),
        ...filePathFor(stateNavigator, def.key, params),
        props: def.stateToProps && def.stateToProps(state, params),
      }));
    });

  const flattened = dynamicRoutes.reduce((flat, arr) => flat.concat(arr), []);

  return staticRoutes.concat(flattened);
};

export function compileRoutes(state) {
  const stateNavigator = createStateNavigator();

  const stateString = state.data ? JSON.stringify(state.data) : '{}';
  const stateHash = crypto
    .createHash('md5')
    .update(stateString)
    .digest('hex');
  const stateFile = {
    body: stateString,
    path: `${process.env.URL_BASENAME || ''}state-${stateHash}.json`,
    contentType: 'application/json',
    cacheControl: 'public, max-age=31536000',
  };
  console.log(`Compiled ${stateFile.path}`); // eslint-disable-line no-console

  const compile = route => {
    const routePath = (process.env.URL_BASENAME || '') + route.filePath;

    const title = `${route.title} | ${TITLE_SUFFIX}`;

    const description = `${route.description || ''}`;

    stateNavigator.navigateLink(route.link, 'none');
    const renderStart = Date.now();
    const jsx = extractor.collectChunks(route.component({ stateNavigator, title }, route.props));
    const bodyContent = renderToString(jsx);
    const meta = typeof window === 'undefined' ? Helmet.rewind().meta : null;
    const renderMs = Date.now() - renderStart;

  // need to place these in layoutTemplate/ index.ejs
    const scriptTags = extractor.getScriptTags(); 
    const linkTags = extractor.getLinkTags(); 
    const styleTags = extractor.getStyleTags();

    const ejsStart = Date.now();
    const body = layoutTemplate({
      title,
      description,
      tracking,
      bodyContent,
      cssPath,
      jsPath,
      meta,
      stateHash,
      scriptTags,
      linkTags,
      styleTags,
    });
    const ejsMs = Date.now() - ejsStart;
    console.log(`Compiled ${route.filePath} render=${renderMs} ejs=${ejsMs}`); // eslint-disable-line no-console

    return { body, routePath, contentType: 'text/html' };
  };

  const routeFiles = expandRoutes(state.data, stateNavigator).map(compile);

  return { ...state, data: [stateFile, ...routeFiles] };
}

export function compileSite(state) {
  return compileRoutes(state);
}
