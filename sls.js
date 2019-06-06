/**
 * SLS
 * @description  给小程序page 增加Behavior 功能, 初始化增加全局配置方法，例如可以全局配置onShareAppMessage。在小程序原生开发，sdk2.4 环境下测试通过
 * @description  给page 使用的Behavior，会触发对应的onLoad 和onUnLoad 方法
 * @description  给page component 增加 $on $emit $getCurrentPageComponentsByName，方便跨组件调用
 * FIXME: 使用component 构建页面将会出错
 * @author: pasico@163.com
 * @date 2019-06-2
 */

const _originPage = Page
const _originComponent = Component
const _originBehavior = Behavior
const _SLGlobal = {}
const _defaultBehavior = { methods: {} }
const PAGEEVENTS = [
  "onLoad",
  "onUnload",
  "onShow",
  "onReady",
  "onHide",
  "onShareAppMessage"
]

const PagesEventList = [[]]
let tempPageEventList = []
const PagesComponentList = [[]]
let tempCurrentPageComponentList = []
let delayEmitEventList = []

/**
 * $getCurrentPageComponentsByName
 * call it after page.onReady
 * @returns {array} components
 * @date 2019-06-03
 */
function $getCurrentPageComponentsByName(a_componentName) {
  const pages = getCurrentPages()
  // console.log("PagesComponentList=", PagesComponentList)
  return PagesComponentList[pages.length - 1].filter(com => {
    const componentName = com.name || com.is.split("/").pop()
    return componentName === a_componentName
  })
}

/**
 * copyTempCurrentPageComponentListToPagesComponentList
 * @description 复制当前页构建的组件到历史page list当中，方便查询当前页有那些组件
 * @date 2019-06-03
 */
function copyTempCurrentPageComponentListToPagesComponentList() {
  // console.log("copyTempCurrentPageComponentListToPagesComponentList")
  // console.log("tempCurrentPageComponentList=", tempCurrentPageComponentList)
  const pages = getCurrentPages()
  PagesComponentList[pages.length - 1] = tempCurrentPageComponentList.concat()
  tempCurrentPageComponentList = []
}
/**
 * copytempPageEventListToPagesEventList
 * @description 复制当前页注册的事件到历史page 事件list当中，方便查询当前页有那些事件
 * @date 2019-06-03
 */
function copytempPageEventListToPagesEventList() {
  // console.log("copytempPageEventListToPagesEventList")
  // console.log("PagesEventList=", PagesEventList)
  const pages = getCurrentPages()
  PagesEventList[pages.length - 1] = tempPageEventList.concat()
  tempPageEventList = []
}

/**
 * distoryCurrentPageEventlist
 * @description 移除当前页事件
 * @date 2019-06-04
 * @param {*} params
 */
function distoryCurrentPageEventlist(params) {
  const pages = getCurrentPages()
  PagesEventList[pages.length - 1] = []
}

/**
 * delayEmitEventList
 * 触发之前emit 失败的事件，例如component.attached $emit 在page.onReady $on 之前执行了
 * @date 2019-06-04
 * @param {*} params
 */
function callDelayEmitEventList() {
  // console.log("callDelayEmitEventList")
  const pages = getCurrentPages()
  const eventList = PagesEventList[pages.length - 1]
  delayEmitEventList.forEach(({ emitEventName, eventParams }) => {
    eventList
      .filter(({ eventName }) => emitEventName === eventName)
      .forEach(({ eventName, eventCallback, com }) => {
        console.warn(`emit event:${eventName} again now`)
        eventCallback && eventCallback.call(com, ...eventParams)
      })
  })
  delayEmitEventList = []
}

/**
 * $emit
 * 触发事件
 * TODO: 搜索全部pages
 * @date 2019-06-03
 * @param {*} eventName
 * @param {*} eventParams
 */
function $emit(emitEventName, ...eventParams) {
  // console.log("sls $emit=", emitEventName, eventParams)
  const pages = getCurrentPages()
  const eventList = PagesEventList[pages.length - 1]
  const emitList = eventList.filter(
    ({ eventName }) => emitEventName === eventName
  )
  // 如果component.attached 执行$emit, 这时候page.onReady 里面的$on 是还没有执行的，需要等page.onReady 后再尝试触发一次$emit
  if (emitList.length === 0) {
    console.warn(
      `can\'t find event:${emitEventName}, call it again after page.onReady`
    )
    delayEmitEventList.push({ emitEventName, eventParams })
  } else {
    emitList.forEach(({ com, eventCallback }) => {
      eventCallback && eventCallback.call(com, ...eventParams)
    })
  }
}

/**
 * $on
 * 注册事件
 * TODO: 增加eventOptions 个性化搜索配置
 * TODO: 优化数据结构方便搜索
 * @date 2019-06-03
 * @param {*} eventName
 * @param {*} eventCallback
 */
