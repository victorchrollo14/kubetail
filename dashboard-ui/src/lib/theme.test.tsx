// Copyright 2024 The Kubetail Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { act, render, screen } from '@testing-library/react';

import { ThemeProvider, UserPreference, useTheme } from './theme';

type MatchMediaListener = (event: MediaQueryListEvent) => void;

function createMatchMediaController(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<MatchMediaListener>();

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_event: 'change', listener: MatchMediaListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_event: 'change', listener: MatchMediaListener) => {
      listeners.delete(listener);
    }),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  return {
    matchMedia: vi.fn(() => mediaQueryList),
    setMatches(value: boolean) {
      matches = value;
      const event = { matches: value } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function ThemeConsumer() {
  const { theme, userPreference, setUserPreference } = useTheme();

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="preference">{userPreference}</span>
      <button type="button" onClick={() => setUserPreference(UserPreference.System)}>
        system
      </button>
      <button type="button" onClick={() => setUserPreference(UserPreference.Light)}>
        light
      </button>
      <button type="button" onClick={() => setUserPreference(UserPreference.Dark)}>
        dark
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>,
  );
}

describe('ThemeProvider', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
  });

  it('uses the system theme when there is no stored preference', () => {
    const matchMediaController = createMatchMediaController(true);
    vi.stubGlobal('matchMedia', matchMediaController.matchMedia);

    renderWithProvider();

    expect(screen.getByTestId('preference')).toHaveTextContent(UserPreference.System);
    expect(screen.getByTestId('theme')).toHaveTextContent('Dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('updates the theme when the system preference changes while using system mode', () => {
    const matchMediaController = createMatchMediaController(false);
    vi.stubGlobal('matchMedia', matchMediaController.matchMedia);

    renderWithProvider();

    act(() => {
      matchMediaController.setMatches(true);
    });

    expect(screen.getByTestId('preference')).toHaveTextContent(UserPreference.System);
    expect(screen.getByTestId('theme')).toHaveTextContent('Dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('ignores system preference changes after the user selects an explicit theme', () => {
    const matchMediaController = createMatchMediaController(false);
    vi.stubGlobal('matchMedia', matchMediaController.matchMedia);

    renderWithProvider();

    act(() => {
      screen.getByRole('button', { name: 'dark' }).click();
      matchMediaController.setMatches(false);
    });

    expect(screen.getByTestId('preference')).toHaveTextContent(UserPreference.Dark);
    expect(screen.getByTestId('theme')).toHaveTextContent('Dark');
    expect(localStorage.getItem('kubetail:theme')).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('syncs the theme from storage events fired by another tab', () => {
    const matchMediaController = createMatchMediaController(false);
    vi.stubGlobal('matchMedia', matchMediaController.matchMedia);

    renderWithProvider();

    act(() => {
      localStorage.setItem('kubetail:theme', 'dark');
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'kubetail:theme',
          newValue: 'dark',
        }),
      );
    });

    expect(screen.getByTestId('preference')).toHaveTextContent(UserPreference.Dark);
    expect(screen.getByTestId('theme')).toHaveTextContent('Dark');
    expect(document.documentElement).toHaveClass('dark');
  });
});
