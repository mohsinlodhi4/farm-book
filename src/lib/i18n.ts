import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// English only for now. Urdu (RTL) is added once pilot farms confirm the terms they use.
const en = {
  nav: {
    dashboard: 'Dashboard',
    livestock: 'Livestock',
    production: 'Production',
    sales: 'Sales',
    purchases: 'Purchases',
    inventory: 'Inventory',
    money: 'Expenses & income',
    employees: 'Employees & payroll',
    reports: 'Reports',
    settings: 'Settings',
    account: 'My account',
    more: 'More',
  },
  role: { owner: 'Owner', manager: 'Farm manager', accountant: 'Accountant', worker: 'Worker' },
  category: { dairy: 'Dairy', livestock: 'Livestock / trading', poultry: 'Poultry', mixed: 'Mixed', other: 'Other' },
  common: {
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    add: 'Add',
    active: 'Active',
    inactive: 'Inactive',
    signOut: 'Sign out',
    loading: 'Loading…',
    noAccess: "You don't have access to this page.",
  },
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
