import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { api } from '../services/mockApi';
import { Trip, LedgerEntry, VehicleOwner, QuarryOwner, RoyaltyOwner, Customer, RateEntry, CustomerRate, Material, RoyaltyStock, Account, AccountCategory, DailyExpense, Advance } from '../types';
import { useAuth } from './AuthContext';

// Define the type for a new trip from the form
type NewTripData = Omit<Trip, 'id' | 'paymentStatus' | 'revenue' | 'materialCost' | 'transportCost' | 'royaltyCost' | 'profit' | 'status'>;

interface DataContextType {
  trips: Trip[];
  advances: Advance[];
  ledgerEntries: LedgerEntry[];
  vehicles: VehicleOwner[];
  quarries: QuarryOwner[];
  royaltyOwners: RoyaltyOwner[];
  customers: Customer[];
  royaltyStock: RoyaltyStock[];
  customerRates: CustomerRate[];
  materials: Material[];
  accounts: Account[];
  accountCategories: AccountCategory[];
  loading: boolean;
  
  addTrip: (trip: Omit<NewTripData, 'createdBy'>) => Promise<void>;
  updateTrip: (tripId: number, tripData: Partial<Trip>) => Promise<void>;
  deleteTrip: (tripId: number) => Promise<void>;

  addAdvance: (advance: Omit<Advance, 'id'>) => Promise<void>;
  updateAdvance: (id: string, data: Omit<Advance, 'id'>) => Promise<void>;
  deleteAdvance: (id: string) => Promise<void>;
  
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  updateLedgerEntry: (id: string, entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  deleteLedgerEntry: (id: string) => Promise<void>;
  
  getDailyExpenses: (supervisorName: string) => Promise<{ expenses: DailyExpense[], openingBalance: number }>;
  addDailyExpense: (expense: Omit<DailyExpense, 'id' | 'availableBalance' | 'closingBalance'>) => Promise<void>;
  updateDailyExpense: (id: string, expense: Omit<DailyExpense, 'id' | 'availableBalance' | 'closingBalance'>) => Promise<void>;
  deleteDailyExpense: (id: string) => Promise<void>;
  getSupervisorAccounts: () => Promise<string[]>;

  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  addAccountCategory: (category: Omit<AccountCategory, 'id'>) => Promise<void>;
  
  addVehicleOwner: (vehicleOwner: Omit<VehicleOwner, 'id'>) => Promise<void>;
  addTransportRate: (transportId: string, rate: Omit<RateEntry, 'id'>) => Promise<void>;
  updateTransportRate: (transportId: string, rate: RateEntry) => Promise<void>;
  deleteTransportRate: (transportId: string, rateId: string) => Promise<void>;
  
  addQuarryOwner: (quarryOwner: Omit<QuarryOwner, 'id'>) => Promise<void>;
  addQuarryRate: (quarryId: string, rate: Omit<RateEntry, 'id'>) => Promise<void>;
  updateQuarryRate: (quarryId: string, rate: RateEntry) => Promise<void>;
  deleteQuarryRate: (quarryId: string, rateId: string) => Promise<void>;

  addRoyaltyOwner: (royaltyOwner: Omit<RoyaltyOwner, 'id'>) => Promise<void>;
  addRoyaltyRate: (royaltyId: string, rate: Omit<RateEntry, 'id'>) => Promise<void>;
  updateRoyaltyRate: (royaltyId: string, rate: RateEntry) => Promise<void>;
  deleteRoyaltyRate: (royaltyId: string, rateId: string) => Promise<void>;
  
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  addCustomerRate: (customerId: string, rate: Omit<RateEntry, 'id'>) => Promise<void>;
  updateCustomerRate: (customerId: string, rate: RateEntry) => Promise<void>;
  deleteCustomerRate: (customerId: string, rateId: string) => Promise<void>;

  getRoyaltyStock: () => Promise<RoyaltyStock[]>;
  addRoyaltyStock: (stock: Omit<RoyaltyStock, 'id'>) => Promise<void>;

  refreshKey: number;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOwner[]>([]);
  const [quarries, setQuarries] = useState<QuarryOwner[]>([]);
  const [royaltyOwners, setRoyaltyOwners] = useState<RoyaltyOwner[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [royaltyStock, setRoyaltyStock] = useState<RoyaltyStock[]>([]);
  const [customerRates, setCustomerRates] = useState<CustomerRate[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountCategories, setAccountCategories] = useState<AccountCategory[]>([]);


  const refreshData = useCallback(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const [
            tripsData, advancesData, ledgerData, vehiclesData, quarriesData, royaltyData, customersData, customerRatesData, materialsData, royaltyStockData, accountsData, categoriesData
        ] = await Promise.all([
            api.getTrips(),
            api.getAdvances(),
            api.getLedgerEntries(),
            api.getVehicleOwners(),
            api.getQuarryOwners(),
            api.getRoyaltyOwners(),
            api.getCustomers(),
            api.getCustomerRates(),
            api.getMaterials(),
            api.getRoyaltyStock(),
            api.getAccounts(),
            api.getAccountCategories(),
        ]);
        setTrips(tripsData);
        setAdvances(advancesData);
        setLedgerEntries(ledgerData);
        setVehicles(vehiclesData);
        setQuarries(quarriesData);
        setRoyaltyOwners(royaltyData);
        setCustomers(customersData);
        setCustomerRates(customerRatesData);
        setMaterials(materialsData);
        setRoyaltyStock(royaltyStockData);
        setAccounts(accountsData);
        setAccountCategories(categoriesData);
        setLoading(false);
    }
    fetchData();
  }, [refreshKey]);

