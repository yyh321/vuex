import Vue from "vue"
// import Vuex from "vuex"
import Vuex from "../vuex/index.js"

Vue.use(Vuex)

// logger 插件
function logger(store) {
  // console.log('store = ',store.state);
  let preState = JSON.stringify(store.state)
  store.subscribe((mutation, newState) => {
    console.log(preState)
    console.log(mutation)
    console.log(JSON.stringify(newState))
    preState = JSON.stringify(newState)
  })
}

// 持久化插件
function persist(store) {
  let local = localStorage.getItem("myData")
  if (local) {
    store.replaceState(JSON.parse(local))
  }
  store.subscribe((mutation, newState) => {
    localStorage.setItem("myData", JSON.stringify(newState))
  })
}

let store = new Vuex.Store({
  strict: true,
  plugins: [
    // persist
  ],
  state: {
    name: "yyh123",
    num: 22,
    title: "learning vuex!!!!!"
  },
  getters: {
    title(state) {
      return "yyh123 " + state.title
    }
  },
  mutations: {
    addNum(state, payload) {
      state.num += payload
      console.log("根模块 addNum")
    },

    minusNum(state, payload) {
      state.num -= payload
    },

    changeName(state, payload) {
      state.name = payload
    }
  },
  actions: {
    changeName({ commit }, payload) {
      commit("changeName", payload)
    }
  },
  modules: {
    a: {
      namespaced: true,
      state: {
        age: "a100"
      },
      mutations: {
        addNum(state, payload) {
          console.log("a模块 addNum")
        }
      }
    },
    b: {
      namespaced: true,
      state: {
        age: "b100"
      },
      mutations: {
        addNum(state, payload) {
          console.log("b模块 addNum")
        }
      },
      modules: {
        c: {
          namespaced: true,
          state: {
            age: "c100"
          },
          mutations: {
            addNum(state, payload) {
              console.log("c模块 addNum")
            }
          },
          modules: {
            d: {
              state: {
                age: "d100"
              },
              modules: {
                e: {
                  state: {
                    age: "e100"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
})
// store.registerModule("m", {
//   state: {
//     age: "m100"
//   }
// })
export default store
