// app.js - Main application file with multilingual support and modern UI

// Language configuration
const availableLanguages = {
  en: { name: 'English', code: 'en' },
  ru: { name: 'Русский', code: 'ru' },
  de: { name: 'Deutsch', code: 'de' },
  sk: { name: 'Slovenčina', code: 'sk' },
  cs: { name: 'Čeština', code: 'cs' },
  fi: { name: 'Suomi', code: 'fi' },
  et: { name: 'Eesti', code: 'et' },
  da: { name: 'Dansk', code: 'da' },
  sv: { name: 'Svenska', code: 'sv' }, // Added Swedish language
  // Add more languages as needed
};

// Translations storage
let translations = {};
let currentLanguage = 'en';

// Initialize the application
async function initApp() {
  // Load user preferences
  const userLang = localStorage.getItem('preferredLanguage') || getBrowserLanguage() || 'en';
  await loadLanguage(userLang);
  
  // Initialize UI components
  initializeTheme();
  renderLanguageSelector();
  setupEventListeners();
  
  // Initialize Wialon SDK connection
  initWialonConnection();
}

// Get browser language
function getBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const shortLang = browserLang.split('-')[0];
  return availableLanguages[shortLang] ? shortLang : null;
}

// Load language file
async function loadLanguage(lang) {
  try {
    const response = await fetch(`locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load language: ${lang}`);
    }
    translations = await response.json();
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    
    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(translateElement);
    
    // Update date formats
    updateDateFormats();
    
    // Update direction for RTL languages if needed
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    
    // Update language display in the UI
    const langDisplay = document.querySelector('.language-display span');
    if (langDisplay) {
      langDisplay.textContent = availableLanguages[lang]?.name || lang;
    }
    
    // Mark the active language in the dropdown
    document.querySelectorAll('.language-option').forEach(option => {
      option.classList.toggle('active', option.getAttribute('data-lang') === lang);
    });
  } catch (error) {
    console.error('Error loading language:', error);
    if (lang !== 'en') {
      // Fallback to English
      loadLanguage('en');
    }
  }
}

// Check if language is RTL
function isRTL(lang) {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(lang);
}

// Translate a single element
function translateElement(element) {
  const key = element.getAttribute('data-i18n');
  if (key && translations[key]) {
    if (element.tagName === 'INPUT' && element.type === 'placeholder') {
      element.placeholder = translations[key];
    } else {
      element.textContent = translations[key];
    }
  }
}

// Translate function for dynamic content
function t(key, params = {}) {
  let text = translations[key] || key;
  
  // Replace parameters in the text
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
}

// Date formatting configuration
const localeFormats = {
  en: {
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    dateTimeFormat: 'MM/DD/YYYY h:mm A',
    shortDateFormat: 'MMM D, YYYY',
    firstDayOfWeek: 0, // Sunday
    decimalSeparator: '.',
    thousandSeparator: ',',
    distanceUnit: 'mi'
  },
  sv: {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'YYYY-MM-DD HH:mm',
    shortDateFormat: 'D MMM YYYY',
    firstDayOfWeek: 1, // Monday
    decimalSeparator: ',',
    thousandSeparator: ' ',
    distanceUnit: 'km'
  },
  // Add formats for other languages as well
  ru: {
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD.MM.YYYY HH:mm',
    shortDateFormat: 'D MMM YYYY',
    firstDayOfWeek: 1,
    decimalSeparator: ',',
    thousandSeparator: ' ',
    distanceUnit: 'км'
  },
  de: {
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD.MM.YYYY HH:mm',
    shortDateFormat: 'D. MMM YYYY',
    firstDayOfWeek: 1,
    decimalSeparator: ',',
    thousandSeparator: '.',
    distanceUnit: 'km'
  },
  // Add more languages as needed
};

// Month names for different locales
const monthNames = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  sv: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
  ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
};

// Get the current locale format settings
function getLocaleFormat() {
  return localeFormats[currentLanguage] || localeFormats.en;
}

