/**
 * @name faith
 * @version 0.1.9
 * @description faith — JavaScript promises library
 * @license MIT (license.txt)
 * @author Dmitry Makhnev, SoftWearFinance LLC
 * © SoftWearFinance LLC (http://softwearfinance.com/), Dmitry Makhnev (https://github.com/DmitryMakhnev)
 */
(function(global){
    var faith,
        isArray,
        u;

    if (Array.isArray !== u){
        isArray = function(object){
            return Array.isArray(object);
        }
    } else{
        isArray = function(object){
            return Object.prototype.toString.call(object) === '[object Array]';
        }
    }

    // isNotNeedTick flag ignore http://promises-aplus.github.io/promises-spec/#point-39
    function Promise(value, isNotNeedTick){
        var promise = this;

        promise.value = value;
        promise.ctx = null;

        promise.isNotNeedTick = isNotNeedTick;

        promise.isFulfilled = false;
        promise.isRejected = false;
        promise.isResolved = false;

        // packing flat groups |isThenCallback, cb, ctx|, |isNotThenCallback, cb, data, ctx|
        promise._onFullfill = [];
        // packing flat groups |isThenCallback, cb, ctx|, |isNotThenCallback, cb, data, ctx|
        promise._onReject = [];

    }


    Promise.prototype = {

        then: function(onFulfilled, onRejected, ctx){
            var promise = this,
                isHasReject = (onRejected !== u);

            if ((typeof onRejected !== 'function') && isHasReject){
                ctx = onRejected;
                isHasReject = false;
            }

            //work with fulfill
            if (!promise.isRejected && (onFulfilled !== u)){
                if (promise.isResolved){
                    callThenCallback(promise, onFulfilled, ctx);
                } else{
                    promise._onFullfill.push(true, onFulfilled, ctx);
                }
            }

            //work with reject
            if (!promise.isFulfilled && isHasReject){
                if (promise.isResolved){
                    callThenCallback(promise, onRejected, ctx);
                } else{
                    promise._onReject.push(true, onRejected, ctx);
                }
            }

            return promise;
        },

        thenWithData: function(onFulfilled, onRejected, data, ctx){
            var promise = this,
                isHasReject = (onRejected !== u);

            if ((typeof onRejected !== 'function') && isHasReject){
                ctx = data;
                data = onRejected;
                isHasReject = false;
            }

            //work with fulfill
            if (!promise.isRejected && (onFulfilled !== u)){
                if (promise.isResolved){
                    callThenWithDataCallback(promise, onFulfilled, data, ctx);
                } else{
                    promise._onFullfill.push(false, onFulfilled, data, ctx);
                }
            }

            //work with reject
            if (!promise.isFulfilled && isHasReject){
                if (promise.isResolved){
                    callThenWithDataCallback(promise, onRejected, data, ctx);
                } else{
                    promise._onReject.push(false, onRejected, data, ctx);
                }
            }

            return promise;
        },

        done: function(onDone, ctx){
            return this.then(onDone, onDone, ctx);
        },

        fulfill: function(value){
            var promise = this;
            if (!promise.isResolved){
                promise.value = value || promise.value;
                promise.isResolved = promise.isFulfilled = true;
                callCallbacks(promise, promise._onFullfill);
                promise._onFullfill = promise._onReject = u;
            }
            return promise;
        },

        reject: function(error){
            var promise = this;
            if (!promise.isResolved){
                promise.value = error || promise.value;
                promise.isResolved = promise.isRejected = true;
                callCallbacks(promise, promise._onReject);
                promise._onFullfill = promise._onReject = u;
            }
            return promise;
        },

        destructor: function(){
//                    todo
        }

    };

    function callThenCallback(promise, callback, ctx){
        // todo 2.2.4 http://promises-aplus.github.io/promises-spec/#point-39
        if (promise.isNotNeedTick){
        }
        callback.call(ctx || promise, promise.value);
    }
    
    function callThenWithDataCallback(promise, callback, data, ctx){
        // todo 2.2.4 http://promises-aplus.github.io/promises-spec/#point-39
        if (promise.isNotNeedTick){
        }
        callback.call(ctx || promise, promise.value, data);
    }

    function callCallbacks(promise, callbacksData){
        var i = 0,
            iMax = callbacksData.length;

        while (i < iMax){
            if (callbacksData[i]){
                callThenCallback(promise, callbacksData[i + 1], callbacksData[i + 2]);
                i += 3;
            } else{
                callThenWithDataCallback(promise, callbacksData[i + 1], callbacksData[i + 2], callbacksData[i + 3]);
                i += 4;
            }
        }
    }

    function Believe(promises, isNotNeedTick){
        var believe = this,
            i = 0,
            size = promises.length,
            believeValue = [];

        believeValue.length = size;
        believe.value = believeValue;
        believe.promises = promises;
        believe.ctx = null;

        believe.isFulfilled = false;
        believe.isRejected = false;
        believe.isResolved = false;

        believe._size = size;
        believe._hasRejected = false;
        believe._promise = new Promise(believeValue, isNotNeedTick);

        for (; i < size; i += 1){
            promises[i].thenWithData(believePromiseFulfill, believePromiseReject, i, believe);
        }
    }

    function believePromiseFulfill(value, promiseIndex){
        var believe = this;
        believe.value[promiseIndex] = believe.promises[promiseIndex].value;
        if ((believe._size -= 1) === 0){
            believeResolve(believe);
        }
    }

    function believePromiseReject(value, promiseIndex){
        var believe = this;
        believe._hasRejected = true;
        believe.value[promiseIndex] = believe.promises[promiseIndex].value;
        if ((believe._size -= 1) === 0){
            believeResolve(believe);
        }
    }

    function believeResolve(believe){
        if (believe._hasRejected){
            believe._promise.reject(believe.value);
        } else{
            believe._promise.fulfill();
        }
    }

    function BelieveOfObject(promisesObject, isNotNeedTick){
        var believe = this,
            believeValue = {},
            p;

        believe.value = believeValue;
        believe.promises = promisesObject;
        believe.ctx = null;

        believe.isFulfilled = false;
        believe.isRejected = false;
        believe.isResolved = false;

        believe._size = 0;
        believe._isPromissesProcessed = false;
        believe._hasRejected = false;
        believe._promise = new Promise(believeValue, isNotNeedTick);

        for (p in promisesObject){
            believe._size += 1;
            believeValue[p] = promisesObject[p].value;
            promisesObject[p].thenWithData(believeOfObjectOnFulfill, believeOfObjectOnReject, p, believe);
        }

        if (believe._size === 0){
            believeResolve(believe);
        } else{
            believe._isPromissesProcessed = true;
        }

    }

    function believeOfObjectOnFulfill(value, p){
        var believe = this;
        believe.value[p] = believe.promises[p];
        if (((believe._size -= 1) === 0) && believe._isPromissesProcessed){
            believeResolve(believe);
        }
    }

    function believeOfObjectOnReject(value, p){
        var believe = this;
        believe._hasRejected = true;
        believe.value[p] = believe.promises[p];
        if (((believe._size -= 1) === 0) && believe._isPromissesProcessed){
            believeResolve(believe);
        }
    }


    BelieveOfObject.prototype = Believe.prototype = {
        then: function(onFulfilled, onRejected, ctx){
            var believe = this;
            believe._promise.then(onFulfilled, onRejected, ctx || believe);
            return believe;
        },
        thenWithData: function(onFulfilled, onRejected, data, ctx){
            var believe = this;
            if ((onRejected !== u) && (typeof onRejected !== 'function')){
                ctx = data;
                data = onRejected;
                onRejected = u;
            }
            believe._promise.thenWithData(onFulfilled, onRejected, data, ctx || believe);
            return believe;
        },
        done: function(onDone, ctx){
            var believe = this;
            believe._promise.done(onDone, ctx || believe);
            return believe;
        },
        destructor: function(){
//            todo
        }
    };

    global.FAITH = faith = {
        version: '0.1.9',

        /**
         * create promise
         * @param {Mixed} value — promise value
         * @returns {Promise}
         */
        promise: function(value){
            return new Promise(value, false);
        },

        /**
         * create promise without tick
         * @param {Mixed} value — promise value
         * @returns {Promise}
         */
        promiseNT: function(value){
            return new Promise(value, true);
        },

        /**
         * test verifiable on promise
         * @param {Mixed} verifiable
         * @returns {boolean} isPromise
         */
        isPromise: function(verifiable){
            return verifiable instanceof Promise;
        },

        /**
         * create believe
         * @param {promise|Object|Array} promise
         * @returns {Believe}
         */
        believe: function(promise){
            if (faith.isPromise(promise)){
                return new Believe(arguments, false);
            } else if (isArray(promise)){
                return new Believe(promise, false);
            }
            return new BelieveOfObject(promise, false);
        },

        /**
         * create believe without tick
         * @param {promise|Object|Array} promise
         * @returns {Believe}
         */
        believeNT: function(promise){
            if (faith.isPromise(promise)){
                return new Believe(arguments, true);
            } else if (isArray(promise)){
                return new Believe(promise, true);
            }
            return new BelieveOfObject(promise, true);
        },

        /**
         * test verifiable on believe
         * @param {Mixed} verifiable
         * @returns {boolean} isBelieve
         */
        isBelieve: function(verifiable){
            return (verifiable instanceof Believe)
                || (verifiable instanceof BelieveOfObject);
        },

        /**
         * test verifiable on promise or believe
         * @param {Mixed} verifiable
         * @returns {boolean} isPromiseOrBelieve
         */
        isThenable: function(verifiable){
            return faith.isPromise(verifiable)
                || faith.isBelieve(verifiable);
        }

    };
}(this));