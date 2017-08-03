'use strict';

let AI = function(imgSrc, style) {
    this.imgSrc = imgSrc;
    this.style = style;

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
        document.body.insertBefore(el, document.body.firstChild);
    });
}

AI.prototype.setStyle = function(style) {
    for (let key in style) {
        this.el.style[key] = style[key];
    }
}

AI.prototype.launch = function() {
    let speed = 1;
    let angle = Math.random() * Math.PI * 2;

    let mapWidth = document.documentElement.clientWidth;
    let mapHeight = document.documentElement.clientHeight;

    let elWidth = parseFloat(this.el.style.width.slice(0, -2)); // 只考虑px
    let elHeight = parseFloat(this.el.style.height.slice(0, -2));

    let xKey = this.style.right !== '' ? 'right' : 'left';
    let yKey = this.style.bottom !== '' ? 'bottom' : 'top';

    let x = parseFloat(this.el.style[xKey].slice(0, -2));
    let y = parseFloat(this.el.style[yKey].slice(0, -2));

    let moveId = requestAnimationFrame(() => {
        let dX = speed * Math.cos(angle);
        let dy = speed * Math.sin(angle);

        x += dX;
        y += dy;

        if (x < 0 || x > mapWidth - elWidth) {
            angle = -angle;
        }

        if (y < 0 || y > mapHeight - elHeight) {
            angle = -angle + Math.PI;
        }
    });
}

window.AI = AI;