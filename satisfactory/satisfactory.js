"use strict";

var Factory = function()
{
    this.svg_ns = "http://www.w3.org/2000/svg";
    this.xlink_ns = "http://www.w3.org/1999/xlink";
    this.canvas = null;
    this.recipes_fwd = null;
    this.recipes_rev = null;
    this.products = null;
};

Factory.prototype = new Object();

Factory.prototype.init = function(recipes)
{
    this.canvas = document.getElementById("canvas");
    this.recipes_fwd = recipes;
    this.products = Object.keys(recipes);
    this.recipes_rev = {};
    for (var i = 0; i < this.products.length; i++) {
        var product = this.products[i];
        var ingredients = recipes[product];
        for (var j = 0; j < ingredients.length; j++) {
            var ingredient = ingredients[j];
            if (!(ingredient in this.recipes_rev))
                this.recipes_rev[ingredient] = [];
            this.recipes_rev[ingredient].push(product);
        }
    }
};

Factory.prototype.layout = function()
{
    var x0 = 30;
    var y0 = 30;
    var dy = 20;
    var upcase = function(match, ch) { return " " + ch.toUpperCase(); }
    for (var i = 0; i < this.products.length; i++) {
        var product = this.products[i];
        var title = product.replace(/_/g, " ").replace(/\b([a-z])/g, upcase);
        var text = document.createElementNS(this.svg_ns, "text");
        text.setAttribute("x", x0);
        text.setAttribute("y", "" + (y0 + i * dy));
        text.textContent = title;
        this.canvas.appendChild(text);
    }
    var height = y0 * this.products.length * dy;
    document.rootElement.setAttribute("height", height);
}

var factory = null;

function startup(evt)
{
    factory = new Factory();
    factory.init(recipes);
    factory.layout();
}
