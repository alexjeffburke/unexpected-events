function assertEvent(expect, subject, channel, responseCount) {
    return expect.promise(function (resolve, reject) {
        if (!(subject.on && subject.emit)) {
            return reject(new Error('The subject provided was not an event emitter.'));
        }

        subject.on(channel, function () {
            responseCount -= 1;

            if (responseCount > 0) {
                return;
            }

            resolve(Array.prototype.slice.call(arguments, 0));
        });
    }).then(function (message) {
        return expect.promise(function () {
            var suppliedArgs = expect.args;
            var suppliedValue = suppliedArgs[suppliedArgs.length - 1];

            if (suppliedArgs.length === 3 && typeof suppliedValue === 'array') {
                throw new Error('The value must be an array of message parts.');
            }

            return expect.shift(message);
        });
    });
}

function isFunction(x) {
    return (typeof x === 'function');
}

module.exports = {
    name: 'unexpected-events',
    version: require('../package.json').version,
    installInto: function (expect) {
        expect.addType({
            base: 'any',
            name: 'EventEmitter',
            identify: function (obj) {
                return (typeof obj === 'object' && obj !== null && isFunction(obj.emit) && isFunction(obj.on));
            }
        });

        expect.addAssertion('<EventEmitter> for the first event on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, channel, 1);
        });

        expect.addAssertion('<EventEmitter> for the second event on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, channel, 2);
        });

        expect.addAssertion('<EventEmitter> for the third event on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, channel, 3);
        });
    }
};
