import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AppStateProvider } from './state/AppState';

const renderApp = () =>
  render(
    <AppStateProvider>
      <App />
    </AppStateProvider>,
  );

describe('App', () => {
  beforeEach(() => localStorage.clear());
  // Vitest without `globals: true` doesn't auto-clean between renders.
  afterEach(cleanup);

  it('renders without crashing', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: 'MSM Helper' })).toBeDefined();
  });

  // The dataset holds "Rare X" and "Epic X" next to every common, so a loose /X/ role
  // query matches three buttons. Match the result label exactly instead.
  it('searches, pins a target, and shows its combos', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByPlaceholderText('Search monsters…'), 'bow');
    await user.click(screen.getByText('Bowgart', { exact: true }));

    expect(screen.getByRole('heading', { name: 'Bowgart' })).toBeDefined();
    // The wiki lists three combos for Bowgart; all must show, not just the first.
    const list = screen.getByRole('list', { name: 'Breeding combos' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getByText('Furcorn')).toBeDefined();
    expect(within(list).getByText('Toe Jammer')).toBeDefined();
  });

  it('restores the pinned target after a remount', async () => {
    const user = userEvent.setup();
    const first = renderApp();
    await user.type(screen.getByPlaceholderText('Search monsters…'), 'entbrat');
    await user.click(screen.getByText('Entbrat', { exact: true }));
    // The debounced write needs to land before we simulate reopening the app.
    await new Promise((r) => setTimeout(r, 400));
    first.unmount();

    renderApp();
    expect(screen.getByRole('heading', { name: 'Entbrat' })).toBeDefined();
  });

  it('lists nothing until the user types', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.queryByRole('list', { name: 'Search results' })).toBeNull();

    await user.type(screen.getByPlaceholderText('Search monsters…'), 'bow');
    expect(screen.getByRole('list', { name: 'Search results' })).toBeDefined();

    await user.clear(screen.getByPlaceholderText('Search monsters…'));
    expect(screen.queryByRole('list', { name: 'Search results' })).toBeNull();
  });

  it('filters the results by rarity', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByPlaceholderText('Search monsters…'), 'bowgart');
    const list = screen.getByRole('list', { name: 'Search results' });
    // Relevance wins, rarity only breaks the tie: the common leads its namesakes.
    expect(within(list).getByText('Bowgart', { exact: true })).toBeDefined();
    expect(within(list).getByText('Rare Bowgart')).toBeDefined();

    await user.selectOptions(screen.getByLabelText('Filter by rarity'), 'rare');
    const rares = screen.getByRole('list', { name: 'Search results' });
    expect(within(rares).getByText('Rare Bowgart')).toBeDefined();
    expect(within(rares).queryByText('Bowgart', { exact: true })).toBeNull();
    expect(within(rares).queryByText('Epic Bowgart')).toBeNull();
  });

  it('tells the user when a monster is bought, not bred', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByPlaceholderText('Search monsters…'), 'potbelly');
    await user.click(screen.getByText('Potbelly', { exact: true }));
    expect(screen.getByText(/Bought from the market/)).toBeDefined();
  });
});
