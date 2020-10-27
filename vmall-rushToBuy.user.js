// ==UserScript==
// @name         华为商城抢购助手
// @namespace    https://github.com/gorkys/TampermonkeyHub
// @version      1.2.0
// @description  同步华为商城服务器时间，毫秒级华为商城抢购助手
// @author       Samuel
// @license      MIT

// @match        https://www.vmall.com/product/*.html
// @match        https://*.cloud.huawei.com/*
// @match        https://www.vmall.com/product/*.html?*
// @match        https://www.vmall.com/order/confirmDepositNew11
// @match        https://sale.vmall.com/rush/*
// @supportURL   https://github.com/gorkys/TampermonkeyHub/issues
// @updateURL    https://github.com/gorkys/TampermonkeyHub/vmall-rushToBuy.user.js
// @downloadURL  https://github.com/gorkys/TampermonkeyHub/raw/master/vmall-rushToBuy.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let STARTTIME = 0 // 活动开始时间
    let OFFSETTIME = 0 // 与本地时间相差
    let NETWORKTIME = 0 // 网络延迟
    const INTERVAL = 3 // 定时器时长ms

    window.onload = () => {
        // 抢购前，务必登录vmall.com，并且设置好默认邮寄地址
        // 提交订单
        if (window.location.href.indexOf('/order') !== -1) {
            ec.order.confirmSubmit()
        }

        // 商城申购
        if (window.location.href.indexOf('/product') !== -1) {
            if (rush.account.isLogin()) {
                const skuIds = rush.sbom.getCurrSkuId()
                const getTime = new Date().getTime()
                getSkuRushbuyInfo(skuIds, getTime)
            } else {
                rush.business.doGoLogin() //页面登录
            }
        }
    }

    let cycle = 0

    const initBox = () => {
            // 构建抢购助手页面
            const style = `#rushToBuyBox{z-index: 9999;background-color:rgba(255,255,255,0.7);width:260px;font-size:14px;position:fixed;top:20%;right:0px;padding:0px;border-radius:5px;box-shadow:1px 1px 9px 0 #888;transition:right 1s;text-align:center}#rushToBuyBox:hover{right:10px}.title{font-size:16px;font-weight:bold;margin:10px 0}.title span{font-size:12px;color:#9c9c9c}#formList{margin:10px}.time span{color:red}#formList input{background:0;height:20px;font-size:14px;outline:0;border:1px solid #ccc;margin-bottom:10px}#formList input:focus{border:1px solid #4ebd0d}#formList div span{font-size:12px;color:red}#formList div{margin-bottom:10px}.countdown{margin-top:10px}`
            const html = `
                    <div id='rushToBuyBox'>
                        <h3 class="title">
                            Mate40Pro+ 必中 <span>by: Samuel</span>
                        </h3>
                        <div class='time'>
                            <p>ServerTime-LocalTIme: <span id='offsetTime'>-1400ms</span></p>
                            <p>1/2网络延迟: <span id='timer'>200ms</span></p>
                        </div>
                        <form id='formList'>
                            <div>活动开始时间</div>
                            <input type="text" id="g_startTime"  value="" placeholder="2020-03-07 12:49:00" />
                            <div>提前下单时间，和RTT成正比<span>(ms)</span></div>
                            <input type="number" id="g_beforeStartTime" value="" placeholder="200" /></br>
                            <div style="display:none">提前刷新页面<span>(s)</span></div>
                            <input style="display:none" type="checkBox" id='isRefresh'> </input>
                            <input style="display:none" style="margin-left:10px;width: 100px;" disabled id='refreshTime' type="number" /> </br>
                            <button id='rushToBuy'>开始运行</button><button style='margin-left:5px' id='stop'>停止</button>
                        </form>
                        <div class='countdown'>倒计时: <span id='g_countdown'>1天 2:3:4</span></div>
                    </div>
                    `
            var stylenode = document.createElement('style');
            stylenode.setAttribute("type", "text/css");
            if (stylenode.styleSheet) { // IE
                stylenode.styleSheet.cssText = style;
            } else { // w3c
                var cssText = document.createTextNode(style);
                stylenode.appendChild(cssText);
            }
            var node = document.createElement('div');
            node.innerHTML = html;
            document.head.appendChild(stylenode);
            document.body.appendChild(node);

            const g_startTime = document.querySelector('#g_startTime')
            const g_beforeStartTime = document.querySelector('#g_beforeStartTime')
            const isRefresh = document.querySelector('#isRefresh')
            const refreshTime = document.querySelector('#refreshTime')

            // 设置活动开始时间
            g_startTime.value = formatTime(STARTTIME) || rush.activity.getActivity(rush.sbom.getCurrSkuId()).startTime
            g_beforeStartTime.value = 20
            refreshTime.value = 30

            // 延时
            document.querySelector('#offsetTime').innerText = OFFSETTIME || rush.business.offsetTime + 'ms'
            document.querySelector('#timer').innerText = NETWORKTIME || rush.business.timer + 'ms'
            //document.querySelector('#offsetTime').innerText = rush.business.offsetTime + 'ms'
            //document.querySelector('#timer').innerText = rush.business.timer + 'ms'


            // 倒计时
            const countdownId = setInterval(() => {
                document.querySelector('#g_countdown').innerText = getDistanceSpecifiedTime(g_startTime.value, new Date().getTime() + OFFSETTIME)
            }, 100)

            const countdown = document.querySelector('#rushToBuy')
            const stop = document.querySelector('#stop')

            isRefresh.addEventListener('change', () => {
                sessionStorage.setItem('isRefresh', isRefresh.checked)
                refreshTime.disabled = !isRefresh.checked
            })

            countdown.addEventListener('click', () => {
                countdown.disabled = true
                countdown.innerText = '抢购中...'
                sessionStorage.setItem('g_startTime', g_startTime.value)
                sessionStorage.setItem('g_beforeStartTime', g_beforeStartTime.value)
                sessionStorage.setItem('isRun', true)

                getServerTime(g_startTime.value, parseInt(g_beforeStartTime.value))
            })
            stop.addEventListener('click', () => {
                countdown.disabled = false
                countdown.innerText = '开始运行'
                sessionStorage.setItem('isRun', false)
                clearInterval(cycle)
            })

            if (sessionStorage.getItem('isRun') === 'true') {
                g_startTime.value = sessionStorage.getItem('g_startTime')
                g_beforeStartTime.value = sessionStorage.getItem('g_beforeStartTime')
                countdown.click()
            }
        }
        // 获取服务器时间
    const getServerTime = (g_startTime, g_beforeStartTime) => {
        const details = {
            method: 'GET',
            url: `https://buy.vmall.com/getSkuRushbuyInfo.json`,
            onload: (responseDetails) => {
                if (responseDetails.status === 200) {
                    const res = JSON.parse(responseDetails.responseText)
                    const startTime = new Date(g_startTime).getTime()
                    const isRefresh = document.querySelector('#isRefresh')
                    const refreshTime = document.querySelector('#refreshTime')
                    let currentTime = res.currentTime

                    cycle = setInterval(() => {
                        // 抢购方式一，提前直接排队
                        //rushToBuy(startTime, currentTime, g_beforeStartTime)

                        // 抢购方式二，提前调用onclick
                        rushToBuyEx(startTime, currentTime, g_beforeStartTime)

                        // 抢购方式三，准时调用click
                        //rushToBuyDingjin()

                        // 调整定时器
                        currentTime += INTERVAL
                    }, INTERVAL)
                }
            }
        }
        GM_xmlhttpRequest(details)
    }
        // 获取活动信息
    const getSkuRushbuyInfo = (skuIds, getTime) => {
            const details = {
                method: 'GET',
                url: `https://buy.vmall.com/getSkuRushbuyInfo.json?skuIds=${skuIds}&t=${new Date().getTime()}`,
                onload: (responseDetails) => {
                    NETWORKTIME = (new Date().getTime() - getTime)/2 // 单边RTT
                    if (responseDetails.status === 200) {
                        const res = JSON.parse(responseDetails.responseText)
                        OFFSETTIME = res.currentTime - new Date().getTime()
                        STARTTIME = res.skuRushBuyInfoList[0].startTime
                        initBox()
                    }
                }
            }
            GM_xmlhttpRequest(details)
        }
    // 提前申购1
    const rushToBuy = (startTime, currentTime, beforeStartTime) => {
        if (startTime - currentTime <= beforeStartTime) {
            if (window.location.href.indexOf('/rush') !== -1) {
                ec.submit(0)
            }
            if (window.location.href.indexOf('/product') !== -1) {
                rush.business.doGoRush(1);
            }
            sessionStorage.setItem('isRun', false)
            clearInterval(cycle)
        }
    }

    // 提前申购2
    const rushToBuyEx = (startTime, currentTime, beforeStartTime) => {
        if (startTime - currentTime <= beforeStartTime) {
            if (window.location.href.indexOf('/rush') !== -1) {
                ec.submit(0)
            }
            if (window.location.href.indexOf('/product') !== -1) {
                ec.product.payDepositNew(1)
            }
            sessionStorage.setItem('isRun', false)
            clearInterval(cycle)
        }
    }

    // 准时下单
    const rushToBuyDingjin = () => {
            var button = document.getElementsByClassName("product-button02")[2];
            if ((button.text == '支付订金') && button.hasAttribute("onclick")) {
                button.click();
                sessionStorage.setItem('isRun', false)
                clearInterval(cycle)
            }
    }
    // 抢购倒计时对比
    const getDistanceSpecifiedTime = (dateTime, currentTime) => {
            // 指定日期和时间
            var EndTime = new Date(dateTime).getTime();
            // 当前系统时间
            // var NowTime = new Date();
            // var t = EndTime.getTime() - NowTime.getTime();
            var t = EndTime - currentTime
            var d = Math.floor(t / 1000 / 60 / 60 / 24);
            var h = Math.floor(t / 1000 / 60 / 60 % 24);
            var m = Math.floor(t / 1000 / 60 % 60);
            var s = Math.floor(t / 1000 % 60);
            return `${fillZero(d)}天 ${fillZero(h)}:${fillZero(m)}:${fillZero(s)}`
    }
    // 格式化时间
    const formatTime = (time) => {
            var datetime = new Date();
            datetime.setTime(time);
            var year = datetime.getFullYear();
            var month = datetime.getMonth() + 1
            var date = datetime.getDate()
            var hour = datetime.getHours()
            var minute = datetime.getMinutes()
            var second = datetime.getSeconds()
            return `${year}-${fillZero(month)}-${fillZero(date)} ${fillZero(hour)}:${fillZero(minute)}:${fillZero(second)}`
        }
    // 格式化时补零
    const fillZero = (str, len = 2) => {
        return (`${str}`).padStart(len, '0')
    }
})();
