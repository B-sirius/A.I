'use strict';

let AI = function(imgSrc, containerStyle, imgStyle) {
    this.imgSrc = imgSrc;
    this.style = containerStyle;
    this.imgStyle = imgStyle;

    this.menu = null;

    this.xBase = 1;
    this.yBase = 1;

    this._init();
}

// 初始化
AI.prototype._init = function() {
    // 创建元素
    this.el = createElement('div', 'ai-container');

    // 指定可点击区域为图片
    this.clickArea = new Image();
    this.clickArea.src = this.imgSrc;
    setStyle(this.clickArea, this.imgStyle);

    this.supportMenu();

    let loadPromise = new Promise((resolve, reject) => {
        this.clickArea.onload = function() {
            resolve();
        }
    });

    let _self = this;
    loadPromise.then(() => {
        // 设定样式
        setStyle(this.el, this.style);

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
        _self.el.appendChild(this.clickArea);
        document.body.insertBefore(_self.el, document.body.firstChild);

        // 绑定拖拽
        this.supportDrag();
    });
}

// 初始化对左键拖拽的支持
AI.prototype.supportDrag = function() {
    let drag = throttleFn(this.drag, 16, this);

    let _self = this;
    let startDrag = function(e) {
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

    this.el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        if (e.button === 0) { // 左键
            startDrag(e);
        }
    });
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

    setStyle(this.el, style);
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
        setStyle(_self.el, style);

        // 速度损耗
        speed -= attrition;
        if (speed < 1) {
            return;
        }

        requestAnimationFrame(nextMove);
    }

    requestAnimationFrame(nextMove);
}

// 初始化对右键菜单的支持
AI.prototype.supportMenu = function() {
    this.initMenu();

    let _self = this;
    // 点击ai时屏蔽右键菜单
    window.oncontextmenu = function(e) {
        if (e.target === _self.clickArea) {
            return false;
        }
    }

    this.el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        if (e.button === 2) { // 右键
            MenuController['choice'].apply(_self.menu);
            _self.toggleShow();
        }
    });
}

AI.prototype.toggleShow = function() {
    if (this.menu.refs.container.visible) {
        this.menu.refs.container.hide();
    } else {
        this.menu.refs.container.show();
    }
}

AI.prototype.initMenu = function() {
    this.menu = new AImenu();
    this.menu.ai = this;

    this.menu.init();

    this.el.appendChild(this.menu.refs.container);

    this.menu.refs.container.hide();
}

let AImenu = function() {
    this.refs = {};
    this.curr = 'home';
}

AImenu.prototype.init = function() {
    // 创建dom
    let container = createElement('div', 'ai-menu-container');
    let textContainer = createElement('div', 'ai-text-container');
    let choiceList = createElement('ul', 'ai-choice-list');
    let controlBtn = createElement('a', 'ai-menu-btn');
    controlBtn.href = 'javascript:';
    controlBtn.textContent = 'menu';

    // 合体！
    container.appendChild(textContainer);
    container.appendChild(choiceList);
    container.appendChild(controlBtn);

    // 保存引用
    this.refs.container = container;
    this.refs.textContainer = textContainer;
    this.refs.choiceList = choiceList;
    this.refs.controlBtn = controlBtn;

    // 为菜单的元素提供显示与隐藏方法
    for (let key in this.refs) {
        this.refs[key].show = function() {
            this.classList.remove('ai-hide');
            this.visible = true;
        }
        this.refs[key].hide = function() {
            this.classList.add('ai-hide');
            this.visible = false;
        }
    }

    let _self = this;
    this.refs.controlBtn.addEventListener('click', function() {
        MenuController[_self.curr].apply(_self);
    });
}

AImenu.prototype.setText = function(text) {
    let textNode = createElement('p', 'ai-text');
    textNode.textContent = text;

    this.refs.textContainer.innerHTML = '';
    this.refs.textContainer.appendChild(textNode);
}

AImenu.prototype.setChoice = function(list) {
    let fragment = document.createDocumentFragment();
    for (let choice of list) {
        let li = createElement('li', 'ai-choice');
        let a = createElement('a', 'ai-choice-btn');
        a.textContent = choice.text;
        a.href = 'javascript:';

        let _self = this;
        a.addEventListener('click', function() {
            choice.fn.apply(_self.ai);
        });

        li.appendChild(a);
        fragment.appendChild(li);
    }

    this.refs.choiceList.innerHTML = '';
    this.refs.choiceList.appendChild(fragment);
}

let MenuController = {
    'home': function() {
        this.refs.textContainer.hide();
        this.refs.choiceList.show();

        this.refs.controlBtn.textContent = 'back';
        this.curr = 'choice';
    },
    'choice': function() {
        this.refs.choiceList.hide();
        this.refs.textContainer.show();

        this.refs.controlBtn.textContent = 'menu';
        this.curr = 'home';
    }
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

let createElement = function(tag, className, id) {
    let el = document.createElement(tag);
    el.className = className || '';
    el.id = id || '';

    return el;
}

// 样式迭代器
let setStyle = function(el, style) {
    for (let key in style) {
        el.style[key] = style[key];
    }
}

window.AI = AI;