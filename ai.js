'use strict';

let AI = function(imgSrc, style) {
    this.imgSrc = imgSrc;
    this.style = style;

    this.xBase = 1;
    this.yBase = 1;

    this._init();
}

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

        _self.setStyle(this.style);

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

        // 绑定事件
        let drag = throttleFn(_self.drag, 16, this);

        let startDrag = function(e) {
            e.preventDefault();

            // 记录鼠标按下时的位置，注意这个位置是相对左上角的
            _self.oldPos = {
                x: e.clientX,
                y: e.clientY
            };
            // 此时相关的style属性值
            _self.oldStyle = {
                x: parseFloat(_self.el.style[_self.xKey].slice(0, -2)),
                y: parseFloat(_self.el.style[_self.yKey].slice(0, -2))
            }

            el.addEventListener('mousemove', drag);
        }

        let stopDrag = function() {
            el.removeEventListener('mousemove', drag);
        }

        el.addEventListener('mousedown', startDrag);
        document.body.addEventListener('mouseup', stopDrag);
    });
}

AI.prototype.setStyle = function(style) {
    for (let key in style) {
        this.el.style[key] = style[key];
    }
}

AI.prototype.launch = function() {
    let speed = 30; // 速度，帧为单位
    let attrition = 5 / 60; // 速度损耗，同样帧为单位
    let angle = Math.random() * Math.PI * 2;

    let mapWidth = document.documentElement.clientWidth;
    let mapHeight = document.documentElement.clientHeight;

    let elWidth = parseFloat(this.el.style.width.slice(0, -2)); // 只考虑px
    let elHeight = parseFloat(this.el.style.height.slice(0, -2));

    

    let x = parseFloat(this.el.style[this.xKey].slice(0, -2));
    let y = parseFloat(this.el.style[this.yKey].slice(0, -2));

    let _self = this;
    let nextMove = function() {
        // 每帧的位移
        let dX = speed * Math.cos(angle);
        let dy = speed * Math.sin(angle);

        x += dX;
        y += dy;

        // 碰撞检测
        if (x < 0 || x > mapWidth - elWidth) {
            angle = -angle + Math.PI;
            x = x < 0 ? 0 : mapWidth - elWidth;
        }

        if (y < 0 || y > mapHeight - elHeight) {
            angle = -angle;
            y = y < 0 ? 0 : mapHeight - elHeight;
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

AI.prototype.drag = function(e) {
    let newPos = {
        x: e.clientX,
        y: e.clientY
    };

    // 移动的距离差，
    let dx = newPos.x - this.oldPos.x;
    let dy = newPos.y - this.oldPos.y;

    let style = {};
    style[this.xKey] = this.oldStyle.x + dx * this.xBase + 'px';
    style[this.yKey] = this.oldStyle.y + dy * this.yBase + 'px';

    this.setStyle(style);
}

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

window.AI = AI;