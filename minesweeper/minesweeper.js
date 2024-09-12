"use strict";

// ************************************************************

var MineSweeper = function(canvas, cols, rows, num_mines)
{
    this.rows = rows;
    this.cols = cols;
    this.num_mines = num_mines;
    this.solver = false;

    this.e_canvas = canvas;
    this.e_document = null;
    this.e_board = null;
    this.e_error = null;

    this.board = null;
    this.data = null;
    this.flags = null;
    this.hints = null;
};

MineSweeper.prototype = new Object();
MineSweeper.prototype.constructor = MineSweeper;

MineSweeper.prototype.svg_ns = "http://www.w3.org/2000/svg";
MineSweeper.prototype.xlink_ns = "http://www.w3.org/1999/xlink";

MineSweeper.prototype.MINE   = -2;
MineSweeper.prototype.HIDDEN = -1;

MineSweeper.prototype.MINE_N = -1;
MineSweeper.prototype.MINE_X =  0;
MineSweeper.prototype.MINE_Y =  1;

MineSweeper.prototype.setup = function()
{
    this.e_document = this.e_canvas.getSVGDocument();
    this.e_root = this.e_document.rootElement;
    this.e_board = this.e_document.getElementById("board");
    this.e_error = document.getElementById("error");

    this.e_canvas.setAttribute('tabIndex', 1);
    this.e_canvas.focus();
    this.e_root.onkeypress = this.key_press.bind(this);
    window.onkeypress = this.key_press.bind(this);

    while (this.e_board.hasChildNodes())
        this.e_board.firstChild.remove();

    var tile = this.e_document.getElementById("tile");
    var width  = tile.width.baseVal.value;
    var height = tile.height.baseVal.value;

    this.e_root.viewBox.baseVal.width  = width  * this.cols;
    this.e_root.viewBox.baseVal.height = height * this.rows;

    this.cells = [];
    for (var row = 0; row < this.rows; row++) {
        var elems = [];
        for (var col = 0; col < this.cols; col++) {
            var elem = this.e_document.createElementNS(this.svg_ns, "g");
            elem.setAttribute("id", "cell_" + row + "_" + col);
            elem.setAttribute("transform", "translate(" + (col*width) + "," + (row*height) + ")");
            elem.onmousedown = this.mouse_down.bind(this, col, row);
            elems.push(elem);
            this.e_board.appendChild(elem);
        }
        this.cells.push(elems);
    }

    this.reset();
};

MineSweeper.prototype.make_use = function(id)
{
    var link = this.e_document.createElementNS(this.svg_ns, "use");
    link.setAttributeNS(this.xlink_ns, "href", "#" + id);
    return link;
};

MineSweeper.prototype.make_text = function(str, cls)
{
    var text = this.e_document.createElementNS(this.svg_ns, "text");
    text.setAttribute("x", "20");
    text.setAttribute("y", "32");
    text.setAttribute("class", cls);
    text.textContent = str;
    return text
};

MineSweeper.prototype.set_cell = function(x, y, text, bg, fg)
{
    var elem = this.cells[y][x];
    while (elem.hasChildNodes())
        elem.firstChild.remove();
    elem.setAttribute("class", bg);
    if (text == null)
        elem.appendChild(this.make_use("tile"));
    else if (text[0] == "#")
        elem.appendChild(this.make_use(text.slice(1)));
    else {
        elem.appendChild(this.make_use("tile"));
        elem.appendChild(this.make_text(text, fg));
    }
};

MineSweeper.prototype.mark = function(x, y)
{
    var b = this.board[y][x];
    var n = this.data[y][x];
    var f = this.flags[y][x];
    var h = this.hints[y][x];

    var text = null;
    if (!b)
        text = null;
    else if (n == this.MINE && (this.bust || this.solver))
        //text = "*";
        text = "#mine";
    else if (n == 0)
        text = null;
    else if (n > 0)
        //text = "" + n;
        text = "#n" + n;
    else if (f)
        text = "!";
    else
        text = null;

    var bg = null;
    var fg = null;
    if (!b)
        bg = "outside";
    else if (n == 0)
        bg = ("open empty"), fg = "dark";
    else if (n > 0)
        bg = ("open count" + n), fg = "dark";
    else if (h == this.MINE_Y)
        bg = "hint_yes", fg = "light";
    else if (h == this.MINE_N)
        bg = "hint_no", fg = "light";
    else
        bg = "hidden", fg = "light";

    this.set_cell(x, y, text, bg, fg);
};

