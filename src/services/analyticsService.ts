import ReactGA from 'react-ga4';

const MEASUREMENT_ID = (import.meta as any).env.VITE_GA_MEASUREMENT_ID;

export const initAnalytics = () => {
  if (MEASUREMENT_ID) {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

export const trackPageView = (path: string) => {
  if (MEASUREMENT_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const trackEvent = (category: string, action: string, label?: string) => {
  if (MEASUREMENT_ID) {
    ReactGA.event({ category, action, label });
  }
};
