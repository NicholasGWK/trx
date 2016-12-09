# trx

Transformers are pure functions that take an initial object,
a chunk of state, and then return a new object.

The use case for transformers is often when using selectors, the desired output is some derivation or combination of the pieces of state selectors return. This library serves to formalize a lot of the common transformations used, and provide the ability to pipe/compose them in a descriptive and functional way.

### Examples

If we have the following state:

```javascript
const state = {  
  first: '1',
  second: {
    innerProp: 'test',
    },
  }
```
And there are already selectors for the first and second props, but we only want my resulting object to have first and innerProp, my final, anonymous selector must perform a relatively complex transformation:

```javascript
const mySelector = createSelector(
  firstSelector,
  secondSelector,
  (first, second) => {
    return R.merge(first, { inner: R.prop('innerProp', second))
  });
```

Although this isn't overly complex, you can imagine a scenario where you need state from multiple selectors and need to change all the key names, omit certain props, add new props that are derived from state, in order to get a final object that you can use for an API call etc. This results in a complex, highly coupled, and unreadable "final" selector function.

Instead, transformers look like this:

```javascript
const initialObject = {};
const state = {  
  first: '1',
  second: {
    innerProp: 'test',
    },
  };

const myTransformer = createTransformer(
    set('one', R.prop('first')),
    set('innerProp', R.path(['second', 'innerProp']))
  );

const result = myTransformer(initialObj, state);

//=> {
  first: '1',
  innerProp: 'test',
}
```

The full state gets passed to each transformer in the chain. You can also turn a transformer into a selector by providing a "root" selector as the state input, which should define all of the state required for the transformer to work:

```javascript
const mySelector = (
  firstSelector,
  secondSelector,
  R.merge
  );

const myTransformer = // same as above

const selectorToCallWithState = myTransformer(initialObj, mySelector);

const selectorToCallWithState(state); // gets same result
```

### API

#### Transformer : Object -> Object -> Object

Takes an initialObject, another object (usually state), and returns a new object.

#### createTransformer : List Transformer -> Transformer
Takes multiple input transformers and returns a new transformer that will sequentially apply all the input transformers. This allows for reusability and cool composition.


### Transformers

These are just pre-built transformers that mostly wrap ramda functions or fulfill common use cases I've run into. You can easily add your own transformers as long as they follow the type signature above.


#### set : String -> * -> transformer

Takes a key name, a value, and returns a transformer. If the value is a function, it will be applied to the state before the value is set.

```javascript
set('key', 'value')({}) // => { key: 'value'}
set('key', R.prop('stateKey'))({}, {stateKey: 'value'}) //=> { key: 'value'}
```

#### setWithTxr : String -> Transformer -> Transformer

Like set, but will set the provided key to the value returned by calling the provided Transformer with an empty object and the state.

```javascript
const setTransformer = set('key', 'value');
setWithTxr('key', setTransformer)({})
//=> {
  key: {
    key: 'value',
  }
}
```

#### mapKeys : Object -> Transformer
Takes a keymap object and returns a trasformer that will attempt to remap the keys of the provided initial object. Can use dot delimited paths for nested properties. If the input object is missing a prop, the key will be set to null in the output object.

```javascript
const keyMap = {
  first: 'one',
  'second.innerProp': 'two.coolProp',
}

const myKeymapper = mapKeys(keyMap);
const initialObj = {
  first: 'first',
  second: {
    innerProp: 'second',
  }
};

myKeymapper(initialObj);
// => {
  one: 'first',
  two: {
    coolProp: 'second',
  }
}
```

#### omit : List String -> Transformer

Wrapper for R.omit. Will omit keys from the initial object.

```javascript
const omitter = omit(['one']);
omitter({ one: 'one', two: 'two'}); //=> { two: 'two'}
```

### cond : * -> Transformer -> Transformer -> Transformer

Effectively a wrapper for R.cond. Takes a conditional, a true case trx, and a false case trx. Returns a transformer that is just the transformer for the case.

If the conditional is a function, the function will be applied to the state before the appropriate transformer is returned.

```javascript
const state = { importantFlag: false };

const myCond = cond(
  R.prop('importantFlag'),
  set('key', 'true'),
  set('key', 'false')
  );

cond({}, state) //=> { key: 'false' }

```

### logger

Dummy transformer that logs it's input arguments and passes the initialObject back. Generally side effects shouldn't happen inside transformers, but is useful for debugging long chains in createTransformer.

```javascript
const myTxr = createTransformer(
  set('key', 'valeu'), //whoops, typo;
  logger,
  set('key2', 'value2'),
  );

  myTxr({})
  //=> Will console.log intermediate object { key: 'value'};
```

### Helpers

These are some convenience functions that can be used as transformer arguments (mostly cond/set) that keep things simple.

#### pathEqual : String/List String -> * -> (Object -> Boolean)

Takes a dot delimited string, or a path array, and a value. Returns a function that accepts the state, and returns whether the value found at the path equals the input value.


```javascript
const state = { test: 'test '};
cond(pathEqual('test', 'test'), txr1, txr2)(state)
//=> Will return txr1
```
#### pathNotEqual
Same as pathEqual, but checks that the value at the path is not equal.

#### fromInitial : String/List String -> (Object -> * ) -> *

Will lookup the value at the path in initialObject and apply the provided function to it. Useful for setting things from the input object and applying simple changes to the value.

If no function is provided, it defaults to R.identity

Can take list of strings or dot delimited string for path.

```javascript
const txr = set('initialVal', fromInitial('test', R.upper);
const initialObj = { test: 'initial' };

txr(initialObj);
//=> { initialVal: 'INITIAL' }

```

#### fromState

Like fromInitial, but looks up the path in state.