MineSweeper.prototype.mark_all = function()
{
    for (var y = 0; y < this.rows; y++)
        for (var x = 0; x < this.cols; x++)
            this.mark(x, y);
};

MineSweeper.prototype.array = function(fill)
{
    var data = [];
    for (var y = 0; y < this.rows; y++) {
        var row = [];
        for (var x = 0; x < this.cols; x++)
            row.push(fill);
        data.push(row);
    }
    return data;
};

MineSweeper.prototype.reset = function()
{
    this.board = this.array(true);
    this.data = this.array(this.HIDDEN);
    this.flags = this.array(false);
    this.hints = this.array(this.MINE_X);
    this.bust = false;
};

MineSweeper.prototype.random = function()
{
    for (var i = 0; i < this.num_mines; ) {
        var x = Math.floor(Math.random() * this.cols);
        var y = Math.floor(Math.random() * this.rows);
        if (!this.board[y][x] || this.data[y][x] != this.HIDDEN)
            continue;
        this.data[y][x] = this.MINE;
        i++;
    }
};

MineSweeper.prototype.valid = function(x, y)
{
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows && this.board[y][x];
};

MineSweeper.prototype.adjacent = function(x, y)
{
    var result = [];
    for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
            if (dx == 0 && dy == 0)
                continue;
            var nx = x + dx;
            var ny = y + dy;
            if (this.valid(nx, ny))
                result.push([nx, ny]);
        }
    }

    return result;
};

MineSweeper.prototype.activate = function(x, y)
{
    if (!this.valid(x, y))
        return;

    this.hints[y][x] = this.MINE_X;

    var c = this.data[y][x];

    // already open
    if (c >= 0)
        return;

    // mine
    if (c == this.MINE) {
        this.bust = true;
        this.mark_all();
        return;
    }
    var count = 0;
    var adj = this.adjacent(x, y);
    for (var i = 0; i < adj.length; i++) {
        var nx = adj[i][0];
        var ny = adj[i][1];
        if (this.data[ny][nx] == this.MINE)
            count++;
    }

    this.data[y][x] = count;
    this.mark(x, y);

    if (count > 0)
        return;

    for (var i = 0; i < adj.length; i++) {
        var nx = adj[i][0];
        var ny = adj[i][1];
        if (this.data[ny][nx] < 0)
            this.activate(nx, ny);
    }
};

