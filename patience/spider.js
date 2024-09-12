"use strict";

/* ************************************************************ */
/* Game state */
/* ************************************************************ */

var GameState = function(suits)
{
    this.shuffle_count = 10;
    this.deal_count = 54;
    this.suits = suits;
    this.decks = 8 / suits;

    this.stacks = null;
    this.done = null;
    this.deck = null;

    this.save = null;
    this.saves = [];
};

GameState.prototype = new Object();

GameState.prototype.deck_count = function()
{
    return this.deck.length;
};

GameState.prototype.stack_empty = function(stack)
{
    return this.stacks[stack].length == 0;
};

/* mutation */
GameState.prototype.shuffle = function()
{
    var src = this.deck;
    var dst = [];
    while (src.length > 0) {
        var i = Math.floor(Math.random() * src.length);
        dst.push(src[i]);
        src[i] = src[src.length - 1];
        src.pop();
    }
    this.deck = dst;
};

/* mutation */
GameState.prototype.reset = function()
{
    this.stacks = [[],[],[],[],[],[],[],[],[],[]];
    this.done = [null, null, null, null, null, null, null, null];
    this.deck = [];
    for (var i = 0; i < this.decks; i++)
        for (var j = 0; j < this.suits; j++)
            for (var k = 0; k < 13; k++)
                this.deck.push(j * 13 + k);
    for (var i = 0; i < this.shuffle_count; i++)
        this.shuffle();
    for (var i = 0; i < this.deal_count; i++)
        this.stacks[i % 10].push([false, this.deck.pop()]);
    for (var i = 0; i < 10; i++) {
        var stack = this.stacks[i];
        stack[stack.length-1][0] = true;
    }
};

GameState.prototype.check_complete = function(src)
{
    var src_stack = this.stacks[src];

    if (src_stack.length < 13)
        return null;

    var suit = null;

    for (var i = 0; i < 13; i++) {
        var src_item = src_stack[src_stack.length-1-i];
        var src_face = src_item[0];
        var src_id   = src_item[1];
        var src_card = src_id % 13;
        var src_suit = Math.floor(src_id / 13);
        if (suit == null)
            suit = src_suit;
        if (!src_face)
            return null;
        if (src_suit != suit)
            return null;
        if (src_card != i)
            return null;
    }

    return suit;
};

GameState.prototype.find_complete = function()
{
    for (var i = 0; i < 8; i++)
        if (this.done[i] == null)
            return i;

    throw new Error("no space left");
};

/* mutation */
GameState.prototype.move_complete = function(src, dst, suit)
{
    this.save_stack(src);
    this.save_done();

    var src_stack = this.stacks[src];

    this.done[dst] = suit;

    for (var i = 0; i < 13; i++)
        src_stack.pop();

    if (src_stack.length > 0)
        src_stack[src_stack.length-1][0] = true;
};

/* mutation */
GameState.prototype.deal_once = function()
{
    this.save_stacks();
    this.save_deck();

    for (var i = 0; i < 10; i++) {
        var card = this.deck.pop();
        var item = [true, card];
        this.stacks[i].push(item);
    }
};

/* mutation */
GameState.prototype.do_move = function(src, index, dst)
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
    if (src_stack.length > 0 && !src_stack[src_stack.length-1][0])
        src_stack[src_stack.length-1][0] = true;
};

GameState.prototype.can_move = function(src, index, dst)
{
    var src_stack = this.stacks[src];
    var dst_stack = this.stacks[dst];

    if (dst_stack.length > 0) {
        var src_item = src_stack[index];
        var src_id = src_item[1];
        var src_card = src_id % 13;
        var dst_item = dst_stack[dst_stack.length-1];
        var dst_id = dst_item[1];
        var dst_card = dst_id % 13;
        if (src_card != dst_card - 1)
            return false;
    }

    return true;
};

GameState.prototype.valid_run = function(stack, index)
{
    // valid run = consecutive cards of the same suit
    var src_stack = this.stacks[stack];

    var suit = null;
    var card = null;

    for (var i = src_stack.length - 1; i >= index; i--) {
        var src_item = src_stack[i];
        var src_face = src_item[0];
        var src_id   = src_item[1];
        var src_card = src_id % 13;
        var src_suit = Math.floor(src_id / 13);
        if (!src_face) // face down
            return false;
        if (suit != null && src_suit != suit) // different suit
            return false;
        if (card != null && src_card != card + 1) // not consecutive
            return false;

        card = src_card;
        suit = src_suit;
    }

    return true;
};

GameState.prototype.can_deal = function()
{
    if (this.deck.length == 0)
        return false;

    var facedown = false;
    var empty = false;

    for (var i = 0; i < 10; i++) {
        var stack = this.stacks[i];
        var n = stack.length;
        for (var j = 0; j < n; j++) {
            var item = stack[j];
            var face = item[0];
            if (!face) {
                facedown = true;
                break;
            }
        }
        if (n == 0)
            empty = true;
    }

    return !empty || !facedown;
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
    this.save.done = null;
    this.save.deck = null;
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

    for (var i = 0; i < src_stack.length; i++) {
        var item = src_stack[i];
        var face = item[0];
        var id   = item[1];
        dst_stack.push([face, id]);
    }

    this.save.stacks[src] = dst_stack;
};

