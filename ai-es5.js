'use strict';

var AI = function AI(imgSrc, containerStyle, imgStyle) {
    this.imgSrc = imgSrc;
    this.style = containerStyle;
    this.imgStyle = imgStyle;

    this.menu = null;

    this.xBase = 1;
    this.yBase = 1;

    this._init();
};

// 初始化
AI.prototype._init = function() {
    // 创建元素
    this._initContainer();

    // 指定可点击区域为图片
    this._initClickArea();

    this.supportMenu();
};

AI.prototype._initContainer = function() {
    this.el = createElement('div', 'ai-container');
};

// 点击区域其实就是图片的部分
AI.prototype._initClickArea = function() {
    var _this = this;

    this.clickArea = new Image();
    this.clickArea.src = this.imgSrc;
    setStyle(this.clickArea, this.imgStyle);

    var loadPromise = new Promise(function(resolve, reject) {
        _this.clickArea.onload = function() {
            resolve();
        };
    });

    // 图片加载完成后
    var _self = this;
    loadPromise.then(function() {
        // 设定容器样式
        setStyle(_this.el, _this.style);

        // 保存容器的大小
        _self.width = getNum(_this.el.style.width);
        _self.height = getNum(_this.el.style.height);

        // 设定坐标系依据
        if (_this.style.right !== '') {
            _this.xKey = 'right';
            _this.xBase = -1;
        } else {
            _this.xKey = 'left';
            _this.xBase = 1;
        }
        if (_this.style.bottom !== '') {
            _this.yKey = 'bottom';
            _this.yBase = -1;
        } else {
            _this.yKey = 'top';
            _this.yBase = 1;
        }

        // 插入dom
        _self.el.appendChild(_this.clickArea);
        document.body.insertBefore(_self.el, document.body.firstChild);

        // 为容器绑定拖拽
        _this.supportDrag();
    });
};

// 初始化对左键拖拽的支持
AI.prototype.supportDrag = function() {
    var drag = throttleFn(this.drag, 16, this);

    var _self = this;
    var startDrag = function startDrag(e) {
        // 记录鼠标按下时的位置，注意这个位置是相对左上角的
        _self.oldPos = {
            x: e.clientX,
            y: e.clientY
        };
        // 此时相关的style属性值
        _self.oldStyle = {
            x: getNum(_self.el.style[_self.xKey]),
            y: getNum(_self.el.style[_self.yKey])
        };

        window.addEventListener('mousemove', drag);
    };

    var stopDrag = function stopDrag() {
        window.removeEventListener('mousemove', drag);
    };

    this.el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        if (e.button === 0) {
            // 左键
            startDrag(e);
        }
    });
    window.addEventListener('mouseup', stopDrag);
};

// 拖拽
AI.prototype.drag = function(e) {
    var newPos = {
        x: e.clientX,
        y: e.clientY
    };

    // 移动的距离差，
    var dx = newPos.x - this.oldPos.x;
    var dy = newPos.y - this.oldPos.y;

    var mapWidth = document.documentElement.clientWidth;
    var mapHeight = document.documentElement.clientHeight;

    // 碰撞检测
    var x = this.oldStyle.x + dx * this.xBase;
    if (x < 0 || x > mapWidth - this.width) {
        if (x < 0) {
            x = 0;
        } else {
            x = mapWidth - this.width;
        }
    }

    var y = this.oldStyle.y + dy * this.yBase;
    if (y < 0 || y > mapHeight - this.height) {
        if (y < 0) {
            y = 0;
        } else {
            y = mapHeight - this.height;
        }
    }

    var style = {};

    style[this.xKey] = x + 'px';
    style[this.yKey] = y + 'px';

    setStyle(this.el, style);
};