MineSweeper.prototype.infer = function()
{
    var fwd = new DefaultDict();
    var rev = new DefaultDict();
    for (var y = 0; y < this.rows; y++) {
        for (var x = 0; x < this.cols; x++) {
            if (this.valid(x, y) && this.data[y][x] > 0) {
                var adj = this.adjacent(x,y);
                for (var i = 0; i < adj.length; i++) {
                    var nx = adj[i][0];
                    var ny = adj[i][1];
                    if (this.data[ny][nx] < 0) {
                        fwd.append([x,y], [nx,ny]);
                        rev.append([nx,ny], [x,y]);
                    }
                }
            }
            else if (this.data[y][x] == this.MINE) {
                var adj = this.adjacent(x,y);
                for (var i = 0; i < adj.length; i++) {
                    var nx = adj[i][0];
                    var ny = adj[i][1];
                    if (this.data[ny][nx] == 0) {
                        rev.append([x,y], [nx,ny]);
                        fwd.append([nx,ny], [x,y]);
                    }
                }
            }
        }
    }

    // fwd[known] = [unknown]
    // rev[unknown] = [known]

    var trans = new DefaultDict();
    var rev_keys = rev.keys();
    for (var i = 0; i < rev_keys.length; i++) {
        var c1 = rev_keys[i];
        for (var j = 0; j < rev[c1].length; j++) {
            var c2 = rev[c1][j];
            for (var k = 0; k < fwd[c2].length; k++) {
                var c3 = fwd[c2][k];
                trans.append(c1, c3);
            }
        }
    }

    // trans[unknown] = [unknown]

    var todo = new Set();
    var trans_keys = trans.keys();
    for (var i = 0; i < trans_keys.length; i++)
        todo.add(trans_keys[i]);
    
    var groups = [];
    while (!todo.empty()) {
        var cur = todo.pop();
        var group = [];
        var open = new Set();
        open.add(cur);
        while (!open.empty()) {
            var nopen = new Set();
            var open_keys = open.keys();
            for (var i = 0; i < open_keys.length; i++) {
                var src = open_keys[i];
                group.push(src);
                for (var j = 0; j < trans[src].length; j++) {
                    var dst = trans[src][j];
                    if (dst in todo) {
                        nopen.add(dst);
                        todo.remove(dst);
                    }
                }
            }
            open = nopen;
        }
        groups.push(group);
    }

    // return groups

    var mines = this.array(this.MINE_X);

    for (var y = 0; y < this.rows; y++)
        for (var x = 0; x < this.cols; x++)
            if (this.data[y][x] == this.MINE)
                mines[y][x] = this.MINE_Y;

    var thiss = this;

    function count(x, y)
    {
        var upper = 0;
        var lower = 0;
        var adj = thiss.adjacent(x,y);
        for (var i = 0; i < adj.length; i++) {
            var nx = adj[i][0];
            var ny = adj[i][1];
            if (thiss.data[ny][nx] >= 0)
                continue;
            var n = mines[ny][nx];
            if (n == thiss.MINE_Y)
                lower++;
            if (n != thiss.MINE_N)
                upper++;
        }
        return [lower, upper];
    }

    function check(x, y)
    {
        var adj = thiss.adjacent(x,y);
        for (var i = 0; i < adj.length; i++) {
            var nx = adj[i][0];
            var ny = adj[i][1];
            var n = thiss.data[ny][nx];
            if (n < 0)
                continue;
            var lu = count(nx, ny);
            var l = lu[0];
            var u = lu[1];
            if (n < l || n > u)
                return false;
        }
        return true;
    }

    function merge(ry, rn)
    {
        result = [];
        for (var i = 0; i < ry.length; i++) {
            var y = ry[i];
            var n = rn[i];
            result.push(y == n ? y : thiss.MINE_X);
        }
        return result;
    }

    function guess(group, start)
    {
        if (start >= group.length)
            return [];
        var x = group[start][0];
        var y = group[start][1];
        var r_x, r_y;
        mines[y][x] = thiss.MINE_Y;
        var r_y = check(x,y) ? guess(group, start+1) : null;
        var r_n = null;
        if (thiss.data[y][x] != thiss.MINE) {
            mines[y][x] = thiss.MINE_N;
            r_n = check(x,y) ? guess(group, start+1) : null;
            mines[y][x] = thiss.MINE_X;
        }
        if (r_y != null) {
            if (r_n != null)
                return [thiss.MINE_X].concat(merge(r_y,r_n));
            else
                return [thiss.MINE_Y].concat(r_y);
        }
        else {
            if (r_n != null)
                return [thiss.MINE_N].concat(r_n);
            else
                return null;
        }
    }

    var mines_yn = [];
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        var result = guess(group, 0);
        if (result == null)
            return null;
        for (var j = 0; j < group.length; j++) {
            var r = result[j];
            var x = group[j][0];
            var y = group[j][1];
            if (r != this.MINE_X)
                mines_yn.push([x,y,r]);
        }
    }

    return mines_yn;
};
        
MineSweeper.prototype.do_infer = function()
{
    this.clear_hints();

    var mines_yn = this.infer();
    if (mines_yn == null) {
        this.e_error.classList.toggle("hidden", false);
        return;
    }

    this.e_error.classList.toggle("hidden", true);

    this.hints = this.array(this.MINE_X);

    for (var i = 0; i < mines_yn.length; i++) {
        var m = mines_yn[i];
        var x = m[0];
        var y = m[1];
        var r = m[2];
        this.hints[y][x] = r;
        this.mark(x, y);
    }
};
        
MineSweeper.prototype.clear_hints = function()
{
    this.hints = this.array(this.MINE_X);
    this.mark_all();
};
        
MineSweeper.prototype.do_reset = function()
{
    this.reset();
    this.random();
    this.mark_all();
};
        
MineSweeper.prototype.key_press = function(event)
{
    var key = event.key.toLowerCase();
    if (key == "c")
        this.clear_hints();
    else if (key == "i")
        this.do_infer();
};

MineSweeper.prototype.click = function(event, tx, ty)
{
    if (event.button == 0)
        this.activate(tx, ty);
    else if (event.button == 1) {
        this.flags[ty][tx] = !this.flags[ty][tx];
        this.mark(tx, ty);
    }
};

MineSweeper.prototype.mouse_down = function(x, y, event)
{
    this.click(event, x, y);
};

// ************************************************************

