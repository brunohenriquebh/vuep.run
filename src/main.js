import Vuep from '@/app';
import Vue from 'vue';
import 'unfetch/polyfill';
import toasted from 'vue-toasted';



Vue.use(toasted);

/*

Vue.component('vuep', App);
console.log("Registrando component ");
console.log(App);
 
new Vue({
  el: '#app',
  //render: h => h(App)
});
*/




Vuep.config = function (opts) {
  Vuep.props.options.default = () => opts
}

function install (Vue, opts) {
  Vuep.config(opts)
  Vue.component(Vuep.name, Vuep)
}

Vuep.install = install

if (typeof Vue !== 'undefined') {
  Vue.use(install) // eslint-disable-line
}

export default Vuep

