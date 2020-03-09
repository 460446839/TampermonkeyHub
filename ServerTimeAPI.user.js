// ==UserScript==
// @name         各电商平台服务器时间
// @namespace    https://github.com/gorkys/TampermonkeyHub
// @version      1.0.0
// @description  try to take over the world!
// @author       Gorkys
// @license      MIT
// @match        *://*.taobao.com/*
// @match        *://*.jd.com/*
// @match        *://*.vmall.com/*
// @match        *://*.suning.com/*
// @match        *://*.pinduoduo.com/*
// @supportURL   https://github.com/gorkys/TampermonkeyHub
// @updateURL    https://github.com/gorkys/TampermonkeyHub/ServerTimeAPI.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const initBox = () => {
        const style = `#timeBox{background-color:rgba(255,255,255,0.7);width:260px;font-size:14px;position:fixed;top:20%;right:-150px;padding:10px;border-radius:5px;box-shadow:1px 1px 9px 0 #888;transition:right 1s;text-align:center}#timeBox:hover{right:10px}.title{font-size:16px;font-weight:bold;margin:10px 0}.title span{font-size:12px;color:#9c9c9c}.time{text-align:left;padding-left:20px}.time p{margin-top:1px}.time span{color:red;font-size:16;font-weight:bold;margin-left:20px}`
        const html = `
                <div id='timeBox'>
                    <h3 class="title">
                        各电商平台服务器时间 <span>by: Gorkys</span>
                    </h3>
                    <div class='time'>
                        <p>淘宝 :&nbsp;&nbsp; <span id='taobao'>无法获取</span></p>
                        <p>华为 :&nbsp;&nbsp; <span id='vmall'>无法获取</span></p>
                        <p>京东 :&nbsp;&nbsp; <span id='jd'>无法获取</span></p>
                        <p>苏宁 :&nbsp;&nbsp; <span id='suning'>无法获取</span></p>
                        <p>拼多多 : <span id='pinduoduo'>无法获取</span></p>
                    </div>
                </div>
                `
        var stylenode = document.createElement('style');
        stylenode.setAttribute("type", "text/css");
        if (stylenode.styleSheet) {// IE
            stylenode.styleSheet.cssText = style;
        } else {// w3c
            var cssText = document.createTextNode(style);
            stylenode.appendChild(cssText);
        }
        var node = document.createElement('div');
        node.innerHTML = html;
        document.head.appendChild(stylenode);
        document.body.appendChild(node);
    }

    const querySystemTime2 = (val) => {
        return val
    }

    const ajaxSeverTime = (url, type) => {
        let data = null;

        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        xhr.open("GET", url);

        xhr.send(data);

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                let getTime = ''
                const res = type === 'suning' ? eval(this.responseText) : JSON.parse(this.responseText)

                switch (type) {
                    case 'taobao':
                        getTime = + res.data.t
                        break
                    case 'jd':
                        getTime = res.serverTime
                        break
                    case 'vmall':
                        getTime = res.currentTime
                        break
                    case 'suning':
                        getTime = res.timeStamp
                        break
                    case 'pinduoduo':
                        getTime = res.server_time
                        break
                }
                document.querySelector(`#${type}`).innerText = formatDate(getTime)
            }
        });
    }

    // 时间戳转换日期格式
    const formatDate = (value) => {
        const date = new Date(+value + 100);
        // const yyyy = date.getFullYear();// 年
        // const MM = date.getMonth() + 1;// 月
        // MM = MM < 10 ? ('0' + MM) : MM;
        // const dd = date.getDate();// 日
        // dd = dd < 10 ? ('0' + dd) : dd;
        const h = date.getHours();// 时
        const m = date.getMinutes();// 分
        const s = date.getSeconds();// 秒
        const ms = Math.floor(new Date().getMilliseconds() / 100) // 毫秒 + ' ' + ms
        return formatTime(h) + ':' + formatTime(m) + ':' + formatTime(s) + '.' + ms
    }
    // 时间补0
    const formatTime = (value) => {
        const time = value < 10 ? '0' + value : value
        return time.toString()
    }

    initBox()

    const timeAPI = {
        taobao: 'http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp',
        // 可带参数https://buy.vmall.com/getSkuRushbuyInfo.json?skuIds=10086175997878&t=1583496687456
        jd: 'https://a.jd.com//ajax/queryServerData.html',
        vmall: 'https://buy.vmall.com/getSkuRushbuyInfo.json',
        suning: 'https://ju.m.suning.com/ajax/getSystemTime_querySystemTime2.html?_=1583498034772&callback=querySystemTime2',
        pinduoduo: 'https://api.pinduoduo.com/api/server/_stm'
    }

    setInterval(() => {
        for (let i in timeAPI) {
            if (window.location.href.indexOf(i) != -1) {
                ajaxSeverTime(timeAPI[i], i)
            }
        }
    }, 100)

})();