// Format date according to locale
function formatDate(date, format = 'default') {
  const locale = getLocaleFormat();
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  let formatString;
  switch (format) {
    case 'short':
      formatString = locale.shortDateFormat;
      break;
    case 'time':
      formatString = locale.timeFormat;
      break;
    case 'datetime':
      formatString = locale.dateTimeFormat;
      break;
    case 'default':
    default:
      formatString = locale.dateFormat;
  }
  
  return formatDateWithLocale(dateObj, formatString, currentLanguage);
}

// Format number according to locale
function formatNumber(number, decimals = 0) {
  const locale = getLocaleFormat();
  
  // Format the number with the correct decimal and thousand separators
  let formatted = number.toFixed(decimals);
  
  if (locale.decimalSeparator !== '.') {
    formatted = formatted.replace('.', locale.decimalSeparator);
  }
  
  // Add thousand separators
  const parts = formatted.split(locale.decimalSeparator);
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, locale.thousandSeparator);
  
  return parts.join(locale.decimalSeparator);
}

// Format distance according to locale
function formatDistance(distance) {
  const locale = getLocaleFormat();
  const unit = locale.distanceUnit;
  
  // Convert distance if needed (assuming input is in km)
  let value = distance;
  if (unit === 'mi') {
    value = distance * 0.621371; // Convert km to miles
  }
  
  return `${formatNumber(value, 1)} ${unit}`;
}

// Simplified date formatter
function formatDateWithLocale(date, format, locale) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // Very basic implementation for demonstration
  let formatted = format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
    
  // Handle month names based on locale
  if (format.includes('MMM')) {
    const localeMonthNames = monthNames[locale] || monthNames.en;
    formatted = formatted.replace('MMM', localeMonthNames[date.getMonth()]);
  }
  
  return formatted;
}

// Update all date displays on the page
function updateDateFormats() {
  document.querySelectorAll('[data-date]').forEach(element => {
    const dateStr = element.getAttribute('data-date');
    const format = element.getAttribute('data-date-format') || 'default';
    element.textContent = formatDate(dateStr, format);
  });
  
  document.querySelectorAll('[data-distance]').forEach(element => {
    const distance = parseFloat(element.getAttribute('data-distance'));
    element.textContent = formatDistance(distance);
  });
}

// Initialize theme
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Add theme toggle in settings
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.checked = savedTheme === 'dark';
  }
}

// Render language selector
function renderLanguageSelector() {
  const langSelector = document.getElementById('language-selector');
  if (!langSelector) return;
  
  langSelector.innerHTML = '';
  
  Object.values(availableLanguages).forEach(lang => {
    const option = document.createElement('div');
    option.className = `language-option ${lang.code === currentLanguage ? 'active' : ''}`;
    option.setAttribute('data-lang', lang.code);
    option.textContent = lang.name;
    langSelector.appendChild(option);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Language selector
  document.getElementById('language-selector')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('language-option')) {
      const lang = e.target.getAttribute('data-lang');
      loadLanguage(lang);
    }
  });
  
  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('change', (e) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// Initialize logo
function initializeLogo() {
  const logo = document.getElementById('app-logo');
  if (!logo) return;
  
  // Check if the logo exists and handle any loading errors
  logo.onerror = function() {
    // If logo fails to load, fall back to text-only
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
      logoContainer.style.display = 'none';
    }
    
    // Make the text title more prominent
    const appTitle = document.querySelector('.app-title');
    if (appTitle) {
      appTitle.style.fontSize = '1.8rem';
      appTitle.style.margin = '10px 0';
    }
  };
  
  // If you have a dark mode version of the logo
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
  
  if (currentTheme === 'dark') {
    // Check if a dark version exists
    const darkLogo = new Image();
    darkLogo.src = 'assets/images/logo-dark.png';
    darkLogo.onload = function() {
      logo.classList.add('has-dark-version');
    };
  }
}

// Initialize Wialon connection
function initWialonConnection() {
  // Code to connect to Wialon API
  // This would interact with the existing Wialon SDK
  console.log('Wialon connection initialized');
}

// Document ready
document.addEventListener('DOMContentLoaded', function() {
  initApp();
  initializeLogo();
});