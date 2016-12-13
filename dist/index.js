'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logger = exports.createTransformer = exports.createKeyMap = exports.fromInitial = exports.fromPath = exports.pathNotEqual = exports.pathEqual = exports.cond = exports.omit = exports.setWithTxf = exports.set = exports.mapKeys = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mapKeys = exports.mapKeys = function mapKeys(keyMap) {
  return createKeyMap(keyMap);
};

var set = exports.set = _ramda2.default.curry(function (keyName, valFn) {
  return function (obj, state) {
    if (_ramda2.default.is(Function, valFn)) {
      return _ramda2.default.assoc(keyName, valFn(state, obj), obj);
    }
    return _ramda2.default.assoc(keyName, valFn, obj);
  };
});

var setWithTxf = exports.setWithTxf = function setWithTxf(key, txf) {
  return function (obj, state) {
    var val = txf({}, state);

    return set(key, val);
  };
};

var omit = exports.omit = function omit(keys) {
  return function (obj) {
    return _ramda2.default.omit(keys, obj);
  };
};

var cond = exports.cond = _ramda2.default.curry(function (conditional, ifTrue, ifFalse) {
  return function (obj, state) {
    if (_ramda2.default.is(Function, conditional)) {
      return conditional(state) ? ifTrue(obj, state) : ifFalse(obj, state);
    }
    return conditional ? ifTrue(obj, state) : ifFalse(obj, state);
  };
});

var pathEqual = exports.pathEqual = function pathEqual(path, value) {
  return function (state) {
    if (_ramda2.default.is(Array, path)) {
      return _ramda2.default.pipe(_ramda2.default.path(path), _ramda2.default.equals(value))(state);
    }

    return _ramda2.default.pipe(_ramda2.default.path(_ramda2.default.split('.', path)), _ramda2.default.equals(value))(state);
  };
};

var pathNotEqual = exports.pathNotEqual = function pathNotEqual(path, value) {
  return function (state) {
    if (_ramda2.default.is(Array, path)) {
      return _ramda2.default.pipe(_ramda2.default.path(path), !_ramda2.default.equals(value))(state);
    }

    return _ramda2.default.pipe(_ramda2.default.path(_ramda2.default.split('.', path)), !_ramda2.default.equals(value))(state);
  };
};

var fromPath = exports.fromPath = function fromPath(path) {
  var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ramda2.default.identity;
  return function (state) {
    if (_ramda2.default.is(Array, path)) {
      return transform(_ramda2.default.path(path)(state));
    }
    return transform(_ramda2.default.path(_ramda2.default.split('.', path))(state));
  };
};

var fromInitial = exports.fromInitial = function fromInitial(path) {
  var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ramda2.default.identity;
  return function (state, obj) {
    if (_ramda2.default.is(Array, path)) {
      return transform(_ramda2.default.path(path)(obj));
    }
    return transform(_ramda2.default.path(_ramda2.default.split('.', path))(obj));
  };
};

var createKeyMap = exports.createKeyMap = function createKeyMap(keyMap) {
  return function (obj) {
    return _ramda2.default.reduce(function (prev, _ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          inputFieldName = _ref2[0],
          outputFieldName = _ref2[1];

      return _ramda2.default.assocPath(outputFieldName.split('.'), _ramda2.default.pathOr(null, inputFieldName.split('.'), obj), prev);
    }, {}, _ramda2.default.toPairs(keyMap));
  };
};

var createTransformer = exports.createTransformer = function createTransformer() {
  for (var _len = arguments.length, transformers = Array(_len), _key = 0; _key < _len; _key++) {
    transformers[_key] = arguments[_key];
  }

  return function (initialObj, state) {
    var composeTransformers = function composeTransformers(init, inputState) {
      return transformers.reduce(function (prev, curr) {
        return curr(prev, inputState);
      }, init);
    };

    var initialObjIsFn = _ramda2.default.is(Function, initialObj);
    var stateIsFn = _ramda2.default.is(Function, state);

    if (!initialObjIsFn && !stateIsFn) {
      return composeTransformers(initialObj, state);
    } else if (!initialObjIsFn && stateIsFn) {
      return function (newState) {
        return composeTransformers(initialObj, state(newState));
      };
    } else if (initialObjIsFn && !stateIsFn) {
      return composeTransformers(initialObj(state), state);
    }
    return function (newState) {
      var finalState = state(newState);
      return composeTransformers(initialObj(finalState), finalState);
    };
  };
};

var logger = exports.logger = function logger(object, state) {
  console.log(object);
  console.log(state);
  return object;
};