  const addTrip = async (trip: Omit<NewTripData, 'createdBy'>) => {
    if (!currentUser) throw new Error("User not authenticated");
    const newTripData = { ...trip, createdBy: currentUser.name };
    await api.addTrip(newTripData);
    refreshData();
  }
  
  const updateTrip = async (tripId: number, tripData: Partial<Trip>) => {
    await api.updateTrip(tripId, tripData);
    refreshData();
  };

  const deleteTrip = async (tripId: number) => {
    await api.deleteTrip(tripId);
    refreshData();
  };

  const addAdvance = async (advance: Omit<Advance, 'id'>) => { await api.addAdvance(advance); refreshData(); };
  const updateAdvance = async (id: string, data: Omit<Advance, 'id'>) => { await api.updateAdvance(id, data); refreshData(); };
  const deleteAdvance = async (id: string) => { await api.deleteAdvance(id); refreshData(); };

  const addLedgerEntry = async (entry: Omit<LedgerEntry, 'id'>) => {
    await api.addLedgerEntry(entry);
    refreshData();
  };

  const updateLedgerEntry = async (id: string, entry: Omit<LedgerEntry, 'id'>) => {
    await api.updateLedgerEntry(id, entry);
    refreshData();
  };

  const deleteLedgerEntry = async (id: string) => {
    await api.deleteLedgerEntry(id);
    refreshData();
  };
  
  const addAccount = async (account: Omit<Account, 'id'>) => {
    await api.addAccount(account);
    refreshData();
  };
  
  const addAccountCategory = async (category: Omit<AccountCategory, 'id'>) => {
    await api.addAccountCategory(category);
    refreshData();
  }

  const getDailyExpenses = useCallback(async (supervisorName: string) => api.getDailyExpenses(supervisorName), []);
  const addDailyExpense = async (expense: Omit<DailyExpense, 'id'|'availableBalance'|'closingBalance'>) => { await api.addDailyExpense(expense); };
  const updateDailyExpense = async (id: string, expense: Omit<DailyExpense, 'id'|'availableBalance'|'closingBalance'>) => { await api.updateDailyExpense(id, expense); };
  const deleteDailyExpense = async (id: string) => { await api.deleteDailyExpense(id); };
  const getSupervisorAccounts = useCallback(async () => api.getSupervisorAccounts(), []);