GameState.prototype.save_stacks = function()
{
    for (var i = 0; i < this.stacks.length; i++)
        this.save_stack(i);
};

GameState.prototype.save_done = function()
{
    this.make_save();

    if (this.save.done != null)
        return;

    var src_done = this.done;
    var dst_done = [];
    for (var i = 0; i < src_done.length; i++)
        dst_done.push(src_done[i]);

    this.save.done = dst_done;
};

GameState.prototype.save_deck = function()
{
    this.make_save();

    if (this.save.deck != null)
        return;

    var src_deck = this.deck;
    var dst_deck = [];
    for (var i = 0; i < src_deck.length; i++)
        dst_deck.push(src_deck[i]);

    this.save.deck = dst_deck;
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
    if (this.save.done != null)
        this.done = this.save.done;
    if (this.save.deck != null)
        this.deck = this.save.deck;

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
    this.suit_names = ["club", "diamond", "heart", "spade"];
    this.card_names = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    this.back_name = "back";
    this.elements = null;
    this.active = null;
    this.shown = null;
    this.state = null;
    this.suits = null;
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

Game.prototype.make_board = function()
{
    var elems = {};
    var board = document.getElementById("board");
    elems.board = board;

    var new_box = document.getElementById("new_game_box");
    elems.new_box = new_box;

    var new_suits = [];
    new_suits[1] = document.getElementById("new_game_suits_1");
    new_suits[2] = document.getElementById("new_game_suits_2");
    new_suits[4] = document.getElementById("new_game_suits_4");
    for (var i = 0; i < new_suits.length; i++) {
        var b = new_suits[i];
        if (b == undefined)
            continue;
        b.onmousedown = this.click_suit.bind(this, i);
    }
    elems.new_suits = new_suits;

    var new_yes = document.getElementById("new_game_yes");
    new_yes.onmousedown = this.click_yes.bind(this);
    elems.new_yes = new_yes;

    var new_no = document.getElementById("new_game_no");
    new_no.onmousedown = this.click_no.bind(this);
    elems.new_no = new_no;
        
    elems.stack = [];
    for (var i = 0; i < 10; i++) {
        var x = i * 250;
        var y = 20;
        var stack = this.make_stack("stack" + i, x, y);
        stack.childNodes[0].onmousedown = this.click_stack.bind(this, i, null);
        board.appendChild(stack);
        elems.stack.push(stack);
    }

    elems.done = [];
    for (var i = 0; i < 8; i++) {
        var x = i * 250;
        var y = 1200;
        var stack = this.make_stack("done" + i, x, y);
        board.appendChild(stack);
        elems.done.push(stack);
    }

    var deck = this.make_stack("deck", 2250, 1200);
    deck.onmousedown = this.click_deck.bind(this);
    board.appendChild(deck);
    elems.deck = deck;

    var base = document.getElementById("marker_rect");
    elems.marker_base = base;
    var marker = base.cloneNode(true);
    marker.setAttribute("id", "marker");
    marker.setAttribute("transform", "");
    marker.onmousedown = this.click_marker.bind(this);
    elems.marker = marker;

    var undo = document.getElementById("undo_button");
    undo.onmousedown = this.click_undo.bind(this);
    elems.undo = undo;

    var newgame = document.getElementById("new_button");
    newgame.onmousedown = this.click_new.bind(this);
    elems.newgame = newgame;

    this.elements = elems;
};

Game.prototype.deal_once = function()
{
    this.state.deal_once();
    for (var i = 0; i < 10; i++) {
        this.check_complete(i);
        this.sync_stack(i);
    }
    this.sync_deck();
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
        var name = null;
        var face = stack[i][0];
        if (face) {
            var which = stack[i][1];
            var suit = Math.floor(which / 13);
            var card = which % 13;
            name = this.suit_names[suit] + "_" + this.card_names[card];
        }
        else
            name = this.back_name;
        var child = document.createElementNS(this.svg_ns, "use");
	child.setAttributeNS(this.xlink_ns, "href", this.cards_doc + "#" + name);
        child.setAttribute("transform", "translate(" + 0 + "," + y + ")");
        child.onmousedown = this.click_stack.bind(this, id, i);
        group.appendChild(child);
        y += (i == shown) ? 80 : dy;
    }
};

Game.prototype.sync_done = function(id)
{
    var suit = this.state.done[id];
    var group = this.elements.done[id];

    while (group.childNodes.length > 1)
        group.childNodes[1].remove();

    if (suit != null) {
        var name = this.suit_names[suit] + "_" + this.card_names[0];
        var child = document.createElementNS(this.svg_ns, "use");
	child.setAttributeNS(this.xlink_ns, "href", this.cards_doc + "#" + name);
        group.appendChild(child);
    }
};

