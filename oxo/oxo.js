"use strict";

// ************************************************************

var GameState = function(data)
{
    this.data = data == undefined ? [0,0,0, 0,0,0, 0,0,0] : data.slice();
}

GameState.prototype = new Object();
GameState.prototype.constructor = GameState;

GameState.prototype.get = function(row, col)
{
    return this.data[row*3+col];
};

GameState.prototype.set = function(row, col, side)
{
    this.data[row*3+col] = side;
};

GameState.prototype.move = function(pos, side)
{
    var grid = new GameState(this.data);
    grid.data[pos] = side;
    return grid;
};

GameState.prototype._moves = {1: {}, 2: {}};

GameState.prototype.moves = function(side)
{
    var moves = this._moves[side];
    var r = moves[this.data];
    if (r == undefined) {
        r = [];
        for (var pos = 0; pos < 9; pos++)
            if (this.data[pos] == 0)
                r.push([pos, this.move(pos, side)]);
        moves[this.data] = r;
    }
    return r;
};

GameState.prototype.STATE_LINE = 1;
GameState.prototype.STATE_DRAW = 2;
GameState.prototype.STATE_INCOMPLETE = 3;

GameState.prototype._state = {};

GameState.prototype.calc_state = function()
{
    var d = this.data;
    var s00 = d[0], s01 = d[1], s02 = d[2];
    var s10 = d[3], s11 = d[4], s12 = d[5];
    var s20 = d[6], s21 = d[7], s22 = d[8];
    var lines = [[s00,s01,s02], [s10,s11,s12], [s20,s21,s22],
                 [s00,s10,s20], [s01,s11,s21], [s02,s12,s22],
                 [s00,s11,s22], [s02,s11,s20]];
    for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        if (l[0] != 0 && l[0] == l[1] && l[1] == l[2])
            return this.STATE_LINE;
    }

    for (var i = 0; i < this.data.length; i++)
        if (this.data[i] == 0)
            return this.STATE_INCOMPLETE;

    return this.STATE_DRAW;
};

GameState.prototype.state = function()
{
    var state = this._state[this.data];

    if (state == undefined) {
        state = this.calc_state();
        this._state[this.data] = state;
    }

    return state;
};

GameState.prototype._cost = {1: {}, 2: {}};

GameState.prototype.MAX_COST = 999999999;

GameState.prototype.other = function(side)
{
    return [0,2,1][side];
};

GameState.prototype.calc_cost = function(side)
{
    var s = this.state();
    if (s == this.STATE_DRAW)
        return 0;
    if (s == this.STATE_LINE)
        return this.MAX_COST;

    var nside = this.other(side);

    var costs = [];
    var moves = this.moves(side);
    for (var i = 0; i < moves.length; i++) {
        var move = moves[i];
        var pos = move[0];
        var next = move[1];
        costs.push(next.cost(nside));
    }
    costs.sort(function(a,b) {return b-a;});
    var ncosts = [];
    for (var i = 0; i < costs.length; i++) {
        var cost = costs[i];
        ncosts.push(cost+i);
    }
    costs = ncosts;
    cost = Math.min.apply(Math, costs);

    if (cost >= this.MAX_COST) {
        var nblock = costs.length;
        var costs = [];
        var moves = this.moves(nside);
        for (var i = 0; i < moves.length; i++) {
            var move = moves[i];
            var pos = move[0];
            var next = move[1];
            costs.push(next.cost(side));
        }
        costs.sort(function(a,b) {return b-a;});
        var ncosts = [];
        for (var i = 0; i < costs.length; i++) {
            var cost = costs[i];
            ncosts.push(cost+nblock+i);
        }
        costs = ncosts;
        cost = Math.min.apply(Math, costs);
    }

    return cost;
};

GameState.prototype.cost = function(side)
{
    var cost = this._cost[side][this.data];

    if (cost == undefined) {
        cost = this.calc_cost(side);
        this._cost[side][this.data] = cost;
    }

    return cost;
};

GameState.prototype.evaluate = function(side)
{
    var s = this.state();
    if (s != this.STATE_INCOMPLETE)
        return null;

    var nside = this.other(side);
    var costs = [];
    var moves = this.moves(side);
    for (var i = 0; i < moves.length; i++) {
        var move = moves[i];
        var pos = move[0];
        var next = move[1];
        costs.push([next.cost(nside), pos, next]);
    };
    costs.sort(function(a,b) {return b[0]-a[0];});
    return costs;
};

// ************************************************************

var UIElement = function()
{
};

UIElement.prototype = new Object();
UIElement.prototype.constructor = UIElement;

UIElement.prototype.svg_ns = "http://www.w3.org/2000/svg";
UIElement.prototype.xlink_ns = "http://www.w3.org/1999/xlink";
UIElement.prototype.sides = ["blank", "O", "X"];

UIElement.prototype.make_use = function(id)
{
    var link = document.createElementNS(this.svg_ns, "use");
    link.setAttributeNS(this.xlink_ns, "href", "#" + id);
    return link;
};

UIElement.prototype.make_text = function(str)
{
    var text = document.createElementNS(this.svg_ns, "text");
    text.setAttribute("class", "cost");
    text.setAttribute("x", "200");
    text.setAttribute("y", "240");
    text.textContent = str;
    return text
};

