"use strict";

function Dict()
{
}

Dict.prototype = new Object();

Dict.prototype.parse_key = function(key)
{
    var k = key.split(",");
    var result = [];
    for (var i = 0; i < k.length; i++)
        result.push(Number(k[i]));
    return result;
};

Dict.prototype.keys = function()
{
    var result = [];
    var keys = Object.keys(this);
    for (var i = 0; i < keys.length; i++)
        result.push(this.parse_key(keys[i]));
    return result;
}
        
Dict.prototype.empty = function()
{
    return Object.keys(this).length == 0;
};

function DefaultDict()
{
    Dict.call(this);
}

DefaultDict.prototype = Object.create(Dict.prototype);

DefaultDict.prototype.append = function(key, value)
{
    if (!(key in this))
        this[key] = [];
    this[key].push(value);
};

function Set()
{
}

Set.prototype = Object.create(Dict.prototype);

Set.prototype.add = function(key)
{
    if (key in this)
        return;
    this[key] = null;
};

Set.prototype.remove = function(key)
{
    delete this[key];
};

Set.prototype.pop = function()
{
    var keys = Object.keys(this);
    var key = keys.pop();
    this.remove(key);
    return this.parse_key(key);
};

