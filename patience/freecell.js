"use strict";

/* ************************************************************ */
/* Game state */
/* ************************************************************ */

var GameState = function()
{
    this.shuffle_count = 10;

    this.stacks = null;
    this.done   = null;
    this.free   = null;

    this.save = null;
    this.saves = [];
};

GameState.prototype = new Object();

GameState.prototype.stack_empty = function(stack)
{
    return this.stacks[stack].length == 0;
};

GameState.prototype.free_empty = function(free)
{
    return this.free[free] == null;
};

/* mutation */
GameState.prototype.shuffle = function(src)
{
    var dst = [];
    while (src.length > 0) {
        var i = Math.floor(Math.random() * src.length);
        dst.push(src[i]);
        src[i] = src[src.length - 1];
        src.pop();
    }
    return dst;
};

/* mutation */
GameState.prototype.reset = function()
{
    this.stacks = [[],[],[],[],[],[],[],[]];
    this.done   = [[], [], [], []];
    this.free   = [null, null, null, null];

    var deck = [];
    for (var j = 0; j < 4; j++)
        for (var k = 0; k < 13; k++)
            deck.push(j * 13 + k);

    for (var i = 0; i < this.shuffle_count; i++)
        deck = this.shuffle(deck);

    for (var i = 0; i < 52; i++)
        this.stacks[i % 8].push(deck.pop());
};

/* mutation */
GameState.prototype.do_move_stack_stack = function(src, index, dst)
{
    this.save_stack(src);
    this.save_stack(dst);

    var src_stack = this.stacks[src];
    var dst_stack = this.stacks[dst];
    var tmp_stack = [];
    while (src_stack.length > index)
        tmp_stack.push(src_stack.pop());
    while (tmp_stack.length > 0)
        dst_stack.push(tmp_stack.pop());
};

/* mutation */
GameState.prototype.do_move_stack_done = function(src, dst)
{
    this.save_stack(src);
    this.save_done(dst);

    var src_stack = this.stacks[src];
    var dst_done = this.done[dst];
    dst_done.push(src_stack.pop());
};

/* mutation */
GameState.prototype.do_move_stack_free = function(src, dst)
{
    this.save_stack(src);
    this.save_free();

    var src_stack = this.stacks[src];

    this.free[dst] = src_stack.pop();
};

/* mutation */
GameState.prototype.do_move_free_stack = function(src, dst)
{
    this.save_free();
    this.save_stack(dst);

    var dst_stack = this.stacks[dst];
    dst_stack.push(this.free[src]);
    this.free[src] = null;
};

/* mutation */
GameState.prototype.do_move_free_done = function(src, dst)
{
    this.save_free();
    this.save_done(dst);

    var dst_done = this.done[dst];
    dst_done.push(this.free[src]);
    this.free[src] = null;
};

/* mutation */
GameState.prototype.do_move_free_free = function(src, dst)
{
    this.save_free();

    this.free[dst] = this.free[src];
    this.free[src] = null;
};

GameState.prototype.enough_space = function(n, dst)
{
    var nfree = 0;
    for (var i = 0; i < 4; i++)
        if (this.free[i] == null)
            nfree++;

    var nstacks = 0;
    for (var i = 0; i < 8; i++)
        if (i != dst && this.stacks[i].length == 0)
            nstacks++;

    return n <= (nfree + 1) * (nstacks + 1);
};

GameState.prototype.find_free = function()
{
    for (var i = 0; i < 4; i++)
        if (this.free[i] == null)
            return i;

    return null;
};

GameState.prototype.can_move_stack_stack = function(src, index, dst)
{
    var src_stack = this.stacks[src];
    var dst_stack = this.stacks[dst];

    if (!this.enough_space(src_stack.length - index, dst))
        return false;

    if (dst_stack.length == 0)
        return true;
    
    var src_id = src_stack[index];
    var src_card = src_id % 13;
    var src_suit = Math.floor(src_id / 13);
    var dst_id = dst_stack[dst_stack.length-1];
    var dst_card = dst_id % 13;
    var dst_suit = Math.floor(dst_id / 13);
    if (src_card != dst_card - 1)
        return false;
    if (src_suit % 2 == dst_suit % 2)
        return false;

    return true;
};

