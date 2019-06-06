const SLS = require("sls.js")
SLS({
  onShareAppMessage() {
    return {
      title: "公共分享标题",
      path: `/index/index`
    }
  }
})

App({
  onLaunch: function() {}
})