// 射爆！
AI.prototype.launch = function() {
    var speed = 30; // 速度，帧为单位
    var attrition = 5 / 60; // 速度损耗，同样帧为单位
    var angle = Math.random() * Math.PI * 2;

    // 网页可视区域大小
    var mapWidth = document.documentElement.clientWidth;
    var mapHeight = document.documentElement.clientHeight;

    var x = getNum(this.el.style[this.xKey]);
    var y = getNum(this.el.style[this.yKey]);

    // 每帧的位移
    var dX = speed * Math.cos(angle);
    var dY = speed * Math.sin(angle);

    var attritionX = attrition * Math.cos(angle);
    var attritionY = attrition * Math.sin(angle);

    var _self = this;
    var nextMove = function nextMove() {
        x += dX;
        y += dY;

        // 碰撞检测
        if (x < 0 || x > mapWidth - _self.width) {
            dX = -dX;
            attritionX = -attritionX;
            x = x < 0 ? 0 : mapWidth - _self.width;
        }

        if (y < 0 || y > mapHeight - _self.height) {
            dY = -dY;
            attritionY = -attritionY;
            y = y < 0 ? 0 : mapHeight - _self.height;
        }

        // 设置样式
        var style = {};
        style[_self.xKey] = x + 'px';
        style[_self.yKey] = y + 'px';

        // 绘制样式
        setStyle(_self.el, style);

        // 速度损耗
        dX -= attritionX;
        dY -= attritionY;

        if (Math.abs(dX) < 1 && Math.abs(dY) < 1) {
            return;
        }

        requestAnimationFrame(nextMove);
    };

    requestAnimationFrame(nextMove);
};

// 初始化对右键菜单的支持
AI.prototype.supportMenu = function() {
    // 生成菜单
    this._initMenu();

    var _self = this;
    // 点击ai时屏蔽右键菜单
    window.oncontextmenu = function(e) {
        if (e.target === _self.clickArea) {
            return false;
        }
    };

    this.el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        if (e.button === 2) {
            // 右键
            MenuController['choice'].apply(_self.menu);
            _self.toggleShow();
        }
    });
};

AI.prototype.toggleShow = function() {
    if (this.menu.refs.container.visible) {
        this.menu.refs.container.hide();
    } else {
        this.menu.refs.container.show();
    }
};

AI.prototype._initMenu = function() {
    this.menu = new AImenu();
    this.menu.ai = this;

    this.menu.init();

    this.el.appendChild(this.menu.refs.container);

    this.menu.refs.container.hide();
};

var AImenu = function AImenu() {
    this.refs = {};
    this.curr = 'home';
};

AImenu.prototype.init = function() {
    // 创建dom
    var container = createElement('div', 'ai-menu-container');
    var textContainer = createElement('div', 'ai-text-container');
    var choiceList = createElement('ul', 'ai-choice-list');
    var controlBtn = createElement('a', 'ai-menu-btn');
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
    for (var key in this.refs) {
        this.refs[key].show = function() {
            this.classList.remove('ai-hide');
            this.visible = true;
        };
        this.refs[key].hide = function() {
            this.classList.add('ai-hide');
            this.visible = false;
        };
    }

    var _self = this;
    this.refs.controlBtn.addEventListener('click', function() {
        MenuController[_self.curr].apply(_self);
    });
};

AImenu.prototype.setText = function(text) {
    var textNode = createElement('p', 'ai-text');
    textNode.textContent = text;

    this.refs.textContainer.innerHTML = '';
    this.refs.textContainer.appendChild(textNode);
};

AImenu.prototype.setChoice = function(list) {
    var _this2 = this;

    var fragment = document.createDocumentFragment();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        var _loop = function _loop() {
            var choice = _step.value;

            var li = createElement('li', 'ai-choice');
            var a = createElement('a', 'ai-choice-btn');
            a.textContent = choice.text;
            a.href = 'javascript:';

            var _self = _this2;
            a.addEventListener('click', function() {
                choice.fn.apply(_self.ai);
            });

            li.appendChild(a);
            fragment.appendChild(li);
        };

        for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            _loop();
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    this.refs.choiceList.innerHTML = '';
    this.refs.choiceList.appendChild(fragment);
};

var MenuController = {
    'home': function home() {
        this.refs.textContainer.hide();
        this.refs.choiceList.show();

        this.refs.controlBtn.textContent = 'back';
        this.curr = 'choice';
    },
    'choice': function choice() {
        this.refs.choiceList.hide();
        this.refs.textContainer.show();

        this.refs.controlBtn.textContent = 'menu';
        this.curr = 'home';
    }
};
// 节流函数
var throttleFn = function throttleFn(fn, minInterval, context) {
    var timeoutId = null;

    return function(e) {
        if (timeoutId === null) {
            fn.call(context, e);

            timeoutId = setTimeout(function() {
                timeoutId = null;
            }, minInterval);
        }
    };
};

// 从样式中获得数字，只考虑px
var getNum = function getNum(value) {
    return parseFloat(value.slice(0, -2));
};

var createElement = function createElement(tag, className, id) {
    var el = document.createElement(tag);
    el.className = className || '';
    el.id = id || '';

    return el;
};

// 样式迭代器
var setStyle = function setStyle(el, style) {
    for (var key in style) {
        el.style[key] = style[key];
    }
};

window.AI = AI;