import { HTMLElement, customElements } from '@environment-safe/elements';
import { Canvas } from '@environment-safe/canvas';
import { NevermoreImage } from './image.mjs';

let textureFuture = null;

const loadImage = async (url)=>{
  return new Promise(r => { 
      let i = new Image(); 
      i.onload = (() => r(i)); 
      i.src = url; 
  });
};

const canvasFromDataUrl = async (url)=>{
    return new Promise((r)=>{
        const img = new Image();
        img.onload = function() {
            const canvas = new Canvas({ 
                height: img.height, 
                width: img.width 
            });
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            r(canvas);
        };
        img.src = url
    });
}

export class EncodedImage extends HTMLElement {
    constructor() {
        super();
        if(!textureFuture){
            const urlRoot = this.getAttribute('textures') || './textures';
            const type = this.getAttribute('type') || 'jpg';
            textureFuture = new Promise(async (resolve)=>{
                const list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                resolve(await Promise.all(list.map((id)=>{
                    return Canvas.load(`${urlRoot}/${id}.${type}`)
                })));
            });
        }
        this.attachShadow({mode: "open"});
        const url = this.getAttribute('src');
        const key = this.getAttribute('key');
        this.shadowRoot.innerHTML = `<canvas></canvas>`;
        (async ()=>{
            const canvas = this.shadowRoot.querySelector('canvas');
            const image = await loadImage(url);
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            const masks = await textureFuture;
            const dictionary = {};
            masks.forEach((mask, index)=>{
                dictionary[(index + 10).toString(36).toUpperCase()] = mask;
            });
            if(url.slice(0, 10) === 'data:image'){
                const canvas = await canvasFromDataUrl(url);
                this.image = new NevermoreImage({ canvas, masks, key, dictionary });
            }else{
                this.image = new NevermoreImage({ url, masks, key, dictionary });
            }
            await this.image.ready;
            this.image.decode();
            context.drawImage(this.image.canvas, 0, 0);
        })();
    }
  // Element functionality written in here
}

customElements.define("encoded-image", EncodedImage);