/* eslint-ignore no-unused vars */
import { createTransformer, set, omit, cond, mapKeys, pathEqual } from '../src/index';
import R from 'ramda';
import sinon from 'sinon';
import { expect } from 'chai';

const initialObj = {
  test: 'test',
};

const state = {
  test: 'state',
  four: 'four',
};

const state2 = {
  test: {
    cool: 'test',
  },
  prop: 'test',
};

describe.only('Transformers test', () => {
  describe('Set transformer', () => {
    it('should let you set a key to a value', () => {
      expect(set('test', 'new')(initialObj)).to.eql({
        test: 'new',
      });
    });
    it('should let you set a key using a selector', () => {
      expect(set('test', R.prop('test'))(initialObj, state)).to.eql({
        test: 'state',
      });
    });
    it('should be curryable to make conveinence functions', () => {
      const setFromTestProp = set(R.__, R.prop('test'));
      expect(setFromTestProp('test')(initialObj, state)).to.eql({
        test: 'state',
      });
    });
  });
  describe('Omit transformer', () => {
    it('should take an array of keys and omit them from the object', () => {
      expect(omit('test')(initialObj)).to.eql({});
    });
  });

  describe('Cond transformer', () => {
    it('should take a true expression and run the true transformer', () => {
      const mockTrue = sinon.spy();
      const resultTxr = cond(true, mockTrue, R.identity);
      resultTxr(initialObj);
      expect(mockTrue.calledOnce).to.be.true;
    });

    it('should take a false expression and run the false transformer', () => {
      const mockFalse = sinon.spy();
      const resultTxr = cond(false, R.identity, mockFalse);
      resultTxr(initialObj);
      expect(mockFalse.calledOnce).to.be.true;
    });

    it('should take a selector that evaluates to true and run the true transformer', () => {
      const selector = R.has('test');
      const mockTrue = sinon.spy();
      cond(selector, mockTrue, R.identity)(initialObj, state);
      expect(mockTrue.calledOnce).to.be.true;
    });
    it('should take a selector that evaluates to false and run the false transformer', () => {
      const selector = R.has('fake');
      const mockFalse = sinon.spy();
      cond(selector, R.identity, mockFalse)(initialObj, state);
      expect(mockFalse.calledOnce).to.be.true;
    });
  });

  describe('mapKeys transformer test', () => {
    it('should create a transformer maps the keys', () => {
      const keyMap = {
        'test': 'test2',
      };

      expect(mapKeys(keyMap)(initialObj)).to.eql({
        test2: 'test',
      });
    });

    it('should use null if the input is missing a key from the keymap', () => {
      const keyMap = {
        'test': 'test2',
        'whoops': 'output2',
      };

      expect(mapKeys(keyMap)(initialObj)).to.eql({
        test2: 'test',
        output2: null,
      });
    });
  });
  describe('createTransformer test', () => {
    it('should take one transformer and have it be the same', () => {
      const transformer = createTransformer(set('test', 'new'));
      expect(transformer(initialObj)).to.eql({
        test: 'new',
      });
    });
    it('should compose transformers and pass along the value', () => {
      const transformer = createTransformer(
        set('test', 'new'),
        set('test2', 'new'),
        set('test', 'over'),
      );

      expect(transformer(initialObj)).to.eql({
        test: 'over',
        test2: 'new',
      });
    });

    it('should compose different transformers without issue', () => {
      const transformer = createTransformer(
        set('test', 'new'),
        set('test2', 'new'),
        omit(['test2']),
      );

      expect(transformer(initialObj)).to.eql({
        test: 'new',
      });
    });

    it('should also pass the state along', () => {
      const transformer = createTransformer(
        set('test2', R.prop('test')),
      );

      expect(transformer(initialObj, state)).to.eql({
        test: 'test',
        test2: 'state',
      });
    });

    it('should handle complex composition', () => {
      const keyMap = {
        test2: 'test2map',
        test3: 'test3map',
        test4: 'test4map',
      };
      const transformer = createTransformer(
        set('test2', 'test'),
        set('test3', R.prop('test')),
        omit(['test']),
        cond(true, set('test4', R.prop('four')), R.identity),
        cond(R.has('fake'), R.identity, mapKeys(keyMap)),
      );

      expect(transformer(initialObj, state)).to.eql({
        test2map: 'test',
        test3map: 'state',
        test4map: 'four',
      });
    });

    it('should allow you to pass a selector for the initialObj param', () => {
      const transformer = createTransformer(
        set('test2', 'test'),
      );

      expect(transformer(R.pick(['four']), state)).to.eql({
        test2: 'test',
        four: 'four',
      });
    });

    it('should allow you to pass a selector for the state param', () => {
      const transformer = createTransformer(
        set('test2', 'test'),
        set('four', R.pick(['four'])),
      );

      const txToSelector = transformer(initialObj, R.pick(['four']));
      expect(txToSelector(state)).to.eql({
        test: 'test',
        test2: 'test',
        four: {
          four: 'four',
        },
      });
    });

    it('should allow you to pass a selector for both params', () => {
      const transformer = createTransformer(
        set('test2', 'test'),
        set('four', R.prop('test4')),
        set('four2', R.prop('four2')),
      );

      const selector = mapKeys({ four: 'four2', test: 'test4' });

      const txToSelector = transformer(R.merge({ tester: 'test' }), selector);
      expect(txToSelector(state)).to.eql({
        test2: 'test',
        tester: 'test',
        four2: 'four',
        test4: 'state',
        four: 'state',
      });
    });

    it('should let you use pathEqual with arrays for the common cond case', () => {
      const transformer = createTransformer(
        cond(pathEqual(['test', 'cool'], 'test'), set('test', true), set('test', false))
      );

      expect(transformer({}, state2)).to.eql({
        test: true,
      });
    });

    it('should let you use pathEqual with a prop for the common cond case', () => {
      const transformer = createTransformer(
        cond(pathEqual('prop', 'test'), set('test', true), set('test', false))
      );

      expect(transformer({}, state2)).to.eql({
        test: true,
      });
    });

    it('should let you use pathEqual with string delimited path for the common cond case', () => {
      const transformer = createTransformer(
        cond(pathEqual('test.cool', 'test'), set('test', true), set('test', false))
      );

      expect(transformer({}, state2)).to.eql({
        test: true,
      });
    });
  });
});