Game.prototype.sync_deck = function()
{
    var group = this.elements.deck;

    while (group.childNodes.length > 1)
        group.childNodes[1].remove();

    var count = this.state.deck_count() / 10;
    var name = this.back_name;

    for (var i = 0; i < count; i++) {
        var x = i * 10;
        var child = document.createElementNS(this.svg_ns, "use");
	child.setAttributeNS(this.xlink_ns, "href", this.cards_doc + "#" + name);
        child.setAttribute("transform", "translate(" + x + "," + 0 + ")");
        group.appendChild(child);
    }
};

Game.prototype.sync_all = function()
{
    for (var i = 0; i < 10; i++)
        this.sync_stack(i);
    for (var i = 0; i < 8; i++)
        this.sync_done(i);
    this.sync_deck();
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
    if (this.active == null) {
        if (this.elements.board.contains(this.elements.marker))
            this.elements.board.removeChild(this.elements.marker);
    }
    else {
        var board = this.elements.board;
        var group = this.elements.stack[this.active];
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
};

Game.prototype.beep = function()
{
    var snd = new Audio(this.beep_uri);
    snd.play();
};

Game.prototype.check_complete = function(src)
{
    var suit = this.state.check_complete(src);
    if (suit == null)
        return;

    var dst = this.state.find_complete();

    this.state.move_complete(src, dst, suit);
    
    this.sync_done(dst);
};

Game.prototype.do_move = function(src, dst)
{
    this.state.do_move(src, this.index, dst);
    this.check_complete(dst);
    this.sync_stack(src);
    this.sync_stack(dst);
};

Game.prototype.try_move = function(src, dst)
{
    if (this.state.can_move(src, this.index, dst))
        this.do_move(src, dst);
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

Game.prototype.select_stack = function(stack, index, event)
{
    this.clear_shown();

    if (this.active != stack && this.active != null) {
        this.try_move(this.active, stack);
        this.active = null;
        this.index = null;
    }
    else if (this.state.stack_empty(stack)) {
        this.beep();
        this.active = null;
        this.index = null;
    }
    else if (this.state.valid_run(stack, index)) {
        this.active = stack;
        this.index = index;
    }
    else {
        this.beep();
        this.active = null;
        this.index = null;
    }
    
    this.highlight_stack();
};

Game.prototype.show_stack = function(stack, index, event)
{
    this.active = null;
    this.index = null;
    this.highlight_stack();

    var prev = this.shown;
    this.clear_shown();

    if (prev != null && prev[0] == stack && prev[1] == index)
        return;

    this.shown = [stack, index];
    this.sync_stack(stack);
};

Game.prototype.undo = function()
{
    if (!this.state.undo())
        this.beep();
};

Game.prototype.click_stack = function(stack, index, event)
{
    this.state.begin_save();

    if ((event.button == 0 && event.shiftKey) || event.button == 1)
        this.show_stack(stack, index, event);
    else if (event.button == 0)
        this.select_stack(stack, index, event);
};

Game.prototype.click_deck = function(event)
{
    this.state.begin_save();

    if (event.button != 0)
        return;

    this.clear_shown();

    this.active = null;
    this.highlight_stack();

    if (this.state.deck_count() == 0) {
        this.beep();
        window.alert("No cards left");
        return;
    }

    if (!this.state.can_deal()) {
        this.beep();
        window.alert("Fill empty slots first");
        return;
    }

    this.deal_once();
};

Game.prototype.click_marker = function(event)
{
    if (event.button != 0)
        return;

    this.clear_shown();

    this.active = null;
    this.highlight_stack();
};

Game.prototype.click_undo = function(event)
{
    if (event.button != 0)
        return;

    this.clear_shown();

    this.active = null;
    this.highlight_stack();

    this.undo();
    this.sync_all();
};

Game.prototype.click_new = function(event)
{
    if (event.button != 0)
        return;

    this.clear_shown();

    this.active = null;
    this.highlight_stack();

    this.elements.new_box.style.setProperty("display", "block");
    this.set_suits(this.state.suits);
};

Game.prototype.new_game = function(event)
{
    this.state = new GameState(this.suits);
    this.state.reset();
    this.sync_all();
};

Game.prototype.set_suits = function(id)
{
    this.suits = id;

    for (var i = 0; i < this.elements.new_suits.length; i++) {
        var b = this.elements.new_suits[i];
        if (b == undefined)
            continue;
        b.style.setProperty("fill", i == id ? "#ffff00" : "#ffffff");
    }
};

Game.prototype.click_suit = function(id, event)
{
    if (event.button != 0)
        return;

    this.set_suits(id);
};

Game.prototype.click_yes = function(event)
{
    if (event.button != 0)
        return;

    this.elements.new_box.style.setProperty("display", "none");
    this.new_game();
};

Game.prototype.click_no = function(event)
{
    if (event.button != 0)
        return;

    this.elements.new_box.style.setProperty("display", "none");
};

var game = null;

function startup(evt)
{
    var ease = 0;
    var uri = document.baseURI;
    if (uri != null) {
        var frag = uri.split("#");
        if (frag.length > 1) {
            var tail = frag[1].split("=");
            if (tail.length > 1 && tail[0] == "ease")
                ease = Number(tail[1]);
        }
    }
    game = new Game();
    game.make_board();
    game.state = new GameState(4 >> ease);
    game.state.reset();
    game.sync_all();
}