GameState.prototype.can_move_stack_done = function(src, index, dst)
{
    var src_stack = this.stacks[src];
    var dst_done = this.done[dst];

    if (index != src_stack.length-1)
        return false;

    var src_id = src_stack[index];
    var src_card = src_id % 13;
    var src_suit = Math.floor(src_id / 13);
    if (src_suit != dst)
        return false;
    var dst_id = dst_done[dst_done.length-1];
    if (dst_id == null)
        return src_card == 0;
    var dst_card = dst_id % 13;

    return src_card == dst_card + 1;
};

GameState.prototype.can_move_free_stack = function(src, dst)
{
    var dst_stack = this.stacks[dst];

    if (dst_stack.length == 0)
        return true;

    var src_id = this.free[src];
    var src_card = src_id % 13;
    var src_suit = Math.floor(src_id / 13);

    var dst_id = dst_stack[dst_stack.length-1];
    var dst_card = dst_id % 13;
    var dst_suit = Math.floor(dst_id / 13);

    if (src_card != dst_card - 1)
        return false;

    if (src_suit % 2 == dst_suit % 2)
        return false;

    return true;
};

GameState.prototype.can_move_free_free = function(src, dst)
{
    if (this.free[src] == null)
        return false;

    if (this.free[dst] != null)
        return false;

    return true;
};

GameState.prototype.can_move_free_done = function(src, dst)
{
    var src_id = this.free[src];
    if (src_id == null)
        return false;
    var src_card = src_id % 13;
    var src_suit = Math.floor(src_id / 13);
    if (src_suit != dst)
        return false;

    var dst_done = this.done[dst];
    var dst_id = dst_done[dst_done.length-1];
    if (dst_id == null)
        return src_card == 0;
    var dst_card = dst_id % 13;

    return src_card == dst_card + 1;
};

GameState.prototype.can_move_stack_free = function(src, index, dst)
{
    var src_stack = this.stacks[src];
    var dst_free = this.free[dst];

    if (index != src_stack.length-1)
        return false;

    if (dst_free != null)
        return false;

    return true;
};

GameState.prototype.can_move_stack_auto = function(src, index)
{
    var src_stack = this.stacks[src];

    if (index != src_stack.length-1)
        return null;

    return this.find_free();
};

GameState.prototype.valid_run = function(stack, index)
{
    // valid run = consecutive cards of alternating suits
    var src_stack = this.stacks[stack];

    var prev_suit = null;
    var prev_card = null;

    for (var i = src_stack.length - 1; i >= index; i--) {
        var src_id = src_stack[i];
        var src_card = src_id % 13;
        var src_suit = Math.floor(src_id / 13);

        if (prev_suit != null && src_suit % 2 == prev_suit % 2) // same colour
            return false;

        if (prev_card != null && src_card != prev_card + 1) // not consecutive
            return false;

        prev_card = src_card;
        prev_suit = src_suit;
    }

    return true;
};

GameState.prototype.begin_save = function()
{
    if (this.save != null) {
        this.saves.push(this.save);
        this.save = null;
    }
};

GameState.prototype.make_save = function()
{
    if (this.save != null)
        return;

    this.save = {};
    this.save.stacks = null;
    this.save.done   = null;
    this.save.free   = null;
};

GameState.prototype.save_stack = function(src)
{
    this.make_save();

    if (this.save.stacks == null) {
        this.save.stacks = [];
        for (var i = 0; i < this.stacks.length; i++)
            this.save.stacks.push(null);
    }

    if (this.save.stacks[src] != null)
        return;
    
    var src_stack = this.stacks[src];
    var dst_stack = [];

    for (var i = 0; i < src_stack.length; i++)
        dst_stack.push(src_stack[i]);

    this.save.stacks[src] = dst_stack;
};

GameState.prototype.save_done = function(src)
{
    this.make_save();

    if (this.save.done == null) {
        this.save.done = [];
        for (var i = 0; i < this.done.length; i++)
            this.save.done.push(null);
    }

    if (this.save.done[src] != null)
        return;
    
    var src_done = this.done[src];
    var dst_done = [];

    for (var i = 0; i < src_done.length; i++)
        dst_done.push(src_done[i]);

    this.save.done[src] = dst_done;
};

GameState.prototype.save_free = function()
{
    this.make_save();

    if (this.save.free != null)
        return;

    var src_free = this.free;
    var dst_free = [];
    for (var i = 0; i < src_free.length; i++)
        dst_free.push(src_free[i]);

    this.save.free = dst_free;
};

