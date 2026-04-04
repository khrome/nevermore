import Module from "node:module";
const require = Module.createRequire(import.meta.url);
const wordnet = require('wordnet');
export const thesaurus = wordnet;