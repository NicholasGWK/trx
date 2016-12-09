import R from 'ramda';

export const mapKeys = keyMap => createKeyMap(keyMap);

export const set = R.curry((keyName, valFn) => (obj, state) => {
  if (R.is(Function, valFn)) {
    return R.assoc(keyName, valFn(state, obj), obj);
  }
  return R.assoc(keyName, valFn, obj);
});

export const setWithTxf = (key, txf) => (obj, state) => {
  const val = txf({}, state);

  return set(key, val);
};

export const omit = keys => obj => R.omit(keys, obj);

export const cond = R.curry((conditional, ifTrue, ifFalse) => (obj, state) => {
  if (R.is(Function, conditional)) {
    return conditional(state) ? ifTrue(obj, state) : ifFalse(obj, state);
  }
  return conditional ? ifTrue(obj, state) : ifFalse(obj, state);
});

export const pathEqual = (path, value) => state => {
  if (R.is(Array, path)) {
    return R.pipe(
        R.path(path),
        R.equals(value),
      )(state);
  }

  return R.pipe(
      R.path(R.split('.', path)),
      R.equals(value),
    )(state);
};

export const pathNotEqual = (path, value) => state => {
  if (R.is(Array, path)) {
    return R.pipe(
        R.path(path),
        !R.equals(value),
      )(state);
  }

  return R.pipe(
      R.path(R.split('.', path)),
      !R.equals(value),
    )(state);
};

export const fromPath = (path, transform = R.identity) => state => {
  if (R.is(Array, path)) {
    return transform(R.path(path)(state));
  }
  return transform(R.path(R.split('.', path))(state));
};

export const fromInitial = (path, transform = R.identity) => (state, obj) => {
  if (R.is(Array, path)) {
    return transform(R.path(path)(obj));
  }
  return transform(R.path(R.split('.', path))(obj));
};

export const createKeyMap = keyMap => {
  return obj => {
    return R.reduce((prev, [inputFieldName, outputFieldName]) => {
      return R.assocPath(outputFieldName.split('.'), R.pathOr(null, inputFieldName.split('.'), obj), prev);
    }, {}, R.toPairs(keyMap));
  };
};

export const createTransformer = (...transformers) => (initialObj, state) => {
  const composeTransformers = (init, inputState) => {
    return transformers.reduce( (prev, curr) => {
      return curr(prev, inputState);
    }, init);
  };

  const initialObjIsFn = R.is(Function, initialObj);
  const stateIsFn = R.is(Function, state);

  if (!initialObjIsFn && !stateIsFn) {
    return composeTransformers(initialObj, state);
  } else if (!initialObjIsFn && stateIsFn) {
    return newState => {
      return composeTransformers(initialObj, state(newState));
    };
  } else if (initialObjIsFn && !stateIsFn) {
    return composeTransformers(initialObj(state), state);
  }
  return newState => {
    const finalState = state(newState);
    return composeTransformers(initialObj(finalState), finalState);
  };
};

export const logger = (object, state) => {
  console.log(object);
  console.log(state);
  return object;
};