GameState.prototype.check_ready = function()
{
    var next = [0, 0, 0, 0];
    for (var i = 0; i < 4; i++) {
        var done = this.done[i];
        if (done.length == 0)
            continue;
        var id = done[done.length-1];
        var card = id % 13;
        next[i] = card + 1;
    }

    for (var i = 0; i < 8; i++) {
        var stack = this.stacks[i];
        if (stack.length == 0)
            continue;
        var id = stack[stack.length-1];
        var card = id % 13;
        var suit = Math.floor(id / 13);
        if (card > next[suit])
            continue;
        var c = card - 1;
        var c0 = next[(suit+1)%4];
        var c1 = next[(suit+3)%4];
        if (c0 >= c && c1 >= c)
            return [false, i, suit];
    }

    for (var i = 0; i < 4; i++) {
        var id = this.free[i];
        if (id == null)
            continue;
        var card = id % 13;
        var suit = Math.floor(id / 13);
        if (card > next[suit])
            continue;
        var c = card - 1;
        var c0 = next[(suit+1)%4];
        var c1 = next[(suit+3)%4];
        if (c0 >= c && c1 >= c)
            return [true, i, suit];
    }

    return null;
};

GameState.prototype.undo = function()
{
    if (this.save == null) {
        if (this.saves.length == 0)
            return false;
        this.save = this.saves.pop();
    }

    if (this.save.stacks != null) {
        for (var i = 0; i < this.save.stacks.length; i++)
            if (this.save.stacks[i] != null)
                this.stacks[i] = this.save.stacks[i];
    }
    if (this.save.done != null) {
        for (var i = 0; i < this.save.done.length; i++)
            if (this.save.done[i] != null)
                this.done[i] = this.save.done[i];
    }
    if (this.save.free != null)
        this.free = this.save.free;

    this.save = null;

    return true;
};

/* ************************************************************ */
/* UI */
/* ************************************************************ */

var Game = function()
{
    this.svg_ns = "http://www.w3.org/2000/svg";
    this.xlink_ns = "http://www.w3.org/1999/xlink";
    this.cards_doc = "cards.svg";
    this.beep_uri = "beep.mp3";
    this.suit_names = ["heart", "club", "diamond", "spade"];
    this.card_names = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    this.back_name = "back";
    this.elements = null;
    this.active_s = null;
    this.active_f = null;
    this.shown = null;
    this.state = null;
};

Game.prototype = new Object();

Game.prototype.make_stack = function(name, x, y)
{
    var stack = document.createElementNS(this.svg_ns, "g");
    stack.setAttribute("id", name);
    stack.setAttribute("transform", "translate(" + x + "," + y + ")");

    var base = document.createElementNS(this.svg_ns, "use");
    base.setAttribute("id", name + "_base");
    base.setAttributeNS(this.xlink_ns, "href", this.cards_doc + "#border");

    stack.appendChild(base);

    return stack;
};

Game.prototype.make_suit = function(stack, name)
{
    // var border = stack.childNodes[0];
    stack.appendChild(suit);
};

Game.prototype.make_done = function(name, x, y, id)
{
    var stack = document.createElementNS(this.svg_ns, "g");
    stack.setAttribute("id", name);
    stack.setAttribute("transform", "translate(" + x + "," + y + ")");

    var border = document.createElementNS(this.svg_ns, "use");
    border.setAttribute("id", name + "_border");
    border.setAttributeNS(this.xlink_ns, "href", this.cards_doc + "#border");

    var w = 200; // border.instanceRoot.width;
    var h = 310; // border.instanceRoot.height;
    var suit_name = this.suit_names[id];
    var suit = document.createElementNS(this.svg_ns, "use");
    suit.setAttribute("id", "suit_" + suit_name);
    suit.setAttributeNS(this.xlink_ns, "href", this.cards_doc + "#" + suit_name);
    suit.setAttribute("transform", "translate(" + w/2 + "," + h/2 + ")");

    var base = document.createElementNS(this.svg_ns, "g");
    base.setAttribute("id", name + "_base");
    base.appendChild(border);
    base.appendChild(suit);

    stack.appendChild(base);

    return stack;
};

