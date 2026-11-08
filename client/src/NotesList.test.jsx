import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import NotesList from './NotesList';
import notesReducer from './store/notesSlice';
import { apolloClient } from './apolloClient';

jest.mock('./apolloClient', () => ({
  apolloClient: { query: jest.fn(), mutate: jest.fn() },
}));
jest.mock('./api', () => ({ API_BASE_URL: 'http://localhost:3000/api' }));

const renderNotesList = () => {
  const store = configureStore({
    reducer: { notes: notesReducer, auth: () => ({ token: 'test-token' }) }
  });
  return render(<Provider store={store}><NotesList /></Provider>);
};

describe('NotesList', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows the loading state while notes are requested', async () => {
    apolloClient.query.mockReturnValue(new Promise(() => {}));
    renderNotesList();
    expect(screen.getByLabelText('Notes')).toHaveAttribute('aria-busy', 'true');
  });

  test('renders notes returned by the API', async () => {
    apolloClient.query.mockResolvedValue({ data: { tasks: [{ id: '1', task: 'First note', isCompleted: false }] } });
    renderNotesList();
    expect(await screen.findByText('First note')).toBeInTheDocument();
  });

  test('renders the empty state', async () => {
    apolloClient.query.mockResolvedValue({ data: { tasks: [] } });
    renderNotesList();
    expect(await screen.findByText('No notes yet.')).toBeInTheDocument();
  });

  test('renders the API error state', async () => {
    apolloClient.query.mockRejectedValue(new Error('Could not load notes.'));
    renderNotesList();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load notes.');
  });
});
