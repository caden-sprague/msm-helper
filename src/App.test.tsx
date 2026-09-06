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

  it('tells the user when a monster is bought, not bred', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByPlaceholderText('Search monsters…'), 'potbelly');
    await user.click(screen.getByText('Potbelly', { exact: true }));
    expect(screen.getByText(/Bought from the market/)).toBeDefined();
  });
});