Game.prototype.make_board = function()
{
    var elems = {};
    var board = document.getElementById("board");
    elems.board = board;

    var new_box = document.getElementById("new_game_box");
    elems.new_box = new_box;

    var new_yes = document.getElementById("new_game_yes");
    new_yes.onclick = this.click_yes.bind(this);
    elems.new_yes = new_yes;

    var new_no = document.getElementById("new_game_no");
    new_no.onclick = this.click_no.bind(this);
    elems.new_no = new_no;
        
    elems.stack = [];
    for (var i = 0; i < 8; i++) {
        var x = i * 250;
        var y = 400;
        var stack = this.make_stack("stack" + i, x, y);
        stack.childNodes[0].onmousedown = this.click_stack.bind(this, i, null);
        stack.childNodes[0].ondblclick = this.dbl_click_stack.bind(this, i, null);
        board.appendChild(stack);
        elems.stack.push(stack);
    }

    elems.done = [];
    for (var i = 0; i < 4; i++) {
        var x = 1250 + i * 250;
        var y = 20;
        var stack = this.make_done("done" + i, x, y, i);
        stack.childNodes[0].onmousedown = this.click_done.bind(this, i);
        board.appendChild(stack);
        elems.done.push(stack);
    }

    elems.free = [];
    for (var i = 0; i < 4; i++) {
        var x = i * 250;
        var y = 20;
        var stack = this.make_stack("free" + i, x, y);
        stack.childNodes[0].onmousedown = this.click_free.bind(this, i);
        board.appendChild(stack);
        elems.free.push(stack);
    }

    var base = document.getElementById("marker_rect");
    elems.marker_base = base;
    var marker = base.cloneNode(true);
    marker.setAttribute("id", "marker");
    marker.setAttribute("transform", "");
    elems.marker = marker;

    var undo = document.getElementById("undo_button");
    undo.onclick = this.click_undo.bind(this);
    elems.undo = undo;

    var newgame = document.getElementById("new_button");
    newgame.onclick = this.click_new.bind(this);
    elems.newgame = newgame;

    this.elements = elems;
};

Game.prototype.sync_stack = function(id)
{
    var stack = this.state.stacks[id];
    var group = this.elements.stack[id];

    while (group.childNodes.length > 1)
        group.childNodes[1].remove();

    var shown = (this.shown != null && this.shown[0] == id) ? this.shown[1] : null;

    var dy = Math.min(50, 750 / stack.length);
    var y = 0;

    for (var i = 0; i < stack.length; i++) {
        var which = stack[i];
        var suit = Math.floor(which / 13);
        var card = which % 13;
        var name = this.suit_names[suit] + "_" + this.card_names[card];
        var child = document.createElementNS(this.svg_ns, "use");
	child.setAttributeNS(this.xlink_ns, "href", this.cards_doc + "#" + name);
        child.setAttribute("transform", "translate(" + 0 + "," + y + ")");
        child.onmousedown = this.click_stack.bind(this, id, i);
        child.ondblclick = this.dbl_click_stack.bind(this, id, i);
        group.appendChild(child);
        y += (i == shown) ? 80 : dy;
    }
};

Game.prototype.sync_done = function(id)
{
    var done = this.state.done[id];
    var group = this.elements.done[id];

    while (group.childNodes.length > 1)
        group.childNodes[1].remove();

    if (done.length > 0) {
        var which = done[done.length-1];
        var suit = Math.floor(which / 13);
        var card = which % 13;
        var name = this.suit_names[suit] + "_" + this.card_names[card];
        var child = document.createElementNS(this.svg_ns, "use");
	child.setAttributeNS(this.xlink_ns, "href", this.cards_doc + "#" + name);
        child.onmousedown = this.click_done.bind(this, id);
        group.appendChild(child);
    }
};

Game.prototype.sync_free = function(id)
{
    var free = this.state.free[id];
    var group = this.elements.free[id];

    while (group.childNodes.length > 1)
        group.childNodes[1].remove();

    if (free != null) {
        var suit = Math.floor(free / 13);
        var card = free % 13;
        var name = this.suit_names[suit] + "_" + this.card_names[card];
        var child = document.createElementNS(this.svg_ns, "use");
	child.setAttributeNS(this.xlink_ns, "href", this.cards_doc + "#" + name);
        child.onmousedown = this.click_free.bind(this, id);
        group.appendChild(child);
    }
};

Game.prototype.sync_all = function()
{
    for (var i = 0; i < 8; i++)
        this.sync_stack(i);
    for (var i = 0; i < 4; i++)
        this.sync_done(i);
    for (var i = 0; i < 4; i++)
        this.sync_free(i);
};

Game.prototype.set_transform = function(elem, m)
{
    var xforms = elem.transform.baseVal;
    var xform = xforms.createSVGTransformFromMatrix(m);
    xforms.initialize(xform);
};

Game.prototype.getTransformToElement = function(src, dst)
{
    return dst.getScreenCTM().inverse().multiply(src.getScreenCTM());
};