function $on(eventName, eventCallback, eventOptions) {
  // console.log("sls $on=", eventName)
  const eventObj = { com: this, eventCallback, eventName }

  const pages = getCurrentPages()
  const list = PagesEventList[pages.length - 1] || []
  list.push(eventObj)
  PagesEventList[pages.length - 1] = list
}

/**
 * $un
 * TODO: 移除$on 事件
 * @date 2019-06-03
 * @param {*} params
 */
function $un(params) {}
function SLBehavior(params) {
  // TODO: 方便未来官方拓展page 支持Behavior
  // return _originBehavior(params)
  return params
}

/**
 * recursionBehaviors
 * @description 递归复制behaviors 到page
 * @date 2019-05-30
 * @param {object} resultParams
 * @param {array} a_behaviors
 */
function recursionBehaviors(resultParams, a_behaviors = []) {
  a_behaviors &&
    a_behaviors.forEach((behavior = _defaultBehavior) => {
      const { behaviors = [], properties, data, methods } = behavior

      if (properties) {
        resultParams.properties = Object.assign(
          {},
          properties,
          resultParams.properties
        )
      }
      if (data) {
        resultParams.data = Object.assign({}, data, resultParams.data)
      }

      PAGEEVENTS.forEach(pe => {
        if (behavior[pe]) {
          resultParams[`${pe}List`].push(behavior[pe])
        }
      })
      if (methods) {
        Object.keys(methods).forEach(method => {
          resultParams.methods[method] = methods[method]
        })
      }
      recursionBehaviors(resultParams, behaviors)
    })
}
function recursionBehaviorsForSLComponent(params) {
  if (params.behaviors && params.behaviors.length > 0) {
    params.behaviors = params.behaviors.map(behavior => {
      recursionBehaviorsForSLComponent(behavior)
      return _originBehavior(behavior)
    })
  }
}
/**
 * SLComponent
 *
 * @date 2019-05-30
 * @param {*} params
 */
function SLComponent(params) {
  // console.log("SLComponent,params=", params)
  const { created, attached, methods = {} } = params
  params.created = function() {
    tempCurrentPageComponentList.push(this)
    this.$emit = $emit
    this.$on = $on
    this.$getCurrentPageComponentsByName = $getCurrentPageComponentsByName
    // console.log("SLComponent created,this=", this)
    created && created.call(this)
  }
  // 将组件方法自动注册成事件
  params.attached = function() {
    const componentName = this.name || this.is.split("/").pop()
    Object.keys(methods).forEach(m => {
      const eventName = `${componentName}.${m}`
      // console.log("eventName=", eventName)
      $on.call(this, eventName, methods[m])
    })
    // console.log("SLComponent attached,params=", params)
    attached && attached.call(this)
  }
  recursionBehaviorsForSLComponent(params)

  _originComponent(params)
}

/**
 * SLPage
 *
 * @date 2019-05-30
 * @param {*} params
 */
function SLPage(params) {
  // console.log("SLPage init params=", params)
  // const { behaviors = [] } = params
  const { behaviors = [] } = params
  delete params.behaviors
  const resultParams = {
    methods: {},
    $getCurrentPageComponentsByName,
    $emit,
    $on,
    ..._SLGlobal,
    ...params
  }
  PAGEEVENTS.forEach(pe => {
    resultParams[`${pe}List`] = []
  })
  recursionBehaviors(resultParams, behaviors)
  const { methods = {} } = resultParams

  Object.keys(methods).forEach(methodKey => {
    if (!resultParams[methodKey]) {
      resultParams[methodKey] = methods[methodKey]
    }
  })
  PAGEEVENTS.forEach(pe => {
    const list = resultParams[`${pe}List`]
    const peFun = resultParams[pe]

    // 如果本来没有设置分享，这里不补充
    if (pe === "onShareAppMessage" && !peFun) return
    resultParams[pe] = function(params) {
      let re = undefined
      list.forEach(cb => {
        cb.call(this, params)
      })
      if (pe === "onLoad") {
        const pages = getCurrentPages()
        // console.log("sls SLPage,onLoad,pages=", pages)
      } else if (pe === "onReady") {
        // copytempPageEventListToPagesEventList()
        // 确保子组件已经全部构建好后
        copyTempCurrentPageComponentListToPagesComponentList()
      } else if (pe === "onUnload") {
        const pages = getCurrentPages()
        // console.log("sls SLPage,onUnload,pages=", pages)
        distoryCurrentPageEventlist()
      }
      if (peFun) {
        re = peFun.call(this, params) // 例如返回onShareAppMessage 的结果给到系统
      }
      if (pe === "onReady") {
        callDelayEmitEventList()
      }
      return re
    }
  })

  PAGEEVENTS.forEach(pe => {
    delete resultParams[`${pe}List`]
  })
  _originPage(resultParams)
}
/**
 * SLS
 *
 * @date 2019-05-30
 * @param {*} params
 */
function SLS(params = {}) {
  Object.assign(_SLGlobal, params)
  Page = SLPage
  Component = SLComponent
  Behavior = SLBehavior
}
module.exports = SLS
