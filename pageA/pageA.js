// page, pageA
Page({
  // 要求至少在onReady 之后才能使用$on, $emit
  onReady() {
    this.$on("pageA.onSay88", msg => {
      console.log("pageA.onSay88:", msg) // baby
    })
  },
  clickSayHello1() {
    this.$emit("componentA.sayHello", "baby") // hello baby
  },
  clickSayHello2() {
    // 也可以用以下方式直接调用sayHello
    const componentAList = this.$getCurrentPageComponentsByName("componentA")
    componentAList[0] && componentAList[0].sayHello("sweet heart")
  }
})
