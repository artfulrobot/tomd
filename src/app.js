import Vue from 'vue';
import Main from './Main.vue';

new Vue({
  el: '#app',
  components: {Main},
  render: h => h(Main, {props: {}})
  //render: h => h(Main, {props: {config: c}})
});
