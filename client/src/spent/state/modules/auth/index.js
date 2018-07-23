import { createSelector } from 'reselect';
import focal from 'focal';
import authentication from 'spent/state/utils/auth';

const createAsyncActionCreator = name => ({
  start: `spent/${name}/start`,
  success: `spent/${name}/success`,
  failure: `spent/${name}/failure`,
});

const actionTypes = {
  authenticate: createAsyncActionCreator('auth/authenticate'),
  unauthenticate: createAsyncActionCreator('auth/unauthenticate'),
  listening: 'spent/auth/listening',
  error: { clear: 'spent/auth/error/clear' },
};

const reducerActions = {
  authenticate: {
    start: () => ({ type: actionTypes.authenticate.start }),
    success: user => ({ type: actionTypes.authenticate.success, user }),
    failure: error => ({ type: actionTypes.authenticate.failure, error }),
  },
  unauthenticate: {
    start: () => ({ type: actionTypes.unauthenticate.start }),
    success: () => ({ type: actionTypes.unauthenticate.success }),
    failure: error => ({ type: actionTypes.unauthenticate.failure, error }),
  },
  listening: () => ({ type: actionTypes.listening }),
  error: {
    clear: () => ({ type: actionTypes.error.clear }),
  },
};

const actions = {
  authenticate: {
    withEmailAndPassword: ({ email, password }) => (dispatch) => {
      focal.set('Signing in...');
      dispatch(reducerActions.authenticate.start());
      authentication.startSession.with.emailAndPassword(email, password)
        .catch(error => dispatch(reducerActions.authenticate.failure(error)));
    },
    withGoogle: () => (dispatch) => {
      focal.set('Signing in with Google...');
      dispatch(reducerActions.authenticate.start());
      authentication.startSession.with.google()
        .catch(error => dispatch(reducerActions.authenticate.failure(error)));
    },
    withFacebook: () => (dispatch) => {
      focal.set('Signing in with Facebook...');
      dispatch(reducerActions.authenticate.start());
      authentication.startSession.with.facebook()
        .catch(error => dispatch(reducerActions.authenticate.failure(error)));
    },
  },
  createUser: {
    withEmailAndPassword: ({ email, password }) => (dispatch) => {
      dispatch(reducerActions.authenticate.start());
      authentication.createUser.with.emailAndPassword(email, password)
        .catch(error => dispatch(reducerActions.authenticate.failure(error)));
    },
  },
  listen: () => async (dispatch) => {
    dispatch(reducerActions.listening());

    authentication.listen((user, error) => {
      if (error) {
        dispatch(reducerActions.authenticate.failure(error));
      } else if (user) {
        dispatch(reducerActions.authenticate.success(user));
      } else {
        dispatch(reducerActions.unauthenticate.success());
      }
    });
  },
  unauthenticate: () => (dispatch) => {
    focal.set('Signing out...');
    dispatch(reducerActions.unauthenticate.start());
    authentication.endSession()
      .catch(error => dispatch(reducerActions.unauthenticate.failure(error)));
  },
  error: {
    clear: reducerActions.error.clear,
  },
};

const initialState = {
  loading: true,
  error: undefined,
  user: {},
};

const reducer = (state = initialState, action) => {
  const { type, ...payload } = action;

  switch (type) {
    case actionTypes.unauthenticate.start:
    case actionTypes.authenticate.start:
      return {
        ...state,
        loading: true,
      };
    case actionTypes.authenticate.success:
      return {
        ...state,
        user: payload.user,
        loading: false,
      };
    case actionTypes.authenticate.failure:
      return {
        ...state,
        user: undefined,
        error: payload.error,
        loading: false,
      };
    case actionTypes.unauthenticate.success:
      return {
        ...state,
        user: undefined,
        loading: false,
      };
    case actionTypes.unauthenticate.failure:
      return {
        ...state,
        error: payload.error,
        loading: false,
      };
    case actionTypes.error.clear:
      return {
        ...state,
        error: undefined,
      };
    default:
      return state;
  }
};

const baseSelectors = {
  loading: state => state.auth.loading,
  user: state => state.auth.user,
  error: state => state.auth.error,
};

const derivedSelectors = {
  isAuthenticated: createSelector([baseSelectors.user], user => !!user),
  userPhoto: createSelector([baseSelectors.user], user => user.photoURL),
  errorMessage: createSelector([baseSelectors.error], error => error && error.message),
};

const selectors = {
  ...baseSelectors,
  ...derivedSelectors,
};

export {
  reducer, selectors, actions, actionTypes,
};
