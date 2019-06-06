### SLS

通过重新封装部分微信小程序原生 api，渐进增强小程序组件通讯能力。

- 改写了 Page, Component, Behavior 组件。如果项目的是使用原生写的，那么只需要引入一个文件就能使用，旧代码不需要修改，原有功能不会被改变
- 给 page 增加支持 Behavior
- 给 page, Component 注入了$on, $emit, \$getCurrentPageComponentsByName 3 个方法

### 原因

- 项目启动的时候选择了原生开发的方式，但项目变大后，引入和修改公共组件的工作变得越来越繁重，page 使用高度抽象的组件需要给每一个事件绑定方法。
- 同级别的组件之间的互相调用都需要胶水代码
- 越来越多的一次性的提示功能直接参杂到业务逻辑，加大维护成本
- 项目已经有比较多的功能，不适合改用 wxpy, mpvue 等“整体迁移”方案
- 没有足够试水条件，否则就去试试 didi 的[mpx](https://github.com/didi/mpx)

### wechat share snippet/ 微信小程序代码片段分享链接

- 注意：从 1.02.1812180 开始代码片段格式更换，旧版本 IDE 将无法导入该版本及之后的 IDE 分享的代码片段
- [https://developers.weixin.qq.com/s/Vf1TfVmH7B8E](https://developers.weixin.qq.com/s/Vf1TfVmH7B8E)

### how to use

```javascript
// 在App({}) 前注入sls.js 文件
const SLS = require("sls.js")
// 执行 SLS({}), 可以此时配置全局page 公共默认方法。具体page 的方法会覆盖这里的配置
SLS({
  onShareAppMessage() {
    return {
      title: "公共分享标题",
      path: `/index/index`
    }
  }
})
App({})


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


// component, componentA.js
Component({
  // 要求至少在attached 之后才能使用$on, $emit
  attached() {
    this.$emit("hello", "baby")
  },
  methods: {
    // 默认给component 的全部methods 执行this.$on(`${componentName}.${methodName}`,this.methodName)
    sayHello(name) {
      console.log(`componentA.sayHello: ${name}`) // hello baby
    },
    callComponentB() {
      this.$emit("componentB.onCallComponentB", "Tom")
    }
  }
})
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

// pageA.wxml
<view>
 <componentA />
 <componentB />
</view>
```

### 原理

- 重新封装 Page，每一个 page 实例的对应生命周期方法里面注入新 api ($emit, $on 等)；读取 Behaviors 字段，将 Behavior 内容复制到 page 里面
- 重新封装 Component, 同理注入新 api ($emit, $on 等)
- 重新封装 Behavior，根据实际调用的情况选择原生 Behavior Component 调用，或者选择非原生的给 Page 调用

### 使用须知

- 暂时只能支持 Page 构建页面。（官方是允许使用 Component 构建页面的）
- Page 只能在 onReady 后使用\$emit 等新 api
- Component 只能在 attached 后使用\$emit 等新 api
- 如果 component.attached 执行$emit, 这时候page.onReady 里面的$on 是还没有执行的，本工具会等 page.onReady 后再尝试触发一次\$emit
