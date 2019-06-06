// component, componentB.js
Component({
  // 要求至少在attached 之后才能使用$on, $emit
  attached() {
    this.$on("componentB.onCallComponentB", name => {
      console.log("componentB.onCallComponentB:", name) // Tom
    })
  },
  methods: {
    say88(name) {
      this.$emit("pageA.onSay88", "Jack")
    }
  }
})
