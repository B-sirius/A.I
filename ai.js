'use strict';

let AI = function(imgSrc, style) {
    this.imgSrc = imgSrc;
    this.style = style;

    this.xBase = 1;
    this.yBase = 1;

    this._init();
}

// 初始化
AI.prototype._init = function() {
    let el = new Image();
    el.src = this.imgSrc;

    let loadPromise = new Promise((resolve, reject) => {
        el.onload = function() {
            resolve();
        }
    });

    let _self = this;
    loadPromise.then(() => {
        _self.el = el;
        // 设定样式
        _self.setStyle(this.style);

        _self.width = getNum(this.el.style.width);
        _self.height = getNum(this.el.style.height);

        // 设定坐标系依据
        if (this.style.right !== '') {
            this.xKey = 'right';
            this.xBase = -1;
        } else {
            this.xKey = 'left';
            this.xBase = 1;
        }
        if (this.style.bottom !== '') {
            this.yKey = 'bottom';
            this.yBase = -1;
        } else {
            this.yKey = 'top';
            this.yBase = 1;
        }

        // 插入dom
        document.body.insertBefore(el, document.body.firstChild);

        // 绑定拖拽
        this.supportDrag();
    });
}

// 初始化对拖拽的支持
AI.prototype.supportDrag = function() {
    let drag = throttleFn(this.drag, 16, this);

    let _self = this;
    let startDrag = function(e) {
        e.preventDefault();

        // 记录鼠标按下时的位置，注意这个位置是相对左上角的
        _self.oldPos = {
            x: e.clientX,
            y: e.clientY
        };
        // 此时相关的style属性值
        _self.oldStyle = {
            x: getNum(_self.el.style[_self.xKey]),
            y: getNum(_self.el.style[_self.yKey])
        }

        window.addEventListener('mousemove', drag);
    }

    let stopDrag = function() {
        window.removeEventListener('mousemove', drag);
    }

    this.el.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', stopDrag);
}

// 拖拽
AI.prototype.drag = function(e) {
    let newPos = {
        x: e.clientX,
        y: e.clientY
    };

    // 移动的距离差，
    let dx = newPos.x - this.oldPos.x;
    let dy = newPos.y - this.oldPos.y;


    let mapWidth = document.documentElement.clientWidth;
    let mapHeight = document.documentElement.clientHeight;

    // 碰撞检测
    let x = this.oldStyle.x + dx * this.xBase;
    if (x < 0 || x >  mapWidth - this.width) {
        if (x < 0) {
            x = 0;
        } else {
            x = mapWidth - this.width;
        }
    }

    let y = this.oldStyle.y + dy * this.yBase;
    if (y < 0 || y >  mapHeight - this.height) {
        if (y < 0) {
            y = 0;
        } else {
            y = mapHeight - this.height;
        }
    }

    let style = {};

    style[this.xKey] = x + 'px';
    style[this.yKey] = y + 'px';

    this.setStyle(style);
}

// 样式迭代器
AI.prototype.setStyle = function(style) {
    for (let key in style) {
        this.el.style[key] = style[key];
    }
}

// 射爆！
AI.prototype.launch = function() {
    let speed = 30; // 速度，帧为单位
    let attrition = 5 / 60; // 速度损耗，同样帧为单位
    let angle = Math.random() * Math.PI * 2;

    let mapWidth = document.documentElement.clientWidth;
    let mapHeight = document.documentElement.clientHeight;

    let x = getNum(this.el.style[this.xKey]);
    let y = getNum(this.el.style[this.yKey]);

    let _self = this;
    let nextMove = function() {
        // 每帧的位移
        let dX = speed * Math.cos(angle);
        let dy = speed * Math.sin(angle);

        x += dX;
        y += dy;

        // 碰撞检测
        if (x < 0 || x > mapWidth - _self.width) {
            angle = -angle + Math.PI;
            x = x < 0 ? 0 : mapWidth - _self.width;
        }

        if (y < 0 || y > mapHeight - _self.width) {
            angle = -angle;
            y = y < 0 ? 0 : mapHeight - _self.height;
        }

        // 设置样式
        let style = {};
        style[_self.xKey] = x + 'px';
        style[_self.yKey] = y + 'px';
        _self.setStyle(style);

        // 速度损耗
        speed -= attrition;
        if (speed < 1) {
            return;
        }

        requestAnimationFrame(nextMove);
    }

    requestAnimationFrame(nextMove);
}

// 节流函数
let throttleFn = function(fn, minInterval, context) {
    let timeoutId = null;

    return function(e) {
        if (timeoutId === null) {
            fn.call(context, e);

            timeoutId = setTimeout(() => {
                timeoutId = null;
            }, minInterval);
        }
    }
}

// 从样式中获得数字，只考虑px
let getNum = function(value) {
    return parseFloat(value.slice(0, -2));
}

window.AI = AI;