Game.prototype.highlight_stack = function()
{
    if (this.active_s != null) {
        var board = this.elements.board;
        var group = this.elements.stack[this.active_s];
        var child0 = group.childNodes[this.index+1];
        var child1 = group.childNodes[group.childNodes.length-1];
        var cx0 = this.getTransformToElement(child0, board);
        var cx1 = this.getTransformToElement(child1, board);
        var extend = cx1.f - cx0.f;
        var marker = this.elements.marker;
        var base = this.elements.marker_base;
        marker.height.baseVal.value = base.height.baseVal.value + extend;
        this.set_transform(marker, cx0);
        this.elements.board.appendChild(marker);
    }
    else if (this.active_f != null) {
        var board = this.elements.board;
        var group = this.elements.free[this.active_f];
        var child = group.childNodes[0];
        var cx = child.getTransformToElement(board);
        var marker = this.elements.marker;
        var base = this.elements.marker_base;
        marker.height.baseVal.value = base.height.baseVal.value;
        this.set_transform(marker, cx);
        this.elements.board.appendChild(marker);
    }
    else {
        if (this.elements.board.contains(this.elements.marker))
            this.elements.board.removeChild(this.elements.marker);
    }
};

Game.prototype.beep = function()
{
    var snd = new Audio(this.beep_uri);
    snd.play();
};

Game.prototype.select_none = function()
{
    this.active_s = null;
    this.active_f = null;
    this.index = null;
};

Game.prototype.select_stack = function(stack, index)
{
    this.active_s = stack;
    this.active_f = null;
    this.index = index;
};

Game.prototype.select_free = function(free)
{
    this.active_f = free;
    this.active_s = null;
    this.index = null;
};

Game.prototype.check_ready = function()
{
    var ready = this.state.check_ready();
    if (ready == null)
            return;
    var free = ready[0];
    var src = ready[1];
    var dst = ready[2];
    if (free) {
        this.state.do_move_free_done(src, dst);
        this.sync_free(src);
        this.sync_done(dst);
    }
    else {
        this.state.do_move_stack_done(src, dst);
        this.sync_stack(src);
        this.sync_done(dst);
    }
    window.setTimeout(this.check_ready.bind(this), 50);
};

Game.prototype.do_move_stack_stack = function(src, dst)
{
    this.state.do_move_stack_stack(src, this.index, dst);
    this.check_ready();
    this.sync_stack(src);
    this.sync_stack(dst);
};

Game.prototype.do_move_stack_done = function(src, dst)
{
    this.state.do_move_stack_done(src, dst);
    this.check_ready();
    this.sync_stack(src);
    this.sync_done(dst);
};

Game.prototype.do_move_stack_free = function(src, dst)
{
    this.state.do_move_stack_free(src, dst);
    this.check_ready();
    this.sync_stack(src);
    this.sync_free(dst);
};

Game.prototype.do_move_free_stack = function(src, dst)
{
    this.state.do_move_free_stack(src, dst);
    this.check_ready();
    this.sync_free(src);
    this.sync_stack(dst);
};

Game.prototype.do_move_free_done = function(src, dst)
{
    this.state.do_move_free_done(src, dst);
    this.check_ready();
    this.sync_free(src);
    this.sync_done(dst);
};

Game.prototype.do_move_free_free = function(src, dst)
{
    this.state.do_move_free_free(src, dst);
    this.check_ready();
    this.sync_free(src);
    this.sync_free(dst);
};

Game.prototype.try_move_stack_stack = function(src, dst)
{
    if (this.state.can_move_stack_stack(src, this.index, dst))
        this.do_move_stack_stack(src, dst);
    else
        this.beep();
};

Game.prototype.try_move_stack_done = function(src, dst)
{
    if (this.state.can_move_stack_done(src, this.index, dst))
        this.do_move_stack_done(src, dst);
    else
        this.beep();
};

Game.prototype.try_move_stack_free = function(src, dst)
{
    if (this.state.can_move_stack_free(src, this.index, dst))
        this.do_move_stack_free(src, dst);
    else
        this.beep();
};

Game.prototype.try_move_free_stack = function(src, dst)
{
    if (this.state.can_move_free_stack(src, dst))
        this.do_move_free_stack(src, dst);
    else
        this.beep();
};

Game.prototype.try_move_free_done = function(src, dst)
{
    if (this.state.can_move_free_done(src, dst))
        this.do_move_free_done(src, dst);
    else
        this.beep();
};

Game.prototype.try_move_free_free = function(src, dst)
{
    if (this.state.can_move_free_free(src, dst))
        this.do_move_free_free(src, dst);
    else
        this.beep();
};

