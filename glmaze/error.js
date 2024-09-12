function Error(message) {
    this.message = message;
    this.name = 'Error';
}

Error.prototype.toString = function () {
    return this.name + ': "' + this.message + '"';
};

