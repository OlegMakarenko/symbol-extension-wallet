import _ from 'lodash';
import { applyMiddleware, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import account from './account';
import listener from './listener';
import market from './market';
import network from './network';
import transaction from './transaction';
import wallet from './wallet';

const modules = {
    account,
    listener,
    market,
    network,
    transaction,
    wallet,
};

const defaultRootState = {
    account: account.state,
    listener: listener.state,
    market: market.state,
    network: network.state,
    transaction: transaction.state,
    wallet: wallet.state,
};

const createModuleReducer = (module, state = {}, action) => {
    if (!state[module.namespace]) state[module.namespace] = _.cloneDeep(module.state);

    const namespace = action.type.split('/')[0];
    const mutation = action.type.split('/')[1];

    if (module.namespace === namespace && typeof module.mutations[mutation] !== 'function') {
        throw Error(`[Store] Failed to commit mutation. Type "${mutation}" does not exist in "${namespace}"`);
    }

    if (module.namespace === namespace && typeof module.mutations[mutation] === 'function')
        return module.mutations[mutation](state, action.payload);

    return state;
};

const createRootReducer = (state, action) => {
    if (action.type === 'reset') {
        return _.cloneDeep(defaultRootState);
    }

    let rootState = { ...state };

    if (typeof action.type !== 'string') {
        throw Error(`[Store] Failed to commit mutation. Type "${action.type}" is not a string`);
    }

    const namespace = action.type.split('/')[0];

    if (namespace !== '@@redux' && !modules[namespace]) {
        throw Error(`[Store] Failed to commit mutation. Module "${namespace}" not found`);
    }

    Object.values(modules).forEach((module) => {
        rootState = {
            ...rootState,
            ...createModuleReducer(module, state, action),
        };
    });

    return rootState;
};

const store = createStore(createRootReducer, applyMiddleware(thunk));

store.dispatchAction = ({ type, payload }) => {
    if (typeof type !== 'string') {
        throw Error(`[Store] Failed to dispatchAction. Type "${type}" is not a string`);
    }
    const namespace = type.split('/')[0];
    const action = type.split('/')[1];

    if (!modules[namespace]) {
        throw Error(`[Store] Failed to dispatchAction. Module "${namespace}" not found`);
    }

    if (typeof modules[namespace].actions[action] !== 'function') {
        throw Error(`[Store] Failed to dispatchAction. Action "${action}" not found`);
    }

    const state = store.getState();
    return store.dispatch((dispatch) =>
        modules[namespace].actions[action](
            {
                commit: dispatch,
                state: state,
                dispatchAction: store.dispatchAction,
            },
            payload
        )
    );
};

store.reset = () => {
    store.dispatch((dispatch) => dispatch({ type: 'reset' }));
};

export { connect } from 'react-redux';
export default store;
