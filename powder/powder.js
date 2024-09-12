"use strict";

var names = ["Broken", "Basic", "Glossy", "Sparkling", "Perfect"];
var colors = [
    [0xe0,0xe0,0xe0],
    [0xff,0xff,0xff],
    [0xc0,0xff,0xc0],
    [0xff,0xe0,0xc0],
    [0xff,0xff,0xc0]];

var inputs = [null];
var powers = [null];
var mode = null;
var base = null;

var radio_value = null;
var radio_amount = null;

function update_values(ignore)
{
    for (var level = 1; level <= 20; level++) {
	for (var quality = 0; quality < names.length; quality++) {
	    var elem = inputs[level][quality];
	    if (elem == ignore)
		continue;
	    var scale = powers[level][quality];
	    var value = (mode == "value" ? base * scale : base / scale);
	    elem.value = value;
	}
    }
}

function handle_input(elem, level, quality, event)
{
    var value = Number(elem.value);
    var scale = powers[level][quality];
    base = (mode == "value" ? value / scale : value * scale);
    update_values(elem);
}

function handle_click(elem, level, quality, event)
{
    elem.select()
}

function mode_changed()
{
    var newmode = radio_value.checked ? "value" : "amount";
    if (newmode != mode)
	base = 1 / base;
    mode = newmode;
    update_values(null);
}

function lighten(color)
{
    var result = [];
    for (var i = 0; i < color.length; i++) {
	var x = color[i];
	x = 128 + Math.floor(x / 2);
	result.push(x);
    }
    return result;
}

function color_string(color)
{
    var x = (1<<24) + (color[0] << 16) + (color[1] << 8) + color[2];
    var s = x.toString(16).substr(1);
    return "#" + s;
}

function init()
{
    var table = document.getElementById("table");
    for (var level = 1; level <= 20; level++) {
	var row = document.createElement("tr");
	row.id = "row_" + level;
	var lvl = document.createElement("td");
	row.id = "level_" + level;
	var txt = document.createTextNode("" + level);
	lvl.appendChild(txt);
	row.appendChild(lvl);
	var inputs_row = [];
	var powers_row = [];
	for (var quality = 0; quality < names.length; quality++) {
	    powers_row.push(Math.pow(2, level + quality));
	    var name = names[quality];
	    var cell = document.createElement("td");
	    cell.id = "cell_" + level + "_" + name;
	    var inp = document.createElement("input");
	    inputs_row.push(inp);
	    inp.id = "input_" + level + "_" + name;
	    inp.size = 10;
	    inp.inputmode = "numeric";
	    var color = colors[quality];
	    cell.style.background = color_string(color);
	    cell.style.padding = "3px";
	    inp.oninput = handle_input.bind(null,inp,level,quality);
	    inp.onclick = handle_click.bind(null,inp,level,quality);
	    cell.appendChild(inp);
	    row.appendChild(cell);
	}
	powers.push(powers_row);
	inputs.push(inputs_row);
	table.appendChild(row);
    }

    radio_value = document.getElementById("value");
    radio_amount = document.getElementById("amount");
    mode = radio_value.checked ? "value" : "amount";
    base = (mode == "value") ? 1/4096 : 4096;
    update_values(null);
}
