import { computeIndexKeys, generateHTMLAndCSS } from '../src/index.mjs';
import { NevermoreImage } from '../src/image.mjs';

export const transformHTML = async (node, idx)=>{
    let content = '';
    if(node.childNodes) for(let lcv=0; lcv < node.childNodes.length; lcv++){
        content += await transformHTML(node.childNodes[lcv]);
    }
    
    try{
        let externalCSS = '';
        switch(node.nodeName){
            case '#text':
                if(node.parentNode.nodeName === 'script') return node.value;
                if(node.value.trim() === '') return node.value;
                const { index, root } = await computeIndexKeys(node.value.trim());
                const { html, css } = await generateHTMLAndCSS( root, (idx || index), {
                    mode: 'inline-mode'
                } );
                externalCSS += css;
                return `<style>${css}</style>${html}`;
                //return '[ENCODED TEXT]';
                break;
            case 'img':
                const srcAttr = node.attrs.find((attr)=> attr.name.toLowerCase() === 'src');
                const image = new NevermoreImage({ url: srcAttr.value, maskDir:'./textures'});
                await image.ready;
                const canvas = image.encode();
                const url = canvas.toDataURL('jpg');
                //return `<img src="${url}" ></img>`;
                return `<encoded-image src="${url}" key="${image.key}"></encoded-image>`;
            case 'head':  
                const att = node.attrs?' '+node.attrs.map((attr)=>`${attr.name}="${attr.value}"`).join(' '):'';
                return `<${node.tagName}${att}>${content}<script type="importmap">
                    {"imports":{
                        "node:os":"/src/encoded-image-component.mjs",
                        "node:stream":"/src/encoded-image-component.mjs",
                        "fs":"/src/encoded-image-component.mjs",
                        "os":"/src/encoded-image-component.mjs",
                        "module":"/src/encoded-image-component.mjs",
                        "nevermore/encoded-image-component":"./src/encoded-image-component.mjs",
                        "@environment-safe/canvas":"./node_modules/@environment-safe/canvas/src/index.mjs",
                        "@environment-safe/file":"./node_modules/@environment-safe/file/src/index.mjs",
                        "@environment-safe/elements":"./node_modules/@environment-safe/elements/src/index.mjs",
                        "@environment-safe/runtime-context":"./node_modules/@environment-safe/runtime-context/src/index.mjs"
                    }}
                </script>
                <script type="module">
                    import 'nevermore/encoded-image-component';
                </script></${node.tagName}>`
            default: 
                const attrs = node.attrs?' '+node.attrs.map((attr)=>`${attr.name}="${attr.value}"`).join(' '):'';
                if(node.tagName) return `<${node.tagName}${attrs}>${content}</${node.tagName}>`
                return `${content}`;
                break;
        }
    }catch(ex){
        console.log(ex);
    }
};