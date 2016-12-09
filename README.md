# trx

Transformers are pure functions that take an initial object,
a chunk of state, and then return a new object.

The use case for transformers is often when using selectors, the desired output is some derivation or combination of the pieces of state selectors return. This library serves to formalize a lot of the common transformations used, and provide the ability to pipe/compose them in a descriptive and functional way.

### Examples

If we have the following state:

```
const state = {  
  first: '1',
  second: {
    innerProp: 'test',
    },
  }
```
If I already have selectors for first and second, but I only want my resulting object to have first and innerProp, my final, anonymous selector must perform a relatively complex transformation:

```
const mySelector = createSelector(
  firstSelector,
  secondSelector,
  (first, second) => {
    return R.merge(first, { inner: R.prop('innerProp', second))
  });
```

Although this isn't very hard, you can imagine a scenario where you need state from multiple selectors and need to change all the key names, omit certain props, add new props that are derived from state, in order to get a final object that you can use for an API call etc. This results in a complex, highly coupled, and unreadable "final" selector function.

Instead, transformers look like this:

```
const initialObject = {};
const state = {  
  first: '1',
  second: {
    innerProp: 'test',
    },
  };

const myTransformer = createTransformer(
    set('first', R.prop('first')),
    set('innerProp', R.path(['second', 'innerProp']))
  );

const result = myTransformer(initialObj, state);
```

The full state gets passed to each transformer in the chain. You can also turn a transformer into a selector by provided a "root" selector as the state input, which should define all of the state required for the transformer to work:

```
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
Takes multiple input transformers and returns a new transformer that will sequentially apply all the transformers of the input transformers. This allows for reusability and cool composition.


### Transformers

These are just pre-built transformers that mostly wrap ramda functions or fulfill common use cases I've run into. You can easily add your own transformers as long as they follow the type signature above.


#### set : String -> * -> transformer

Takes a key name, a value, and returns a transformer. If the value is a function, it will be applied to the state before the value is set.

```
set('key', 'value')({}) // => { key: 'value'}
set('key', R.prop('stateKey'))({}, {stateKey: 'value'}) //=> { key: 'value'}
```

#### setWithTxr : String -> Transformer -> Transformer

Like set, but will set the provided key to the value returned by calling the provided Transformer with an empty object and the state.

```
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

```
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
