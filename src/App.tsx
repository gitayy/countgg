import { Routes, Route, useLocation } from 'react-router-dom';
import { useFetchUser } from './utils/hooks/useFetchUser';
import { useCounterConfig } from './utils/hooks/useFetchCounter';
import { AdminPage } from './pages/AdminPage';
import { AdminThreadPage } from './pages/AdminThreadPage';
import { UserContext } from './utils/contexts/UserContext';
import { CounterContext } from './utils/contexts/CounterContext';
import { RegisterPage } from './pages/RegisterPage';
import { Sidebar } from './components/Sidebar';
import { AdminApprovePage } from './pages/AdminApprovePage';
import { CookiesProvider, useCookies } from 'react-cookie';
import { socket, SocketContext } from './utils/contexts/SocketContext';
import { CounterPage } from './pages/CounterPage';
import { useState, useEffect, useMemo } from 'react';
import { SnackbarComponent } from './components/SnackbarComponent';
import { PrefsPage } from './pages/PrefsPage';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { ThreadsPage } from './pages/ThreadsPage';
import { createTheme, CssBaseline, darkScrollbar, PaletteMode, responsiveFontSizes, ThemeProvider, useMediaQuery } from '@mui/material';
import { blue, grey } from '@mui/material/colors';
import { ColorModeContext } from './utils/contexts/ColorModeContext';
import { StatsPage } from './pages/StatsPage';
import { CountersPage } from './pages/CountersPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AboutPage } from './pages/AboutPage';
import { DefaultPage } from './pages/DefaultPage';
import { ThreadPage } from './pages/ThreadPage';
import { UuidPage } from './pages/UuidPage';
import { IndividualCountPage } from './pages/IndividualCountPage';
import data from '@emoji-mart/data/sets/14/twitter.json'
import { init } from 'emoji-mart'
import { custom_emojis } from './utils/custom_emojis';
import { RulesPage } from './pages/RulesPage';
import { PostFinderPage } from './pages/PostFinderPage';
import ReactGA from 'react-ga4';

