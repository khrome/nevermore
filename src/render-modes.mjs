import pixelWidth from 'string-pixel-width';
import { thesaurus } from './thesaurus.mjs';
import { hash } from './hash.mjs';

export const fixedMode = {
    RootNode : {
        style : ({font, size, node})=>{
            return `span{
                font-family: ${font};
                font-size: ${size}px;
                display:inline-block;
                vertical-align: baseline;
            }\n`;
        }
    },
    ParagraphNode : {
        pre : ({font, size, node})=>{
            return `<p>`;
        },
        post : ({font, size, node})=>{
            return `</p>`;
        }
    },
    TextNode: {
        style : ({font, size, node})=>{
            if(node.replacement){
                const width = pixelWidth(node.word, { 
                    size: size,
                    font
                });
                const className = 'R'+hash(node.word);
                return `.${className}{
    visibility: hidden;
    position: relative;
    overflow:none;
    vertical-align: text-bottom;
    display:inline-block;
    font-size: ${size}px;
    height: ${size}px;
    width: ${width}px;
}
.${className}::after{
    content : '${node.value}'
}
`;
            }else{
                return '';
            }
        },
        pre : ({font, size, node})=>{
            if(node.replacement){
                const className = 'R'+hash(node.word);
                return `<span class="guarded ${
                    className
                } ">${node.replacement}</span>`;
            }else{
                return `<span>${node.value}</span>`;
            }
        }
    }
}

export const inlineMode = {
    RootNode : {
        style : ({font, size, node})=>{
            return `.guarded{
    visibility: hidden; 
    font-size: 0; 
} 
.guarded::after{
    visibility: visible; 
    display: inline-block; 
    font-size: 1.0rem; 
}
\n`;
        }
    },
    ParagraphNode : {
        pre : ({font, size, node})=>{
            return `<p>`;
        },
        post : ({font, size, node})=>{
            return `</p>`;
        }
    },
    WhiteSpaceNode :{
        post : ({font, size, node})=>{
            return `${node.value}`;
        }
    },
    TextNode: {
        style : ({font, size, node})=>{
            if(node.replacement){
                const width = pixelWidth(node.word, { 
                    size: size,
                    font
                });
                const className = 'R'+hash(node.word);
                return `.${className}::after{ content : '${node.value}'; }`;
            }else{
                return '';
            }
        },
        pre : ({font, size, node})=>{
            if(node.replacement){
                const className = 'R'+hash(node.word);
                return `<span class="guarded ${
                    className
                } ">${node.replacement}</span>`;
            }else{
                return `<span>${node.value}</span>`;
            }
        }
    }
}

export const modes = {
    'fixed-mode' : fixedMode,
    'inline-mode' : inlineMode
}