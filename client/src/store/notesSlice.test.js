import { configureStore } from '@reduxjs/toolkit';
import notesReducer, { addNote, updateNote, deleteNote } from './notesSlice';
import { apolloClient } from '../apolloClient';

jest.mock('../apolloClient', () => ({
  apolloClient: { query: jest.fn(), mutate: jest.fn() },
}));
jest.mock('../api', () => ({ API_BASE_URL: 'http://localhost:3000/api' }));

const makeStore = () => configureStore({
  reducer: { notes: notesReducer, auth: () => ({ token: 'test-token' }) }
});

describe('notes API actions', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates a note', async () => {
    apolloClient.mutate.mockResolvedValue({ data: { createTask: { id: '1', task: 'New note', isCompleted: false } } });
    const store = makeStore();
    await store.dispatch(addNote({ title: 'New note', content: 'New note' }));
    expect(store.getState().notes.items[0].title).toBe('New note');
    expect(apolloClient.mutate).toHaveBeenCalled();
  });

  test('updates a note', async () => {
    apolloClient.mutate.mockResolvedValue({ data: { updateTask: { id: '1', task: 'Changed', isCompleted: false } } });
    const store = makeStore();
    store.dispatch({ type: 'notes/fetch/fulfilled', payload: [{ _id: '1', title: 'Old', content: 'Old' }] });
    await store.dispatch(updateNote({ id: '1', title: 'Changed', content: 'Changed' }));
    expect(store.getState().notes.items[0].title).toBe('Changed');
  });

  test('deletes a note', async () => {
    apolloClient.mutate.mockResolvedValue({ data: { deleteTask: { taskId: '1' } } });
    const store = makeStore();
    store.dispatch({ type: 'notes/fetch/fulfilled', payload: [{ _id: '1', title: 'Delete me' }] });
    await store.dispatch(deleteNote('1'));
    expect(store.getState().notes.items).toEqual([]);
  });
});
