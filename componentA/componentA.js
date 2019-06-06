// component, componentA.js
Component({
  // 要求至少在attached 之后才能使用$on, $emit
  attached() {
    this.$emit("componentA.sayHello", "Sam")
  },
  methods: {
    // 默认给component 的全部methods 执行this.$on(`${componentName}.${methodName}`,this.methodName)
    sayHello(name) {
      console.log(`componentA.sayHello: ${name}`) // hello baby
    },
    // private method
    _say88(name) {
      console.log(`componentA._say88: ${name}`) // hello baby
    },
    callComponentB() {
      this.$emit("componentB.onCallComponentB", "Tom")
    }
  }
})
