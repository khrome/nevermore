Nevermore
=========

Nevermore is a library to obfuscate plain text on the web to prevent AI scraping so while a user will see

![original text](./images/original.png)

A scraper coming to your site will see something like

![encoded text](./images/encoded.png)

Which will both prevent the scraper from acquiring your content as well as [poisoning the model trained](https://en.wikipedia.org/wiki/Adversarial_machine_learning#Data_poisoning) from it.

Programmatic Usage
------------------
This library can be used to generate the html and css:

```js
import { computeIndexKeys, generateHTMLAndCSS } from 'ai-nevermore';

const { root, index } = await computeIndexKeys(inputText);
const { html, css } = await generateHTMLAndCSS(root, index);
```

Command Line Usage
------------------
Install with `npm install -g ai-nevermore`
```
nevermore [command]

Commands:
  nevermore pseudotext [input-file]   transform text to poison
  nevermore pseudoimage [input-file]  transform XOR image encoding

Options:
      --version            Show version number                         [boolean]
  -K, --key                key to use for decoding the image            [string]
  -U, --unified-output     File to generate html + css into             [string]
  -C, --css-output         File to generate css into                    [string]
  -I, --image-output       File to output image to                      [string]
  -H, --html-output        File to generate html into                   [string]
  -r, --raw-output         Do not wrap the ouput                       [boolean]
  -E, --encode             inline encoding                             [boolean]
  -D, --decode             inline decoding                             [boolean]
  -m, --render-mode        output mode
        [string] [choices: "fixed-mode", "inline-mode"] [default: "inline-mode"]
  -s, --size               The size of the font in pixels (required for
                           fixed-width)                   [number] [default: 12]
  -d, --custom-dictionary  A json map of replacement words              [string]
  -f, --font               The font in question (required for fixed-width; only
                           webfonts are supported)
      [string] [choices: "Andale Mono", "Arial", "Avenir", "Avenir Next", "Comic
  Sans MS", "Courier New", "Georgia", "Helvetica", "Impact", "Inter", "Times New
           Roman", "Trebuchet MS", "Verdana", "Webdings", "Open Sans", "Tahoma"]
                                                              [default: "Arial"]
      --help               Show help                                   [boolean]

```

Roadmap
-------

- [x] raw output mode
- [x] stdin, stdout support
- [x] custom dictionary
- [x] image encoding
- [ ] web component decoder
- [ ] self randomizing dictionary
- [ ] add a replacement mode (opposed to a tokenizer based solution)

Development
-----------
This release is currently unlicensed and should be treated as proprietary, but open meaning I am not currently accepting collaboration while I move toward 1.0 nor is this version of the code available for redistribution. I am currently evaluating source licenses for a future release during beta.

I am also looking for a robot license, should such a thing exist or some generous legal professional want to help in the creation of one.

Enjoy,
- Abbey Hawk Sparrow