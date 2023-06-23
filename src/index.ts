import {CurveTool} from './curve-tool';

const images = document.querySelectorAll('img');
images.forEach(image => {
  image.src = new URL(image.src, import.meta.url).toString();
});

const curveTool = new CurveTool('container');