Game.prototype.try_move_stack_auto = function(src, index)
{
    var free = this.state.can_move_stack_auto(src, index);
    if (free != null)
        this.do_move_stack_free(src, free);
    else
        this.beep();
};

Game.prototype.clear_shown = function()
{
    if (this.shown == null)
        return;
    var shown = this.shown[0];
    this.shown = null;
    this.sync_stack(shown);
};

Game.prototype.show_stack = function(stack, index, event)
{
    this.select_none();
    this.highlight_stack();

    var prev = this.shown;
    this.clear_shown();

    if (prev != null && prev[0] == stack && prev[1] == index)
        return;

    this.shown = [stack, index];
    this.sync_stack(stack);
};

Game.prototype.click_stack = function(stack, index, event)
{
    if ((event.button == 0 && event.shiftKey) || event.button == 1) {
        event.preventDefault();
        event.stopPropagation();
        return this.show_stack(stack, index, event);
    }

    if (event.button != 0)
        return;

    event.preventDefault();
    event.stopPropagation();

    this.state.begin_save();

    this.clear_shown();

    if (this.active_s != stack && this.active_s != null) {
        this.try_move_stack_stack(this.active_s, stack);
        this.select_none();
    }
    else if (this.active_s == stack && this.index == index) {
        this.select_none();
    }
    else if (this.active_f != null) {
        this.try_move_free_stack(this.active_f, stack);
        this.select_none();
    }
    else if (this.state.stack_empty(stack)) {
        this.beep();
        this.select_none();
    }
    else if (this.state.valid_run(stack, index)) {
        this.select_stack(stack, index);
    }
    else {
        this.beep();
        this.select_none();
    }
    
    this.highlight_stack();
};

Game.prototype.dbl_click_stack = function(stack, index, event)
{
    if (event.button != 0)
        return;

    event.preventDefault();
    event.stopPropagation();

    this.state.begin_save();

    this.clear_shown();

    this.try_move_stack_auto(stack, index);

    this.select_none();

    this.highlight_stack();
};

Game.prototype.click_done = function(done, event)
{
    if (event.button != 0)
        return;

    event.preventDefault();
    event.stopPropagation();

    if (this.active_s == null && this.active_f == null)
        return;

    this.state.begin_save();

    this.clear_shown();

    if (this.active_s != null)
        this.try_move_stack_done(this.active_s, done);
    else if (this.active_f != null)
        this.try_move_free_done(this.active_f, done);
    
    this.select_none();
    this.highlight_stack();
};

Game.prototype.click_free = function(free, event)
{
    if (event.button != 0)
        return;

    event.preventDefault();
    event.stopPropagation();

    this.state.begin_save();

    this.clear_shown();

    if (this.active_s != null) {
        this.try_move_stack_free(this.active_s, free);
        this.select_none();
    }
    else if (this.active_f == free) {
        this.select_none();
    }
    else if (this.active_f != null) {
        this.try_move_free_free(this.active_f, free);
        this.select_none();
    }
    else if (!this.state.free_empty(free)) {
        this.select_free(free);
    }
    else {
        this.beep();
        this.select_none();
    }

    this.highlight_stack();
};

Game.prototype.undo = function()
{
    if (!this.state.undo())
        this.beep();
};

Game.prototype.click_undo = function(event)
{
    if (event.button != 0)
        return;

    event.preventDefault();
    event.stopPropagation();

    this.clear_shown();

    this.select_none();
    this.highlight_stack();

    this.undo();
    this.sync_all();
};

Game.prototype.click_new = function(event)
{
    if (event.button != 0)
        return;

    event.preventDefault();
    event.stopPropagation();

    this.clear_shown();

    this.select_none();
    this.highlight_stack();

    this.elements.new_box.style.setProperty("display", "block");
};

Game.prototype.new_game = function(event)
{
    this.state = new GameState();
    this.state.reset();
    this.sync_all();
};

Game.prototype.click_yes = function(event)
{
    if (event.button != 0)
        return;

    event.preventDefault();
    event.stopPropagation();

    this.elements.new_box.style.setProperty("display", "none");
    this.new_game();
};

Game.prototype.click_no = function(event)
{
    if (event.button != 0)
        return;

    event.preventDefault();
    event.stopPropagation();

    this.elements.new_box.style.setProperty("display", "none");
};

var game = null;

function startup(evt)
{
    game = new Game();
    game.make_board();
    game.state = new GameState();
    game.state.reset();
    game.sync_all();
}

