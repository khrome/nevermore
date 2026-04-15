import { ParseEnglish } from 'parse-english'
import { inspect } from 'unist-util-inspect'
import { define } from 'self-dict';
import pixelWidth from 'string-pixel-width';
import { thesaurus } from './thesaurus.mjs';
import { hash } from './hash.mjs';
import { modes } from './render-modes.mjs';

let wordlist = null;

let isInited = false;
const checkThesaurusInit = async ()=>{
    if(!isInited){
        await thesaurus.init();
        wordlist = await thesaurus.list();
        isInited = true;
    }
}

const randomWord = async ()=>{
    await checkThesaurusInit();
    let word = null;
    //todo: don't randomly repeat to clear
    while((!word) || word.split(' ').length > 1){
        word = wordlist[Math.floor(wordlist.length * Math.random())];
    }
    return word;
}

const traverse = async (node, handler)=>{
    await handler(node);
    if(node.children){
        const promises = [];
        for(let lcv=0; lcv< node.children.length; lcv++){
            promises.push(await traverse(node.children[lcv], handler));
        }
        //await Promise.all(promises);
    }
};

const render = async (node, index, modeName, fnt, sz)=>{
    const mode = modes[modeName];
    let html = '';
    let css = '';
    let className = null;
    let width = null;
    const font = fnt || 'Arial';
    const size = sz || 12;
    if(mode[node.type] && mode[node.type].pre){
        html += mode[node.type].pre({font, size, node});
    }
    if(mode[node.type] && mode[node.type].style){
        css += mode[node.type].style({font, size, node});
    }
    if(node.children){
        let vals = null;
        for(let lcv=0; lcv< node.children.length; lcv++){
            vals = await render(node.children[lcv], index, modeName, fnt, sz);
            html += vals.html;
            css += vals.css;
        }
    }
    if(mode[node.type] && mode[node.type].post){
        html += mode[node.type].post({font, size, node});
    }
    return {html, css};
};

export const computeIndexKeys = async (textBody)=>{
    await checkThesaurusInit();
    const parser = new ParseEnglish();
    const node = parser.parse(textBody);
    const index = {};
    await traverse(node, async (thisNode)=>{
        let res = null;
        if(thisNode.value){
            try{
                res = await define(thisNode.value);
            }catch(ex){}
        }
        if(thisNode.type === 'TextNode' && res){
            thisNode.word = res.word;
            thisNode.types = res.types;
            thisNode.definitions = res.definitions;
            thisNode.synonyms = res.synonyms;
            //const thesres = await thesaurus.lookup(thisNode.word);
            if(
                thisNode.types.indexOf('verb') !== -1 || 
                thisNode.types.indexOf('noun') !== -1 
            ){
                thisNode.replacement = await randomWord();
                index[thisNode.word] = thisNode.replacement;
                //index[thisNode.word] = thisNode.synonyms[0];
            }
        }
    });
    return { index, root: node };
};

export const generateHTMLAndCSS = async (node, index, options={})=>{
    await checkThesaurusInit();
    const { html, css } = await render(
        node, index, options.mode, options.font, options.size
    );
    return { html, css };
};