function App() {
  const { user, userLoading } = useFetchUser();
  const { counter, loading } = useCounterConfig();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<PaletteMode>(prefersDarkMode ? 'dark' : 'light');

  const GA_TR_ID = process.env.REACT_APP_GA_TR_ID || "G-0000000000"
  ReactGA.initialize(GA_TR_ID);

  useEffect(() => {
    if(user && user.pref_nightMode != 'System') {
      setMode(user.pref_nightMode === 'On' ? 'dark' : 'light');  
    } else {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode, user])

  const [snack, setSnack] = useState({
    message: '',
    color: '',
    open: false,
  });

  // Init emoji data
  init({ data: data, custom: custom_emojis })
  

  const getDesignTokens = (mode: PaletteMode) => ({
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'body': {
            backgroundColor: '#4d4d4d',
          },
          html: {
            ...darkScrollbar(
              mode === "light"
                ? {
                    track: grey[200],
                    thumb: grey[400],
                    active: grey[400]
                  }
                : undefined
            ),
            //scrollbarWidth for Firefox
            scrollbarWidth: "thin"
          }
        }
      }
    },
    palette: {
      mode,
      primary: {
        ...blue,
        ...(mode === 'dark' && {
          light: grey[700]
        }),
      },
      ...(mode === 'light' && {
        background: {
        },
      }),
      text: {
        ...(mode === 'light'
          ? {
              primary: grey[900],
              secondary: grey[800],
            }
          : {
              primary: grey[100],
              secondary: grey[500],
            }),
      },
      replyGold: {
        light: '#f2ee0e',
        dark: '#727200',
      },
      reply0: {
        light: '#ef7070',
        dark: '#4d0000',
      },
      reply100: {
        light: '#ffaeae',
        dark: '#980000',
      },
      reply200: {
        light: '#ffebba',
        dark: '#654700',
      },
      reply300: {
        light: '#cfffba',
        dark: '#216e00',
      },
      reply400: {
        light: '#a2e8af',
        dark: '#003b0b',
      },
      reply500: {
        light: '#adffed',
        dark: '#006b53',
      },
      reply600: {
        light: '#add6ff',
        dark: '#004183',
      },
      reply700: {
        light: '#bcadff',
        dark: '#14006c',
      },
      reply800: {
        light: '#e9adff',
        dark: '#460060',
      },
      reply900: {
        light: '#ffadf8',
        dark: '#6e0064',
      },
      reply1000: {
        light: '#ededed',
        dark: '#2a2a2a',
      },
    }
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) =>
          prevMode === 'light' ? 'dark' : 'light',
        );
      },
    }),
    [],
  );
  var theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  theme = responsiveFontSizes(theme);

  let location = useLocation();
  useEffect(() => {
    ReactGA.send({hitType: "pageview", page: location.pathname})
  }, [location]);

  useEffect(() => {
    ReactGA.initialize(GA_TR_ID);
  }, []);

  return (
      (user) ? (
        <>
        <LocalizationProvider dateAdapter={AdapterMoment}>
        <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserContext.Provider
      value={{user, userLoading}}
      >
        <CounterContext.Provider
      value={{counter, loading}}
      >
        <CookiesProvider>
        <SocketContext.Provider value={socket}>
          <Routes>
            <Route path="/*" element={<Sidebar />} />
          </Routes>
          {user && counter && (!loading) && <Routes><Route path="/*" element={<SnackbarComponent></SnackbarComponent>} /></Routes>}
          <Routes>
            <Route path="*" element={<div>Page Not Found</div>} />
            {counter && counter.roles.includes('admin') && <Route path="/admin" element={<AdminPage />} />}
            {counter && counter.roles.includes('admin') && <Route path="/admin/threads" element={<AdminThreadPage />} />}
            {counter && counter.roles.includes('admin') && <Route path="/admin/approve" element={<AdminApprovePage />} />}
            {counter && counter.roles.includes('discord_verified') && <Route path="/register" element={<RegisterPage />} />}
            <Route path="/" element={<DefaultPage />} />
            <Route path="/counter/:counterId" element={<CounterPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/threads" element={<ThreadsPage />} />
            <Route path="/thread/:thread_name">
              <Route index={true} element={<ThreadPage />} />
              <Route path="/thread/:thread_name/:count_uuid" element={<IndividualCountPage />} />
            </Route>
            <Route path="/counters" element={<CountersPage />} />
            <Route path="/uuid" element={<UuidPage />} />
            <Route path="/post-finder" element={<PostFinderPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact-us" element={<AboutPage />} />
            {user && counter && <Route path="/prefs" element={<PrefsPage />} />}
          </Routes>
          </SocketContext.Provider>
          </CookiesProvider>
          </CounterContext.Provider>
          </UserContext.Provider>
          </ThemeProvider>
          </ColorModeContext.Provider>
          </LocalizationProvider>
        </>
      ) : (
        <>
        <LocalizationProvider dateAdapter={AdapterMoment}>
        <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserContext.Provider
      value={{user, userLoading}}
      >
        <CounterContext.Provider
      value={{counter, loading}}>
          <Routes>
            <Route path="/*" element={<Sidebar />} />
          </Routes>
        <Routes>
          <Route path="*" element={<div>Page Not Found</div>} />
            <Route path="/" element={<DefaultPage />} />
            <Route path="/counter/:counterId" element={<CounterPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/threads" element={<ThreadsPage />} />
            <Route path="/thread/:thread_name">
              <Route index={true} element={<ThreadPage />} />
              <Route path="/thread/:thread_name/:count_uuid" element={<IndividualCountPage />} />
            </Route>
            <Route path="/counters" element={<CountersPage />} />
            <Route path="/uuid" element={<UuidPage />} />
            <Route path="/post-finder" element={<PostFinderPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact-us" element={<AboutPage />} />
        </Routes>
        </CounterContext.Provider>
        </UserContext.Provider>
        </ThemeProvider>
        </ColorModeContext.Provider>
        </LocalizationProvider>
        </>
      )
  );
}
export default App;

