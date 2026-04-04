import { ParseEnglish } from 'parse-english'
import { inspect } from 'unist-util-inspect'
import { define } from 'self-dict';
import { thesaurus } from './thesaurus.mjs';
import { hash } from './hash.mjs';
import pixelWidth from 'string-pixel-width';


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
    //console.log(word);
    //process.exit();
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

const render = async (node, index, fnt, sz)=>{
    let html = '';
    let css = '';
    let className = null;
    let width = null;
    const font = fnt || 'Arial';
    const size = sz || 12;
    switch(node.type){
        case 'RootNode': 
            css += `span{
                font-family: ${font};
                font-size: ${size}px;
                display:inline-block;
                vertical-align: baseline;
            }\n`;
            break;
        case 'ParagraphNode':
            html += '<p>';
            break;
        case 'SentenceNode': break;
        case 'WordNode': break;
        case 'TextNode': 
            if(node.replacement){
                width = pixelWidth(node.word, { 
                    size: size,
                    font
                });
                className = 'R'+hash(node.word);
                css += `.${className}{
    visibility: hidden;
    position: relative;
    overflow:none;
    vertical-align: text-bottom;
    display:inline-block;
    font-size: ${size}px;
    height: ${size}px;
    width: ${width}px;
}
`;
css += `.${className}::after{
    visibility: visible;
    position: absolute;
    vertical-align: text-bottom;
    font-family: ${font};
    font-size: ${size}px;
    display:inline-block;
    margin-top: -${Math.round(size/4)}px;
    top: 0;
    left: 0;
    width: ${width}px;
    height: ${size}px;
    content : '${node.value}'
}
`;
                html += `<span class="guarded ${
                    className
                } ">${node.replacement}</span>`;
            }else{
                //console.log(node); process.exit();
                html += `<span>${node.value}</span>`;
            }
            break;
        case 'WhiteSpaceNode':
            break;
        case 'PunctuationNode': 
            break;
        default: {console.log(node); process.exit()}
    }
    if(node.children){
        let vals = null;
        for(let lcv=0; lcv< node.children.length; lcv++){
            vals = await render(node.children[lcv]);
            html += vals.html;
            css += vals.css;
        }
    }
    switch(node.type){
        case 'RootNode': break;
        case 'ParagraphNode': 
            html += '</p>';
            break;
        case 'SentenceNode': 
            break;
        case 'WordNode': break;
        case 'TextNode': break;
        case 'WhiteSpaceNode': 
            html += `${node.value}`;
            break;
        case 'PunctuationNode': 
            html += `<span>${node.value}</span>`;
        break;
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

export const generateHTMLAndCSS = async (node, index, fnt, sz)=>{
    await checkThesaurusInit();
    const { html, css } = await render(node, index, fnt, sz);
    return { html, css };
};