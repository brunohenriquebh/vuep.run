<template>
  <section class="app">
    <nav v-if="false" class="navbar">
      <span>Vuep.run</span>

      <ul class="list">
        <li>
          <a target="_blank" href="//github.com/qingwei-li/vuep.run">GitHub</a>
        </li>
      </ul>
      <button @click="upload" class="save">Save</button>
    </nav>

    <main class="main">
    <grid-layout
             :layout="layout"
            :col-num="12"
            :row-height="100"
            :is-draggable="true"
            :is-resizable="true"
            :is-mirrored="false"
            :vertical-compact="false"
            :margin="[10, 10]"
            :use-css-transforms="false"
    >
     <grid-item v-for="item in layout"
                   :x="item.x"
                   :y="item.y"
                   :w="item.w"
                   :h="item.h"
                   :i="item.i" 
                   :key="item.i"
                    >
                   <editor v-if="item['bindMethod'] != null"  class="panel" v-bind:data="item" @change="item['bindMethod']" :mode="item.mode"></editor>
                   <preview  v-if="item['bindMethod'] == null"  :value="preview" class="panel"></preview>
        </grid-item>


  
   

    </grid-layout>

      <div class="row">

          </div>
           <div class="row">

   
           </div>
    </main>
  </section>
</template>

<script>
import Editor from '@/components/editor';
import Preview from '@/components/preview';
import { parseComponent } from 'vue-template-compiler/browser';
import { parse as queryParse } from 'query-string';
import getImports from '@/utils/get-imports';
import getPkgs from '@/utils/get-pkgs';
import isAbsouteUrl from 'is-absolute-url';
import { upload } from '@/utils/store';
import * as params from '@/utils/params';
import VueGridLayout from 'vue-grid-layout';

const CDN_MAP = {
  unpkg: '//unpkg.com/',
  jsdelivr: '//cdn.jsdelivr.net/npm/'
};

export default {
  name: 'vuep',
  components: {
    Editor,
    Preview
  },
  mounted(){
      this.layout = [   
        {"x":0,"y":3,"w":5,"h":2,"i":"0", "bindMethod": this.changeHtml, "mode": "html"},
	    {"x":5,"y":3,"w":5,"h":2,"i":"1", "bindMethod": this.changeJs, "mode": "js"},
	    {"x":10,"y":3,"w":2,"h":2,"i":"2", "bindMethod": this.changeCss, "mode": "css"},
        {"x":0,"y":0,"w":12,"h":3,"i":"3", "bindMethod": null, "mode": "preview"},
      ]
  },

  data: () => ({
    preview: '',
    code: '',
    code_html : ' <div> Hello Word </div>',
    code_js: ' exports = { default: {} }',
    code_css: 'p {color: #ccc}',
    layout: [

     // {"x":4,"y":0,"w":2,"h":5,"i":"3", bindMethod: null}
    ]
  }),

  methods: {
      async changeHtml(code) {
        this.code_html = code;
        this.compile();

      },
      async changeCss(code) {
        this.code_css = code;
        this.compile();

      },
      async changeJs(code) {
        this.code_js = code;
        this.compile();

      },
    async compile() {
  
      this.code =  '<template>\n'+ this.code_html + '\n<\/template> \n <script>\n'+ this.code_js +'\n<\/script> \n<style>\n'+ this.code_css +'\n<\/style> ';
   
      if (!this.code ) {
        return;
      }
      const imports = [];
      const { template, script, styles, customBlocks } = parseComponent(this.code);
      let config;

      if ((config = customBlocks.find(n => n.type === 'config'))) {
        params.clear();
        params.parse(config.content);
      }

      let compiled;
      const pkgs = [];
      let scriptContent = 'exports = { default: {} }';

      if (script) {
        try {
          compiled = window.Babel.transform(script.content, {
            presets: ['es2015', 'es2016', 'es2017', 'stage-0'],
            plugins: [[getImports, { imports }]]
          }).code;
        } catch (e) {
          this.preview = `<pre style="color: red">${e.message}</pre>`;
          return;
        }
        scriptContent = await getPkgs(compiled, imports, pkgs);
      }

      const heads = this.genHeads();
      const scripts = [];

      pkgs.forEach(pkg => {
        scripts.push(
          `<script src=//packd.now.sh/${pkg.module}${pkg.path}?name=${
            pkg.name
          }><\/script>`
        );
      });

      styles.forEach(style => {
        heads.push(`<style>${style.content}</style>`);
      });

      scripts.push(`
      <script>
        var exports = {};
        ${scriptContent}
        var component = exports.default;
        component.template = component.template || ${JSON.stringify(
          template.content
        )}

        new Vue(component).$mount('#app')
      <\/script>`);

      this.preview = {
        head: heads.join('\n'),
        body: '<div id="app"></div>' + scripts.join('\n')
      };
    },

    genHeads() {
      let heads = [];

      params.queryParse(location.search);

      const { pkgs, css, cdn, vue } = params.get();
      const prefix = CDN_MAP[cdn] || CDN_MAP.unpkg;

      return [].concat(
        []
          .concat(vue ? 'vue@' + vue : 'vue', pkgs)
          .map(
            pkg =>
              `<script src=${isAbsouteUrl(pkg) ? '' : prefix}${pkg}><\/script>`
          ),
        css.map(
          item =>
            `<link rel=stylesheet href=${
              isAbsouteUrl(item) ? '' : prefix
            }${item}>`
        )
      );
    },

    async upload() {
      if (!this.code) {
        this.$toasted('No content', {
          type: 'error'
        });
        return;
      }

      const id = await upload(this.code);
      history.pushState({}, '', '/' + id);
      const url = location.href;

      this.$toasted.show(`Hosting in ${url}`, {
        action: {
          text: 'Copy',
          onClick() {
            copy(url);
            Vue.toasted.clear();
          }
        },
        duration: 5000
      });
    }
  }
};
</script>

<style src="modern-normalize"></style>
<style lang="stylus">

.main
  display flex

.vue-grid-layout
 width: 100%;

 .panel
   height: 100%;
 



</style>
