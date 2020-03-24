let forEachValue = (obj, fn) => {
  Object.keys(obj).forEach(key => {
    fn(key, obj[key])
  })
}

let Vue

class ModuleCollections {
  constructor(options) {
    this.register([], options)
  }

  register(path, rootModule) {
    let rawModule = {
      _raw: rootModule,
      _children: {},
      state: rootModule.state
    }
    rootModule.rawModule = rawModule
    if (!this.root) {
      this.root = rawModule
    } else {
      let parentModule = path.slice(0, -1).reduce((root, current) => {
        return root._children[current]
      }, this.root)
      parentModule._children[path[path.length - 1]] = rawModule
    }

    if (rootModule.modules) {
      forEachValue(rootModule.modules, (moduleName, module) => {
        this.register(path.concat(moduleName), module)
      })
    }
  }
}

function getState(store, path) {
  let local = path.reduce((newState, current) => {
    return newState[current]
  }, store.state)
  return local
}

function installModule(store, rootState, path, rawModule) {
  let root = store.modules.root
  let namespace = path.reduce((str, current) => {
    root = root._children[current]
    str = str + (root._raw.namespaced ? current + "/" : "")
    return str
  }, "")

  if (path.length > 0) {
    let parentState = path.slice(0, -1).reduce((root, current) => {
      return root[current]
    }, rootState)
    Vue.set(parentState, path[path.length - 1], rawModule.state)
  }
  let getters = rawModule._raw.getters
  if (getters) {
    forEachValue(getters, (getterName, value) => {
      Object.defineProperty(store.getters, namespace + getterName, {
        get: () => {
          return value(getState(store, path))
        }
      })
    })
  }

  let mutations = rawModule._raw.mutations
  if (mutations) {
    forEachValue(mutations, (mutationName, value) => {
      let arr =
        store.mutations[namespace + mutationName] ||
        (store.mutations[namespace + mutationName] = [])
      arr.push(payload => {
        value(getState(store, path), payload)
        store.subs.forEach(fn =>
          fn({ type: namespace + mutationName, payload: payload }, store.state)
        )
      })
    })
  }

  let actions = rawModule._raw.actions
  if (actions) {
    forEachValue(actions, (actionsName, value) => {
      let arr =
        store.actions[namespace + actionsName] ||
        (store.actions[namespace + actionsName] = [])
      arr.push(payload => {
        value(store, payload)
      })
    })
  }

  forEachValue(rawModule._children, (moduleName, module) => {
    installModule(store, rootState, path.concat(moduleName), module)
  })
}

class Store {
  constructor(options) {
    this.strict = options.strict || false
    this._committing = false
    this.vm = new Vue({
      data: {
        state: options.state
      }
    })

    this.getters = {}
    this.mutations = {}
    this.actions = {}
    this.subs = []

    this.modules = new ModuleCollections(options)
    installModule(this, this.state, [], this.modules.root)
    // console.log(this)
    // 执行插件
    let plugins = options.plugins
    plugins.forEach(plugin => {
      plugin(this)
    })

    if (this.strict) {
      this.vm.$watch(
        () => {
          return this.vm.state
        },
        function() {
          console.assert(this._committing, "不能异步调用")
        },
        { deep: true, sync: true }
      )
    }
  }

  get state() {
    return this.vm.state
  }

  subscribe = fn => {
    this.subs.push(fn)
  }

  _withCommit(fn) {
    const committing = this._committing
    this._committing = true
    fn()
    this._committing = committing
  }

  replaceState = newState => {
    this._withCommit(() => {
      this.vm.state = newState //更新状态
    })
  }

  commit = (name, payload) => {
    this._withCommit(() => {
      this.mutations[name].forEach(fn => {
        fn(payload)
      })
    })
  }

  dispatch = (name, payload) => {
    this.actions[name].forEach(fn => {
      fn(payload)
    })
  }

  registerModule(moduleName, module) {
    if (!Array.isArray(moduleName)) {
      moduleName = [moduleName]
    }
    this._withCommit(() => {
      this.modules.register(moduleName, module)
      installModule(this, this.state, moduleName, module.rawModule)
    })
  }
}

let install = _Vue => {
  if (_Vue) {
    Vue = _Vue
  }
  Vue.mixin({
    beforeCreate() {
      if (this.$options.store) {
        this.$store = this.$options.store
      } else {
        this.$store = this.$parent && this.$parent.$store
      }
    }
  })
}

export const mapState = names => {
  let obj = {}
  names.forEach(name => {
    obj[name] = function() {
      return this.$store.state[name]
    }
  })
  return obj
}

export const mapGetters = names => {
  let obj = {}
  names.forEach(name => {
    obj[name] = function() {
      return this.$store.getters[name]
    }
  })
  return obj
}

export const mapMutations = obj => {
  let res = {}
  if (Array.isArray(obj)) {
    obj.forEach(name => {
      res[name] = function(...args) {
        return this.$store.commit(name, ...args)
      }
    })
  } else {
    Object.entries(obj).forEach(([key, value]) => {
      res[key] = function(...args) {
        return this.$store.commit(value, ...args)
      }
    })
  }
  return res
}

export const mapActions = obj => {
  let res = {}
  if (Array.isArray(obj)) {
    obj.forEach(name => {
      res[name] = function(...args) {
        return this.$store.dispatch(name, ...args)
      }
    })
  } else {
    Object.entries(obj).forEach(([key, value]) => {
      res[key] = function(...args) {
        return this.$store.dispatch(value, ...args)
      }
    })
  }
  return res
}

export default {
  Store,
  install
}
