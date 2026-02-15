
import { useStore } from '../store';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

export const useTranslation = () => {
  const language = useStore(state => state.userConfig.language);
  return language === 'ru' ? ru : en;
};