  const addVehicleOwner = async (vehicleOwner: Omit<VehicleOwner, 'id'>) => { await api.addVehicleOwner(vehicleOwner); refreshData(); };
  const addTransportRate = async (transportId: string, rate: Omit<RateEntry, 'id'>) => { await api.addTransportRate(transportId, rate); refreshData(); };
  const updateTransportRate = async (transportId: string, rate: RateEntry) => { await api.updateTransportRate(transportId, rate); refreshData(); };
  const deleteTransportRate = async (transportId: string, rateId: string) => { await api.deleteTransportRate(transportId, rateId); refreshData(); };

  const addQuarryOwner = async (quarryOwner: Omit<QuarryOwner, 'id'>) => { await api.addQuarryOwner(quarryOwner); refreshData(); };
  const addQuarryRate = async (quarryId: string, rate: Omit<RateEntry, 'id'>) => { await api.addQuarryRate(quarryId, rate); refreshData(); };
  const updateQuarryRate = async (quarryId: string, rate: RateEntry) => { await api.updateQuarryRate(quarryId, rate); refreshData(); };
  const deleteQuarryRate = async (quarryId: string, rateId: string) => { await api.deleteQuarryRate(quarryId, rateId); refreshData(); };

  const addRoyaltyOwner = async (royaltyOwner: Omit<RoyaltyOwner, 'id'>) => { await api.addRoyaltyOwner(royaltyOwner); refreshData(); };
  const addRoyaltyRate = async (royaltyId: string, rate: Omit<RateEntry, 'id'>) => { await api.addRoyaltyRate(royaltyId, rate); refreshData(); };
  const updateRoyaltyRate = async (royaltyId: string, rate: RateEntry) => { await api.updateRoyaltyRate(royaltyId, rate); refreshData(); };
  const deleteRoyaltyRate = async (royaltyId: string, rateId: string) => { await api.deleteRoyaltyRate(royaltyId, rateId); refreshData(); };

  const addCustomer = async (customer: Omit<Customer, 'id'>) => { await api.addCustomer(customer); refreshData(); };
  const addCustomerRate = async (customerId: string, rate: Omit<RateEntry, 'id'>) => { await api.addCustomerRate(customerId, rate); refreshData(); };
  const updateCustomerRate = async (customerId: string, rate: RateEntry) => { await api.updateCustomerRate(customerId, rate); refreshData(); };
  const deleteCustomerRate = async (customerId: string, rateId: string) => { await api.deleteCustomerRate(customerId, rateId); refreshData(); };
  
  const getRoyaltyStock = async () => api.getRoyaltyStock();
  const addRoyaltyStock = async (stock: Omit<RoyaltyStock, 'id'>) => { await api.addRoyaltyStock(stock); refreshData(); };

  const value = {
    trips,
    advances,
    ledgerEntries,
    vehicles,
    quarries,
    royaltyOwners,
    customers,
    royaltyStock,
    customerRates,
    materials,
    accounts,
    accountCategories,
    loading,
    addTrip,
    updateTrip,
    deleteTrip,
    addAdvance,
    updateAdvance,
    deleteAdvance,
    addLedgerEntry,
    updateLedgerEntry,
    deleteLedgerEntry,
    getDailyExpenses,
    addDailyExpense,
    updateDailyExpense,
    deleteDailyExpense,
    getSupervisorAccounts,
    addAccount,
    addAccountCategory,
    addVehicleOwner,
    addTransportRate, updateTransportRate, deleteTransportRate,
    addQuarryOwner,
    addQuarryRate, updateQuarryRate, deleteQuarryRate,
    addRoyaltyOwner,
    addRoyaltyRate, updateRoyaltyRate, deleteRoyaltyRate,
    addCustomer,
    addCustomerRate, updateCustomerRate, deleteCustomerRate,
    getRoyaltyStock, addRoyaltyStock,
    refreshKey,
    refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};