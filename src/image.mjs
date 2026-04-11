import { Canvas, Image } from '@environment-safe/canvas';
import { File, Path } from '@environment-safe/file';

export const channelXOR = (imageCanvas, textureCanvas, chn='', direction= 1)=>{
    const imageContext = imageCanvas.getContext('2d', { willReadFrequently: true });
    const textureContext = textureCanvas.getContext('2d', { willReadFrequently: true });
    const texturePixels = textureContext.getImageData(0,0, textureCanvas.width, textureCanvas.height);
    const newPixels  = imageContext.getImageData(0,0, imageCanvas.width, imageCanvas.height);
    const sx = imageCanvas.width; //getx
    const sy = imageCanvas.height; //gety
    const tx = textureCanvas.width; //getx
    const ty = textureCanvas.height; //gety
    let x = null;
    let y = null;
    let pxl = null;
    let tex_r, tex_g, tex_b, mask_offset, pixel_offset, value = null;
    let channel = '';
    switch(chn.toLowerCase()){
        case 'red':
        case 'r':
            channel = 'r';
            break;
        case 'green':
        case 'g':
            channel = 'g';
            break;
        case 'blue':
        case 'b':
            channel = 'b';
            break;
    }
    //kernel_size = filter.length; //coming soon
    const intervalWidth = 256;
    for(y = 0; y < sy; y++){
        for(x = 0; x < sx; x++){
            mask_offset = (((y%ty)*((sx%tx)*4)) + ((x%tx)*4));
            pixel_offset = ((y*(sx*4)) + (x*4));
            tex_r = texturePixels.data[mask_offset    ];
            tex_g = texturePixels.data[mask_offset + 1];
            tex_b = texturePixels.data[mask_offset + 2];
            if(!(tex_r === tex_g && tex_g === tex_b)){
                value = Math.floor((tex_r + tex_g + tex_b) / 3);
            }else{
                value = tex_r;
            }
            if(channel === 'r'){
                newPixels.data[pixel_offset  ] = (
                    newPixels.data[pixel_offset  ] + direction*value + intervalWidth
                )%intervalWidth;
            }
            if(channel === 'g'){
                newPixels.data[pixel_offset+1] = (
                    newPixels.data[pixel_offset+1] + direction*value + intervalWidth
                )%intervalWidth;
            }
            if(channel === 'b'){
                newPixels.data[pixel_offset + 2] = (
                    newPixels.data[pixel_offset+2] + direction*value + intervalWidth
                )%intervalWidth;
            }
        }
    }
    return newPixels;
};

const makeKey = (len, alpha)=>{
    const alphabet = alpha || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let key = '';
    for(let lcv=0; lcv < len; lcv++){
        key += alphabet[Math.floor(Math.random()*alphabet.length)];
    }
    return key;
}

export class NevermoreImage{
    constructor(options={}){
        if(!(
            options.masks || options.maskDir
        )) throw new Error('a set of masks are required');
        this.ready = new Promise(async (resolve, reject)=>{
            // load all masks
            // TODO: load from cache
            let masks = options.masks;
            const textureWork = [];
            const textureDictionary = {};
            if(options.maskDir){
                const types = ['jpg', 'jpeg', 'gif', 'png'];
                const files = (await File.list(options.maskDir)).filter((name)=>{
                    const parts = name.split('.');
                    const ext = parts.pop().toLowerCase();
                    return types.indexOf(ext) !== -1;
                    // TODO: support mime through magic numbers
                });
                const fileLoads = [];
                for(let lcv=0; lcv<files.length; lcv++){
                    const pth = new Path(files[lcv]);
                    if(!pth.parsed) throw new Error('path not parsed');
                    const parsed = pth.parsed.posix || pth.parsed.win32;
                    const canvasLoad = Canvas.load(
                        Path.join(options.maskDir, files[lcv])
                    );
                    textureWork.push(new Promise(async (resolve)=>{
                        resolve({
                            name: parsed.name,
                            canvas: await canvasLoad
                        });
                    }))
                    fileLoads.push(Canvas.load(Path.join(options.maskDir, files[lcv])));
                }
                masks = await Promise.all(fileLoads);
                const texturesLoaded = await Promise.all(textureWork);
                for(let lcv=0; lcv<texturesLoaded.length; lcv++){
                    textureDictionary[
                        texturesLoaded[lcv].name
                    ] = texturesLoaded[lcv].canvas;
                };
                this.textureDictionary = textureDictionary;
            }
            this.masks = masks;
            this.canvas = options.image;
            // masks loaded, now load the base image
            if(options.url){
                this.canvas = await Canvas.load(options.url);
            }
            if(!this.canvas){
                return reject(new Error(
                    'no base image provided to Image File'
                ));
            }
            //make an id
            this.key = options.key || `${makeKey(5)}-${makeKey(5)}-${makeKey(5)}`;
            console.log('KEY:', this.key);
            //we're ready to do work
            resolve();
        });
    }
    
    transform(options={}){
        const { channelKeys, direction, key } = options;
        let pixels = null;
        let channelKey = null;
        const canvas = this.canvas;
        for(let lcv=0; lcv < channelKeys.r.length; lcv++){
            const texture = this.textureDictionary[channelKeys.r[lcv]];
            const pixels = channelXOR(canvas, texture, 'red', direction);
            const context = canvas.getContext('2d');
            context.putImageData(pixels, 0, 0, 0, 0, canvas.width, canvas.height);
        }
        for(let lcv=0; lcv < channelKeys.r.length; lcv++){
            const texture = this.textureDictionary[channelKeys.r[lcv]];
            const pixels = channelXOR(canvas, texture, 'green', direction);
            const context = canvas.getContext('2d');
            context.putImageData(pixels, 0, 0, 0, 0, canvas.width, canvas.height);
        }
        for(let lcv=0; lcv < channelKeys.r.length; lcv++){
            const texture = this.textureDictionary[channelKeys.r[lcv]];
            const pixels = channelXOR(canvas, texture, 'blue', direction);
            const context = canvas.getContext('2d');
            context.putImageData(pixels, 0, 0, 0, 0, canvas.width, canvas.height);
        }
        // should this mutate? current answer: yes
        return canvas;
    }
    
    encode(options={}){
        const key = options.key || this.key;
        const parts = key.split('-')
        const channelKeys = {
            r: parts[0].split(''), 
            g: parts[1].split(''), 
            b: parts[2].split('')
        }
        return this.transform({ channelKeys, key, direction: 1 });
    }
    
    decode(options={}){
        const key = options.key || this.key;
        const parts = key.split('-');
        const channelKeys = {
            r: parts[0].split('').reverse(), 
            g: parts[1].split('').reverse(), 
            b: parts[2].split('').reverse()
        }
        return this.transform({ channelKeys, key, direction: -1 });
    }
}