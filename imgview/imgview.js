"use strict";

// ************************************************************

function Application()
{
    this.e_image = document.getElementById("image");
    this.e_file = document.getElementById("file");
    this.def_src = this.e_image.src;
    this.reader = null;
    this.e_file.onchange = this.set_image.bind(this);
    this.set_image();
}

Application.prototype = new Object;

Application.prototype.set_image = function(event)
{
    if (!this.e_file.files.length) {
        this.e_image.src = this.def_src;
        return;
    }

    var file = this.e_file.files[0];
    this.reader = new FileReader();
    this.reader.onload = this.on_load.bind(this);
    this.reader.onabort = this.on_abort.bind(this);
    this.reader.onerror = this.on_abort.bind(this);
    this.reader.readAsDataURL(file);
};

Application.prototype.on_load = function(event)
{
    this.e_image.src = this.reader.result;
    this.reader = null;
};

Application.prototype.on_abort = function(event)
{
    this.e_image.src = this.def_src;
    this.reader = null;
};

// ************************************************************

var app = null;

function init()
{
    app = new Application();
}

// ************************************************************

