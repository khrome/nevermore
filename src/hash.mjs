import Module from "node:module";
const require = Module.createRequire(import.meta.url);
const hash = require('object-hash');
export { hash };