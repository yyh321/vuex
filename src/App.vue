<template>
  <div id="app">
    <h1>hello,Vuex</h1>
    <p>name: {{ name }}</p>
    <p>num: {{ $store.state.num }}</p>
    <p>title: {{ title }}</p>
    <p>c.age: {{ $store.state.b.c.age }}</p>
    <p>d.age: {{ $store.state.b.c.d.age }}</p>
    <p>e.age: {{ $store.state.b.c.d.e.age }}</p>
    <!-- <p>m.n.age: {{ $store.state.m.age }}</p> -->
    <button @click="addNum(5)">加5</button>
    <button @click="minusNum(5)">减5</button>
    <button @click="changeName('王雪')">changeName</button>
    <p>
      <!-- {{ $store.state.a.age }} {{ $store.state.b.age }}
      {{ $store.state.b.c.age }} -->
    </p>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from "./vuex"
// import {mapMutations} from 'vuex'

export default {
  name: "App",
  components: {},
  computed: {
    ...mapState(["name"]),
    ...mapGetters(["title"])
  },
  methods: {
    ...mapMutations(["addNum", "minusNum"]),
    ...mapActions(["changeName"])
  }
}
</script>

<style></style>
