<template>
  <div class="tomd">
    <div class="tomd__input">
      <label >Paste in HTML. You can paste markup or formatted HTML
      <textarea v-model="html" @paste="handlePaste($event)"></textarea>
      </label>

      <button @click="convert()" >Convert</button>
    </div>

    <div class="tomd__output">
      <label >MarkDown
      <textarea v-model="md"></textarea>
      </label>
    </div>

  </div>
</template>

<script>
export default {
  data() {
    return {
      html: '',
      md: '',
    };
  },
  methods: {
    convert() {
      var c = new Converter(this.html);
      this.md = c.convert();
    },
    handlePaste(event) {
      event.preventDefault();
      let paste = (event.clipboardData || window.clipboardData);
      this.html = paste.getData('text/html');
      if (!this.html) {
        this.html = paste.getData('text/plain');
      }
      this.convert();
    }
  }
};

class Converter {
  constructor(source) {
    this.container = document.createElement('div');
    this.container.innerHTML = source;
    this.elementConverters = {
      '#text'  : { type: 'inline', converter: 'convertText' },
      'A'      : { type: 'inline', converter: 'convertLinkOrAnchor' },
      'STRONG' : { type: 'inline', converter: 'convertStrong' },
      'B'      : { type: 'inline', converter: 'convertStrong' },
      'EM'     : { type: 'inline', converter: 'converteEmphasis' },
      'I'      : { type: 'inline', converter: 'converteEmphasis' },
      'BR'     : { type: 'inline', converter: 'convertBr' },
      'CODE'   : { type: 'inline', converter: 'convertCode' },
      'P'      : { type: 'block', converter: 'convertPara' },
      'DIV'    : { type: 'block', converter: 'convertContent' },
      'PRE'    : { type: 'block', converter: 'convertPre' },
      'BLOCKQUOTE' : { type: 'block', converter: 'convertBlockQuote' },
      'UL'     : { type: 'block', converter: 'convertList' },
      'OL'     : { type: 'block', converter: 'convertList' },
      'LI'     : { type: 'block', converter: 'convertListItem' },
      'H1'     : { type: 'block', converter: 'convertHeading' },
      'H2'     : { type: 'block', converter: 'convertHeading' },
      'H3'     : { type: 'block', converter: 'convertHeading' },
      'H4'     : { type: 'block', converter: 'convertHeading' },
      'H5'     : { type: 'block', converter: 'convertHeading' },
      'H6'     : { type: 'block', converter: 'convertHeading' },
    }
    this.stack = [];
    this.lastEl = null;
  }
  convert() {
    return this.convertChildren(this.container).replace(/\s+$/, '\n');
  }
  convertChildren(div) {
    var childContent = '';

    [].forEach.call(div.childNodes, (el, index, parent) => {
      const t = el.nodeName;
      const converter = this.elementConverters[t] || {type: 'block', converter: 'convertContent'};
      this.stack.push({el, n: 0, type: converter.type});
      const result = this[converter.converter](el);
      childContent += result;
      this.lastEl = {el, type: converter.type, result};
      this.stack.pop();
    });

    return childContent;
  }
  convertText(el) {
    var t = el.textContent;

    var spaceAtStart = '', body = '';
    var m = t.match(/^(\s*)(.*)$/);
    if (m) {
      spaceAtStart = m[1];
      body = m[2];
    }
    else {
      body = t;
    }

    // Reduce whitespace inside body unless we're in a pre block.
    if (!this.parentStackNodeName().match(/^(PRE|CODE)$/)) {
      body = body.replace(/\s{2,}/g, ' ');
    }

    // If we're following another inline element that is not empty, allow one space at the start.
    if (this.lastEl && this.lastEl.type === 'inline' && this.lastEl.result) {
      spaceAtStart = spaceAtStart.replace(/^\s+/, ' ');
    }
    else {
      spaceAtStart = '';
    }
    return spaceAtStart + body;
  }
  convertCode(el) {
    const content = this.convertChildren(el);
    if (this.parentStackNodeName() === 'PRE') {
      // Don't double-encode it.
      return content;
    }
    return '`' + content + '`';
  }
  convertPara(el) {
    return this.convertChildren(el).replace(/\n+$/, '') + "\n\n";
  }
  convertPre(el) {
    return '\n```\n' + this.convertChildren(el).replace(/\n+$/, '') + '\n```\n\n';
  }
  convertBlockQuote(el) {
    var content = this.convertChildren(el).replace(/\n+$/, '');
    return content.replace(/^/mg, '> ');
  }
  convertLinkOrAnchor(el) {
    if (el.hasAttribute('href')) {
      // Link
      const href = el.getAttribute('href');
      const title = el.getAttribute('title');
      const content = this.convertChildren(el);
      return title ? `[${content}](${href} "${title}")` :  `[${content}](${href})`;
    }
    else {
      // Anchor.
      return this.convertChildren(el);
    }
  }
  convertContent(el) {
    console.log("Unhandled tag: ", el);
    return this.convertChildren(el) + "\n\n";
  }
  convertList(el) {
    return this.convertChildren(el);
  }
  convertListItem(el) {
    var list = this.stack[this.stack.length - 2];
    var content = this.convertChildren(el).replace(/\n+$/, '');
    var marker;

    if (!list || list.el.nodeName === 'UL') {
      marker = '*  ';
    }
    else {
      list.n++;
      marker = list.n + '. ';
      if (marker.length < 3) {
        marker += ' ';
      }
    }
    return marker + content.replace(/\n/g, '\n   ') + "\n\n";
  }
  convertHeading(el) {
    return '#'.repeat(el.nodeName[1]) + ' ' + this.convertChildren(el).replace(/\n+$/, '') + '\n\n';
  }
  convertBr(el) {
    return '  \n';
  }
  convertStrong(el) {
    return '**' + this.convertChildren(el) + '**';
  }
  converteEmphasis(el) {
    return '*' + this.convertChildren(el) + '*';
  }
  parentStackNodeName() {
    return (this.stack.length > 1) ? this.stack[this.stack.length - 2].el.nodeName : '';
  }
}

// Tests

</script>
