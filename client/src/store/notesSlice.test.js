import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import notesReducer, { addNote, updateNote, deleteNote } from './notesSlice';

jest.mock('axios');
jest.mock('../api', () => ({ API_BASE_URL: 'http://localhost:3000/api' }));

const makeStore = () => configureStore({
  reducer: { notes: notesReducer, auth: () => ({ token: 'test-token' }) }
});

describe('notes API actions', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates a note', async () => {
    axios.post.mockResolvedValue({ data: { data: { _id: '1', title: 'New note', content: 'New note' } } });
    const store = makeStore();
    await store.dispatch(addNote({ title: 'New note', content: 'New note' }));
    expect(store.getState().notes.items[0].title).toBe('New note');
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/notes'), expect.any(Object), expect.any(Object));
  });

  test('updates a note', async () => {
    axios.put.mockResolvedValue({ data: { data: { _id: '1', title: 'Changed', content: 'Changed' } } });
    const store = makeStore();
    store.dispatch({ type: 'notes/fetch/fulfilled', payload: [{ _id: '1', title: 'Old', content: 'Old' }] });
    await store.dispatch(updateNote({ id: '1', title: 'Changed', content: 'Changed' }));
    expect(store.getState().notes.items[0].title).toBe('Changed');
  });

  test('deletes a note', async () => {
    axios.delete.mockResolvedValue({});
    const store = makeStore();
    store.dispatch({ type: 'notes/fetch/fulfilled', payload: [{ _id: '1', title: 'Delete me' }] });
    await store.dispatch(deleteNote('1'));
    expect(store.getState().notes.items).toEqual([]);
  });
});