UIElement.prototype.get_element = function(root, selector)
{
    var elems = root.querySelectorAll(selector);
    if (elems.length < 1)
        return null;
    if (elems.length > 1)
        throw Error("multiple elements for " + selector);
    return elems[0];
};

// ************************************************************

var Board = function(game)
{
    UIElement.call(this);

    this.game = game;
    this.e_grid = null;
    this.e_bust = null;
    this.grid = null;
};

Board.prototype = Object.create(UIElement.prototype);
Board.prototype.constructor = Board;

Board.prototype.setup = function(root)
{
    this.e_grid = [];
    for (var row = 0; row < 3; row++) {
        var elems = [];
        for (var col = 0; col < 3; col++) {
            var elem = this.get_element(root, "#cell_" + row + "_" + col);
            elems.push(elem);
        }
        this.e_grid.push(elems);
    }

    this.e_bust = this.get_element(root, "#bust");
};

Board.prototype.click_cell = function(row, col)
{
    var side = this.game.side;
    this.grid.set(row, col, side);
    this.update();
    this.evaluate(side);
};

Board.prototype.set_cell = function(row, col, id)
{
    var elem = this.e_grid[row][col];
    while (elem.hasChildNodes())
        elem.firstChild.remove();
    elem.appendChild(this.make_use(id));
};

Board.prototype.update = function()
{
    for (var row = 0; row < 3; row++)
        for (var col = 0; col < 3; col++)
            this.set_cell(row, col, this.sides[this.grid.get(row, col)]);
};

Board.prototype.reset = function()
{
    this.grid = new GameState();
};

Board.prototype.evaluate = function(side)
{
    if (side == 0) {
        this.e_bust.classList.toggle("hidden", true);
        return;
    }

    var costs = this.grid.evaluate(side);
    if (costs == null)
        return;

    var mincost = this.grid.MAX_COST;

    for (var i = 0; i < costs.length; i++) {
        var _cost = costs[i];
        var cost = _cost[0];
        var pos  = _cost[1];
        var next = _cost[2];
        var row = Math.floor(pos / 3);
        var col = pos % 3;
        var elem = ((cost >= next.MAX_COST)
            ? ((next.state() == next.STATE_LINE)
               ? this.make_use("lethal")
               : this.make_use("warning"))
            : this.make_text("" + cost));
        this.e_grid[row][col].appendChild(elem);
        mincost = Math.min(cost, mincost);
    }

    this.e_bust.classList.toggle("hidden", mincost < this.grid.MAX_COST);
};

// ************************************************************

var Game = function(boards)
{
    UIElement.call(this);

    this.boards = [];
    this.width = null;
    this.e_root = null;
    this.e_boards = null;
    this.e_sides = null;
    this.side = 0;
};

Game.prototype = Object.create(UIElement.prototype);
Game.prototype.constructor = Game;

Game.prototype.setup = function()
{
    this.e_root = document.rootElement;
    this.e_board = document.getElementById("board");
    this.e_boards = document.getElementById("boards");

    for (var i = 0; i < this.e_boards.children.length; i++) {
        var node = this.e_boards.children[i];
        if (node.tagName != "use")
            continue;
        if (node.getAttributeNS(this.xlink_ns, "href") != "#board")
            continue;
        var board = new Board(this);
        this.boards.push(board);
        var elem = this.e_board.cloneNode(true);
        elem.setAttribute("id", node.getAttribute("id"));
        elem.setAttribute("transform", node.getAttribute("transform"));
        board.setup(elem);
        this.e_boards.replaceChild(elem, node);
    }

    this.e_sides = {}
    for (var side = 0; side < this.sides.length; side++) {
        var elem = document.getElementById("side_" + this.sides[side]);
        this.e_sides[side] = elem;
    }

    this.e_status = document.getElementById("status");
};

Game.prototype.click_side = function(side)
{
    this.side = side;
    this.update();
};

Game.prototype.click_clear = function()
{
    this.reset();
    this.update();
};

Game.prototype.reset = function()
{
    this.side = 0;
    this.boards.forEach(function(board) { board.reset(); })
};

Game.prototype.update_side = function()
{
    for (var side = 0; side < this.sides.length; side++) {
        var elem = this.e_sides[side];
        elem.classList.toggle("selected", side == this.side);
    }
};

Game.prototype.update = function()
{
    this.update_side();
    this.boards.forEach(function(board) { board.update(); board.evaluate(this.side); }, this)
};

Game.prototype.preload = function()
{
    var state = new GameState();
    state.evaluate(1);
    state.evaluate(2);
};

// ************************************************************

var game = null;

function startup()
{
    var ease = 0;
    game = new Game();
    game.setup();
    game.reset();
    game.preload();
    // game.grid = new GameState([1,0,2, 0,1,0, 2,0,1]);
    game.update();
}

function click_cell(elem)
{
    var id = elem.id;
    if (id.slice(0,5) != "cell_")
        return;
    var row = Number(id.slice(5,6));
    var col = Number(id.slice(7,8));

    elem = elem.parentElement.parentElement;
    id = elem.id;
    if (id.slice(0,6) != "board_")
        return;
    var board = id.slice(6,7);

    game.boards[board].click_cell(row, col);
}

function click_side(elem)
{
    var id = elem.id;
    if (id.slice(0,5) != "side_")
        return;
    id = id.slice(5);
    for (var i = 0; i < game.sides.length; i++)
        if (game.sides[i] == id)
            game.click_side(i);
}

// ************************************************************
