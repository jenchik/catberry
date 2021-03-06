/*
 * catberry
 *
 * Copyright (c) 2014 Denis Rechkunov and project contributors.
 *
 * catberry's license follows:
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * This license applies to all parts of catberry that are not externally
 * maintained libraries.
 */

'use strict';

var assert = require('assert'),
	events = require('events'),
	ServiceLocator = require('catberry-locator'),
	CookieWrapper = require('../../../lib/CookieWrapper'),
	ModuleApiProvider = require('../../../lib/providers/ModuleApiProvider');

global.Promise = require('promise');

describe('lib/providers/ModuleApiProvider', function () {
	describe('#on', function () {
		it('should throw error if handler is not a function', function () {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);

			assert.throws(function () {
				api.on('some', {});
			}, Error);
		});
		it('should throw error if event name is not a string', function () {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);

			assert.throws(function () {
				api.on({}, function () {});
			}, Error);
		});
		it('should properly register handler on event', function (done) {
			var locator = createLocator(),
				bus = locator.resolve('eventBus'),
				api = locator.resolveInstance(ModuleApiProvider);

			api.on('event', function (arg) {
				assert.strictEqual(arg, 'hello');
				done();
			});
			bus.emit('event', 'hello');
		});
	});
	describe('#once', function () {
		it('should throw error if handler is not a function', function () {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);

			assert.throws(function () {
				api.once('some', {});
			}, Error);
		});
		it('should throw error if event name is not a string', function () {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);

			assert.throws(function () {
				api.once({}, function () {});
			}, Error);
		});
		it('should properly register handler on event', function (done) {
			var locator = createLocator(),
				bus = locator.resolve('eventBus'),
				api = locator.resolveInstance(ModuleApiProvider);

			var was = false;
			api.once('event', function (arg) {
				if (was) {
					assert.fail();
				}
				was = true;
				assert.strictEqual(arg, 'hello');
			});
			bus.emit('event', 'hello');
			assert.strictEqual(was, true);
			done();
		});
	});
	describe('#removeListener', function () {
		it('should throw error if handler is not a function', function () {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);

			assert.throws(function () {
				api.removeListener('some', {});
			}, Error);
		});
		it('should throw error if event name is not a string', function () {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);

			assert.throws(function () {
				api.removeListener({}, function () {});
			}, Error);
		});
		it('should properly remove listener', function (done) {
			var locator = createLocator(),
				bus = locator.resolve('eventBus'),
				api = locator.resolveInstance(ModuleApiProvider);

			var was = false,
				handler = function () {
					was = true;
				};

			api.on('event', handler);
			api.removeListener('event', handler);
			bus.emit('event', 'hello');
			assert.strictEqual(was, false);
			done();
		});
	});
	describe('#removeAllListeners', function () {
		it('should throw error if event name is not a string', function () {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);

			assert.throws(function () {
				api.removeAllListeners({});
			}, Error);
		});
		it('should properly remove all listeners', function (done) {
			var locator = createLocator(),
				bus = locator.resolve('eventBus'),
				api = locator.resolveInstance(ModuleApiProvider);

			var was = false,
				handler1 = function () {
					was = true;
				},
				handler2 = function () {
					was = true;
				};

			api.on('event', handler1);
			api.on('event', handler2);
			api.removeAllListeners('event');
			bus.emit('event', 'hello');
			assert.strictEqual(was, false);
			done();
		});
	});
	describe('#redirect', function () {
		it('should save last redirected URI', function () {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);
			assert.strictEqual(api.redirect('/some1') instanceof Promise, true);
			assert.strictEqual(api.redirect('/some2') instanceof Promise, true);
			assert.strictEqual(api.actions.redirectedTo, '/some2');
		});
	});
	describe('#clearFragment', function () {
		it('should save flag that hash has been cleared', function () {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);
			assert.strictEqual(api.actions.isFragmentCleared, false);
			assert.strictEqual(api.clearFragment() instanceof Promise, true);
			assert.strictEqual(api.actions.isFragmentCleared, true);
		});
	});
	describe('#getInlineScript', function () {
		it('should return browser script for redirection', function (done) {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);
			api.redirect('http://some');
			var expected = '<script>' +
				'window.location.assign(\'http://some\');' +
				'</script>';
			assert.strictEqual(api.getInlineScript(), expected);
			done();
		});
		it('should return browser script for cookies', function (done) {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);
			api.cookie.set({
				key: 'some1',
				value: 'value1'
			});
			api.cookie.set({
				key: 'some2',
				value: 'value2'
			});
			var expected = '<script>' +
				'window.document.cookie = \'some1=value1\';' +
				'window.document.cookie = \'some2=value2\';' +
				'</script>';
			assert.strictEqual(api.getInlineScript(), expected);
			done();
		});
		it('should return browser script ' +
		'for clearing fragment', function (done) {
			var locator = createLocator(),
				api = locator.resolveInstance(ModuleApiProvider);
			api.clearFragment();
			var expected = '<script>' +
				'window.location.hash = \'\';' +
				'</script>';
			assert.strictEqual(api.getInlineScript(), expected);
			done();
		});
	});
});

function createLocator() {
	var locator = new ServiceLocator();

	locator.register('cookieWrapper', CookieWrapper);
	locator.registerInstance('serviceLocator', locator);
	locator.registerInstance('eventBus', new events.EventEmitter());

	return locator;
}