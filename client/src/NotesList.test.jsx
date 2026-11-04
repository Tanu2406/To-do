import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import NotesList from './NotesList';
import notesReducer from './store/notesSlice';

jest.mock('axios');
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
    axios.get.mockReturnValue(new Promise(() => {}));
    renderNotesList();
    expect(screen.getByLabelText('Notes')).toHaveAttribute('aria-busy', 'true');
  });

  test('renders notes returned by the API', async () => {
    axios.get.mockResolvedValue({ data: { data: [{ _id: '1', title: 'First note' }] } });
    renderNotesList();
    expect(await screen.findByText('First note')).toBeInTheDocument();
  });

  test('renders the empty state', async () => {
    axios.get.mockResolvedValue({ data: { data: [] } });
    renderNotesList();
    expect(await screen.findByText('No notes yet.')).toBeInTheDocument();
  });

  test('renders the API error state', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Could not load notes.' } } });
    renderNotesList();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load notes.');
  });
});