var MineSolver = function(canvas, cols, rows)
{
    MineSweeper.call(this, canvas, cols, rows);

    this.e_paint = {};
    var paint = ["out", "hid", "0", "1", "2", "3", "4", "5", "6", "7", "8", "mine"];
    for (var i = 0; i < paint.length; i++) {
        var name = paint[i];
        this.e_paint[name] = document.getElementById("paint_" + name);
    }

    this.solver = true;
};

MineSolver.prototype = Object.create(MineSweeper.prototype);
MineSolver.prototype.constructor = MineSolver;

MineSolver.prototype.painting = function()
{
    for (var name in this.e_paint)
        if (this.e_paint[name].checked)
            return name.length == 1 ? Number(name) : name;
    return null;
};

MineSolver.prototype.paint = function(x, y)
{
    var painting = this.painting();

    if (painting == null)
        return;
    else if (painting == "out") {
        this.board[y][x] = false;
        this.data[y][x] = this.HIDDEN;
    }
    else if (painting == "hid") {
        this.board[y][x] = true;
        this.data[y][x] = this.HIDDEN;
    }
    else if (painting == "mine") {
        this.board[y][x] = true;
        this.data[y][x] = this.MINE;
    }
    else {
        this.board[y][x] = true;
        this.data[y][x] = painting;
    }
    this.mark(x, y);
};

MineSolver.prototype.set_paint = function(value)
{
    for (var name in this.e_paint)
        this.e_paint[name].checked = (value == ("" + name));
};

MineSolver.prototype.key_press = function(event)
{
    var key = event.key.toLowerCase();

    if (key >= "0" && key <= "8")
        this.set_paint(Number(key));
    else if (key == "o")
        this.set_paint("out");
    else if (key == "h")
        this.set_paint("hid");
    else if (key == "m")
        this.set_paint("mine");
    else
        MineSweeper.prototype.key_press.call(this, event);
};

MineSolver.prototype.click = function(event, tx, ty)
{
    if (event.button == 0)
        this.paint(tx, ty);
};

MineSolver.prototype.load = function(saved)
{
    this.reset();
    for (var y = 0; y < this.rows; y++)
        for (var x = 0; x < this.cols; x++) {
            this.board[y][x] = saved[y][x] > 0;
            this.data[y][x] = saved[y][x] == 2 ? 0 : -1;
        }
    this.mark_all();
};

// ************************************************************

var Launcher = function(cols, rows, num_mines)
{
    this.e_canvas = document.getElementById("canvas");
    this.e_rows  = document.getElementById("rows");
    this.e_cols  = document.getElementById("cols");
    this.e_mines = document.getElementById("mines");
    this.e_play  = document.getElementById("play");
    this.e_solve  = document.getElementById("solve");

    this.e_rows.value = rows;
    this.e_cols.value = cols;
    this.e_mines.value = num_mines;
    this.e_play.checked = true;
};

Launcher.prototype = new Object();
Launcher.prototype.constructor = Launcher;

Launcher.prototype.mode = function()
{
    if (this.e_solve.checked)
        return 'solve';
    if (this.e_play.checked)
        return 'play';
    return null;
};

Launcher.prototype.change_mode = function()
{
    var div = document.getElementById("paint");
    div.style.display = (this.mode() == 'solve') ? "block" : "none";
};

Launcher.prototype.start = function()
{
    var rows = Number(this.e_rows.value);
    var cols = Number(this.e_cols.value);
    var num_mines = Number(this.e_mines.value);

    if (!rows || !cols || !num_mines)
        return;

    var mode = this.mode();
    if (mode == null)
        return;
    if (mode == 'play')
        game = new MineSweeper(this.e_canvas, cols, rows, num_mines);
    if (mode == 'solve')
        game = new MineSolver(this.e_canvas, cols, rows);
    game.setup();
    game.do_reset();
};

Launcher.prototype.load = function()
{
    this.e_solve.checked = true;
    this.e_play.checked = false;
    this.change_mode();

    var rows = saved_game.length;
    var cols = saved_game[0].length;
    this.e_rows.value = '' + rows;
    this.e_cols.value = '' + cols;
    game = new MineSolver(this.e_canvas, cols, rows);
    game.setup();
    game.load(saved_game);
};

// ************************************************************

var launcher = null;
var game = null;

function init(cols, rows, num_mines) {
    launcher = new Launcher(cols, rows, num_mines);
    launcher.start();
};

// ************************************************************

