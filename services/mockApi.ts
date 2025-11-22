import { Trip, Payment, PaymentType, ChartData, User, Role, Notification, LedgerEntry, VehicleOwner, QuarryOwner, RoyaltyOwner, Customer, RateEntry, CustomerRate, Material, RoyaltyStock, Account, AccountCategory, DailyExpense, Advance } from '../types';
import { v4 as uuidv4 } from 'uuid';

// --- MOCK DATA ---

const mockUsers: User[] = [
    { id: 1, name: 'Admin User', role: Role.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin', password: 'malli275' },
    { id: 2, name: 'Manager User', role: Role.MANAGER, avatar: 'https://i.pravatar.cc/150?u=manager', password: 'password' },
    { id: 3, name: 'Driver User', role: Role.DRIVER, avatar: 'https://i.pravatar.cc/150?u=driver', password: 'password' },
    { id: 4, name: 'Malli', role: Role.SUPERVISOR, avatar: 'https://i.pravatar.cc/150?u=malli', password: 'password' },
];

const mockNotifications: Notification[] = [
    { id: 1, message: 'Trip INV-001 has been marked as paid.', type: 'success', timestamp: new Date().toISOString(), read: false },
    { id: 2, message: 'Royalty stock is low. Please purchase more.', type: 'alert', timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), read: false },
    { id: 3, message: 'New vehicle TN03EF7890 added to Fast Transports.', type: 'info', timestamp: new Date(Date.now() - 3600 * 2000).toISOString(), read: true },
];

const importedTrips: Omit<Trip, 'id' | 'paymentStatus' | 'revenue' | 'materialCost' | 'transportCost' | 'royaltyCost' | 'profit' | 'vendorName' | 'tonnage' | 'status' | 'createdBy'>[] = [
    { date: "2025-02-01", place: "Site A", customer: "ABC Corp", invoiceDCNumber: "INV-001", quarryName: "Rock Quarry", royaltyOwnerName: "Govt. Mines Dept.", material: "Gravel", vehicleNumber: "TN01AB1234", transporterName: "Fast Transports", emptyWeight: 5.2, grossWeight: 25.5, netWeight: 20.3, royaltyNumber: "ROY-001", royaltyTons: 20.3, royaltyM3: 14.21, deductionPercentage: 1.5, sizeChangePercentage: 0 },
    { date: "2025-02-01", place: "Site B", customer: "XYZ Infra", invoiceDCNumber: "INV-002", quarryName: "Riverbed Mining", royaltyOwnerName: "Govt. Mines Dept.", material: "Sand", vehicleNumber: "TN02CD5678", transporterName: "Speedy Logistics", emptyWeight: 6, grossWeight: 31, netWeight: 25, royaltyNumber: "ROY-002", royaltyTons: 25, royaltyM3: 17.5, deductionPercentage: 2, sizeChangePercentage: 0 },
];

let mockTrips: Trip[] = []; 

// Updated to new detailed LedgerEntry structure
let mockLedgerEntries: LedgerEntry[] = [
    // Capital Infusion & Loans
    { id: uuidv4(), date: "2025-01-15", from: "Share Capital", via: "Bank Transfer", to: "Company Bank Account", actualTo: "Company Bank Account", amount: 500000, toBank: "HDFC", split: "NO", paymentSubType: "Initial Investment", paymentType: "Capital", remarks: "Initial capital infusion", type: 'CREDIT' },
    { id: uuidv4(), date: "2025-01-20", from: "Bank Loan", via: "Loan Disbursal", to: "Company Bank Account", actualTo: "Company Bank Account", amount: 200000, toBank: "HDFC", split: "NO", paymentSubType: "Working Capital Loan", paymentType: "Loan", remarks: "Loan for operational expenses", type: 'CREDIT' },
    // Vendor Payments
    { id: uuidv4(), date: "2025-02-05", from: "Company Bank Account", via: "NEFT", to: "Fast Transports", actualTo: "Fast Transports Bank", amount: 50000, toBank: "ICICI", split: "NO", paymentSubType: "January Transport Bills", paymentType: "Transport", remarks: "Payment for transport services", type: 'DEBIT' },
    { id: uuidv4(), date: "2025-02-06", from: "Company Bank Account", via: "Cash", to: "Rock Quarry", actualTo: "Quarry Manager", amount: 75000, toBank: "", split: "NO", paymentSubType: "Material Purchase", paymentType: "Quarry", remarks: "Advance for gravel", type: 'DEBIT' },
    // Customer Receipts
    { id: uuidv4(), date: "2025-02-10", from: "ABC Corp", via: "IMPS", to: "Company Bank Account", actualTo: "Company Bank Account", amount: 120000, toBank: "HDFC", split: "NO", paymentSubType: "Invoice INV-001", paymentType: "Customer Payment", remarks: "Payment received for INV-001", type: 'CREDIT' },
    // Operational Expenses
    { id: uuidv4(), date: "2025-02-12", from: "Company Bank Account", via: "UPI", to: "Office Rent", actualTo: "Landlord Account", amount: 25000, toBank: "SBI", split: "NO", paymentSubType: "February Rent", paymentType: "Office Maintenance", remarks: "Monthly office rent", type: 'DEBIT' },
];

let mockVehicleOwners: VehicleOwner[] = [
    { id: uuidv4(), ownerName: "Fast Transports", contactNumber: "9876543210", address: "123 Transport Nagar", vehicleNumber: "TN01AB1234", vehicleType: "Truck", vehicleCapacity: 25, openingBalance: -50000, rates: [
        { id: uuidv4(), fromSite: "Rock Quarry", materialType: "Gravel", ratePerTon: 150, gst: 'exclusive', gstPercentage: 5, gstAmount: 7.5, totalRate: 157.5, effectiveFrom: "2025-01-01", effectiveTo: "", active: 'active', remarks: 'Standard rate' }
    ]},
    { id: uuidv4(), ownerName: "Speedy Logistics", contactNumber: "9876543211", address: "456 Logistics Hub", vehicleNumber: "TN02CD5678", vehicleType: "Truck", vehicleCapacity: 30, openingBalance: 0, rates: [
         { id: uuidv4(), fromSite: "Riverbed Mining", materialType: "Sand", ratePerTon: 120, gst: '', gstPercentage: 0, gstAmount: 0, totalRate: 120, effectiveFrom: "2025-01-01", effectiveTo: "", active: 'active', remarks: 'Standard rate' }
    ]},
];

let mockQuarryOwners: QuarryOwner[] = [
    { id: uuidv4(), ownerName: "Rock Quarry Inc.", quarryName: "Rock Quarry", contactNumber: "8765432109", address: "Quarry Road", quarryArea: 10, openingBalance: -75000, rates: [
        { id: uuidv4(), fromSite: "Rock Quarry", materialType: "Gravel", ratePerTon: 300, gst: 'inclusive', gstPercentage: 5, gstAmount: 14.29, totalRate: 300, effectiveFrom: "2025-01-01", effectiveTo: "", active: 'active', remarks: 'Standard rate' }
    ]},
    { id: uuidv4(), ownerName: "Sand Miners Co.", quarryName: "Riverbed Mining", contactNumber: "8765432108", address: "River Bank", quarryArea: 5, openingBalance: 0, rates: [
        { id: uuidv4(), fromSite: "Riverbed Mining", materialType: "Sand", ratePerTon: 250, gst: '', gstPercentage: 0, gstAmount: 0, totalRate: 250, effectiveFrom: "2025-01-01", effectiveTo: "", active: 'active', remarks: 'Standard rate' }
    ]},
];
let mockRoyaltyOwners: RoyaltyOwner[] = [
     { id: uuidv4(), ownerName: "Govt. Mines Dept.", contactNumber: "N/A", address: "Govt. Office", quarryArea: 100, openingBalance: 0, rates: [
        { id: uuidv4(), fromSite: "Rock Quarry", materialType: "Gravel", ratePerM3: 50, gst: '', gstPercentage: 0, gstAmount: 0, totalRate: 50, effectiveFrom: "2025-01-01", effectiveTo: "", active: 'active', remarks: 'Standard royalty' }
     ]}
];
let mockCustomers: Customer[] = [
    { id: uuidv4(), name: "ABC Corp", contactNumber: "7654321098", address: "Construction Site A", openingBalance: 120000, rates: [
        { id: uuidv4(), fromSite: "Rock Quarry", materialType: "Gravel", ratePerTon: 600, gst: 'exclusive', gstPercentage: 5, gstAmount: 30, totalRate: 630, effectiveFrom: "2025-01-01", effectiveTo: "", active: 'active', remarks: 'Standard rate' }
    ]},
    { id: uuidv4(), name: "XYZ Infra", contactNumber: "7654321097", address: "Infra Project B", openingBalance: 0, rates: [
        { id: uuidv4(), fromSite: "Riverbed Mining", materialType: "Sand", ratePerTon: 500, gst: '', gstPercentage: 0, gstAmount: 0, totalRate: 500, effectiveFrom: "2025-01-01", effectiveTo: "", active: 'active', remarks: 'Standard rate' }
    ]},
];
let mockCustomerRates: CustomerRate[] = [];
let mockMaterials: Material[] = [
    { id: 1, name: "Gravel", costPerTon: "300", costPerCubicMeter: "420" },
    { id: 2, name: "Sand", costPerTon: "250", costPerCubicMeter: "350" }
];
let mockRoyaltyStock: RoyaltyStock[] = [
    { id: uuidv4(), purchaseDate: '2025-01-10', quantity: 1000, cost: 50000 }
];

let mockAccountCategories: AccountCategory[] = [
    { id: '1', name: 'Customer' },
    { id: '2', name: 'Vendor-Transport' },
    { id: '3', name: 'Vendor-Quarry' },
    { id: '4', name: 'Vendor-Royalty' },
    { id: '5', name: 'Bank Account' },
    { id: '6', name: 'Capital & Loans' },
    { id: '7', name: 'Investment' },
    { id: '8', name: 'Personal Funds' },
    { id: '9', name: 'Operational Expense' },
];

let mockAccounts: Account[] = [];

let dailyExpensesStore: { [supervisor: string]: { openingBalance: number, expenses: DailyExpense[] } } = {
    'Malli': {
        openingBalance: 50000,
        expenses: []
    }
};
const getSupervisorAccounts = async (): Promise<string[]> => {
    return Promise.resolve(Object.keys(dailyExpensesStore));
}

let mockAdvances: Advance[] = [];

// --- INITIALIZATION ---
const initializeData = () => {
    // Combine all entities into the accounts list
    mockAccounts = [
        ...mockCustomers.map(c => ({ id: c.id, name: c.name, categoryId: '1', categoryName: 'Customer' })),
        ...mockVehicleOwners.map(v => ({ id: v.id, name: v.ownerName, categoryId: '2', categoryName: 'Vendor-Transport' })),
        ...mockQuarryOwners.map(q => ({ id: q.id, name: q.ownerName, categoryId: '3', categoryName: 'Vendor-Quarry' })),
        ...mockRoyaltyOwners.map(r => ({ id: r.id, name: r.ownerName, categoryId: '4', categoryName: 'Vendor-Royalty' })),
        // Add some example non-vendor/customer accounts
        { id: uuidv4(), name: 'Company Bank Account', categoryId: '5', categoryName: 'Bank Account' },
        { id: uuidv4(), name: 'Share Capital', categoryId: '6', categoryName: 'Capital & Loans' },
        { id: uuidv4(), name: 'Bank Loan', categoryId: '6', categoryName: 'Capital & Loans' },
        { id: uuidv4(), name: 'Office Rent', categoryId: '9', categoryName: 'Operational Expense' },
        { id: uuidv4(), name: 'Malli', categoryId: '9', categoryName: 'Operational Expense' },
    ];

    mockTrips = importedTrips.map((trip, index) => {
        const tonnage = trip.netWeight;
        const materialRate = mockQuarryOwners.find(q => q.quarryName === trip.quarryName)?.rates.find(r => r.active === 'active')?.ratePerTon || 0;
        const transportRate = mockVehicleOwners.find(v => v.vehicleNumber === trip.vehicleNumber)?.rates.find(r => r.active === 'active')?.ratePerTon || 0;
        const royaltyRate = mockRoyaltyOwners.find(r => r.ownerName === trip.royaltyOwnerName)?.rates.find(r => r.active === 'active')?.ratePerM3 || 0;
        const customerRate = mockCustomers.find(c => c.name === trip.customer)?.rates.find(r => r.active === 'active')?.ratePerTon || 0;

        const materialCost = materialRate * tonnage;
        const transportCost = transportRate * tonnage;
        const royaltyCost = royaltyRate * trip.royaltyM3;
        const revenue = customerRate * tonnage;
        const profit = revenue - (materialCost + transportCost + royaltyCost);
        
        return {
            ...trip,
            id: index + 1,
            paymentStatus: 'unpaid',
            vendorName: mockQuarryOwners.find(q => q.quarryName === trip.quarryName)?.ownerName || 'N/A',
            tonnage,
            materialCost,
            transportCost,
            royaltyCost,
            revenue,
            profit,
            status: 'completed',
            createdBy: 'Admin User'
        };
    });
};

initializeData();

// --- API FUNCTIONS ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
    // USER
    login: async (username: string, password_provided: string): Promise<User | undefined> => {
        await delay(300);
        const user = mockUsers.find(user => user.name === username);
        if (user && user.password === password_provided) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return undefined;
    },
    getUsers: async (): Promise<User[]> => {
        await delay(100);
        return mockUsers.map(({ password, ...user }) => user); // Don't send passwords to client
    },
    updateUser: async (userId: number, userData: Partial<User>): Promise<void> => {
        await delay(300);
        const userIndex = mockUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
             // Simulate avatar change if name changes
            if (userData.name && userData.name !== mockUsers[userIndex].name) {
                mockUsers[userIndex].avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(userData.name)}`;
            }
            mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
        }
    },
    
    // NOTIFICATIONS
    getNotifications: async (): Promise<Notification[]> => {
        await delay(100);
        return mockNotifications;
    },
    
    // TRIPS
    getTrips: async (): Promise<Trip[]> => {
        await delay(100);
        return [...mockTrips].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    addTrip: async (trip: Omit<Trip, 'id' | 'paymentStatus' | 'revenue' | 'materialCost' | 'transportCost' | 'royaltyCost' | 'profit' | 'status'>): Promise<Trip> => {
        await delay(500);
        const tonnage = trip.netWeight;
        const materialRate = mockQuarryOwners.find(q => q.quarryName === trip.quarryName)?.rates.find(r => r.active === 'active')?.ratePerTon || 0;
        const transportRate = mockVehicleOwners.find(v => v.vehicleNumber === trip.vehicleNumber)?.rates.find(r => r.active === 'active')?.ratePerTon || 0;
        const royaltyRate = mockRoyaltyOwners.find(r => r.ownerName === trip.royaltyOwnerName)?.rates.find(r => r.active === 'active')?.ratePerM3 || 0;
        const customerRate = mockCustomers.find(c => c.name === trip.customer)?.rates.find(r => r.active === 'active')?.ratePerTon || 0;

        const materialCost = materialRate * tonnage;
        const transportCost = transportRate * tonnage;
        const royaltyCost = royaltyRate * trip.royaltyM3;
        const revenue = customerRate * tonnage;
        const profit = revenue - (materialCost + transportCost + royaltyCost);

        const newTrip: Trip = {
            ...trip,
            id: Math.max(0, ...mockTrips.map(t => t.id)) + 1,
            paymentStatus: 'unpaid',
            status: 'pending upload',
            tonnage,
            materialCost,
            transportCost,
            royaltyCost,
            revenue,
            profit
        };
        mockTrips.push(newTrip);
        return newTrip;
    },
    updateTrip: async (tripId: number, tripData: Partial<Trip>): Promise<Trip> => {
        await delay(500);
        const tripIndex = mockTrips.findIndex(t => t.id === tripId);
        if (tripIndex === -1) throw new Error("Trip not found");
        
        const originalTrip = mockTrips[tripIndex];
        const updatedTrip = { ...originalTrip, ...tripData };
        
        // If it was just entered and now has upload info, mark as in transit
        if (originalTrip.status === 'pending upload' && (tripData.ewayBillUpload || tripData.waymentSlipUpload)) {
            updatedTrip.status = 'in transit';
        }

        // If it was in transit and now has receiving info, mark as pending validation
        if (originalTrip.status === 'in transit' && tripData.receivedDate) {
            updatedTrip.status = 'pending validation';
        }
        
        mockTrips[tripIndex] = updatedTrip;
        return updatedTrip;
    },
    deleteTrip: async (tripId: number): Promise<void> => {
        await delay(500);
        mockTrips = mockTrips.filter(t => t.id !== tripId);
    },
    
    // FINANCIALS
    getDailySummary: async (): Promise<any> => {
        await delay(100);
        return mockTrips.reduce((acc, trip) => {
            acc.totalTrips += 1;
            acc.totalRevenue += trip.revenue;
            acc.totalCost += trip.materialCost + trip.transportCost + trip.royaltyCost;
            acc.totalProfit += trip.profit;
            return acc;
        }, { totalTrips: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0 });
    },
    getFinancialStatus: async (): Promise<any> => {
        await delay(100);
        return {
            outstandingCustomer: 150000,
            outstandingTransporter: 80000,
            outstandingQuarry: 120000,
        }
    },
    getProfitByDay: async (): Promise<ChartData[]> => {
        await delay(100);
        const data: { [key: string]: number } = {};
        mockTrips.forEach(trip => {
            data[trip.date] = (data[trip.date] || 0) + trip.profit;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    },
    getCostBreakdown: async (): Promise<ChartData[]> => {
        await delay(100);
        const data = mockTrips.reduce((acc, trip) => {
            acc.material += trip.materialCost;
            acc.transport += trip.transportCost;
            acc.royalty += trip.royaltyCost;
            return acc;
        }, { material: 0, transport: 0, royalty: 0 });
        return [
            { name: "Material", value: data.material },
            { name: "Transport", value: data.transport },
            { name: "Royalty", value: data.royalty },
        ];
    },
    getLedgerEntries: async(): Promise<LedgerEntry[]> => {
        await delay(100);
        return mockLedgerEntries;
    },
    addLedgerEntry: async(entry: Omit<LedgerEntry, 'id'>): Promise<void> => {
        await delay(300);
        mockLedgerEntries.push({ ...entry, id: uuidv4() });
    },
    updateLedgerEntry: async (id: string, entry: Omit<LedgerEntry, 'id'>): Promise<void> => {
        await delay(300);
        const index = mockLedgerEntries.findIndex(e => e.id === id);
        if (index !== -1) {
            mockLedgerEntries[index] = { ...entry, id };
        }
    },
    deleteLedgerEntry: async (id: string): Promise<void> => {
        await delay(300);
        mockLedgerEntries = mockLedgerEntries.filter(e => e.id !== id);
    },

    // Master Data
    getVehicleOwners: async (): Promise<VehicleOwner[]> => { await delay(100); return mockVehicleOwners; },
    addVehicleOwner: async(owner: Omit<VehicleOwner, 'id'>) => { await delay(300); mockVehicleOwners.push({ ...owner, id: uuidv4() }); initializeData(); },
    addTransportRate: async(transportId: string, rate: Omit<RateEntry, 'id'>) => {
        await delay(300);
        const owner = mockVehicleOwners.find(v => v.id === transportId);
        if(owner) {
            if(rate.active === 'active') owner.rates.forEach(r => r.active = 'not active');
            owner.rates.push({ ...rate, id: uuidv4() });
        }
    },
    updateTransportRate: async(transportId: string, rate: RateEntry) => {
        await delay(300);
        const owner = mockVehicleOwners.find(v => v.id === transportId);
        if(owner) {
            if(rate.active === 'active') owner.rates.forEach(r => r.active = 'not active');
            const rateIndex = owner.rates.findIndex(r => r.id === rate.id);
            if(rateIndex !== -1) owner.rates[rateIndex] = rate;
        }
    },
    deleteTransportRate: async(transportId: string, rateId: string) => {
        await delay(300);
        const owner = mockVehicleOwners.find(v => v.id === transportId);
        if(owner) owner.rates = owner.rates.filter(r => r.id !== rateId);
    },

    getQuarryOwners: async (): Promise<QuarryOwner[]> => { await delay(100); return mockQuarryOwners; },
    addQuarryOwner: async(owner: Omit<QuarryOwner, 'id'>) => { await delay(300); mockQuarryOwners.push({ ...owner, id: uuidv4() }); initializeData(); },
    addQuarryRate: async(quarryId: string, rate: Omit<RateEntry, 'id'>) => {
        await delay(300);
        const owner = mockQuarryOwners.find(q => q.id === quarryId);
        if(owner) {
            if(rate.active === 'active') owner.rates.forEach(r => r.active = 'not active');
            owner.rates.push({ ...rate, id: uuidv4() });
        }
    },
    updateQuarryRate: async(quarryId: string, rate: RateEntry) => {
        await delay(300);
        const owner = mockQuarryOwners.find(q => q.id === quarryId);
        if(owner) {
            if(rate.active === 'active') owner.rates.forEach(r => r.active = 'not active');
            const rateIndex = owner.rates.findIndex(r => r.id === rate.id);
            if(rateIndex !== -1) owner.rates[rateIndex] = rate;
        }
    },
    deleteQuarryRate: async(quarryId: string, rateId: string) => {
        await delay(300);
        const owner = mockQuarryOwners.find(q => q.id === quarryId);
        if(owner) owner.rates = owner.rates.filter(r => r.id !== rateId);
    },

    getRoyaltyOwners: async (): Promise<RoyaltyOwner[]> => { await delay(100); return mockRoyaltyOwners; },
    addRoyaltyOwner: async(owner: Omit<RoyaltyOwner, 'id'>) => { await delay(300); mockRoyaltyOwners.push({ ...owner, id: uuidv4() }); initializeData(); },
    addRoyaltyRate: async(royaltyId: string, rate: Omit<RateEntry, 'id'>) => {
        await delay(300);
        const owner = mockRoyaltyOwners.find(r => r.id === royaltyId);
        if(owner) {
            if(rate.active === 'active') owner.rates.forEach(r => r.active = 'not active');
            owner.rates.push({ ...rate, id: uuidv4() });
        }
    },
    updateRoyaltyRate: async(royaltyId: string, rate: RateEntry) => {
        await delay(300);
        const owner = mockRoyaltyOwners.find(r => r.id === royaltyId);
        if(owner) {
            if(rate.active === 'active') owner.rates.forEach(r => r.active = 'not active');
            const rateIndex = owner.rates.findIndex(r => r.id === rate.id);
            if(rateIndex !== -1) owner.rates[rateIndex] = rate;
        }
    },
    deleteRoyaltyRate: async(royaltyId: string, rateId: string) => {
        await delay(300);
        const owner = mockRoyaltyOwners.find(r => r.id === royaltyId);
        if(owner) owner.rates = owner.rates.filter(r => r.id !== rateId);
    },
    
    getCustomers: async (): Promise<Customer[]> => { await delay(100); return mockCustomers; },
    addCustomer: async(customer: Omit<Customer, 'id'>) => { await delay(300); mockCustomers.push({ ...customer, id: uuidv4() }); initializeData(); },
    addCustomerRate: async(customerId: string, rate: Omit<RateEntry, 'id'>) => {
        await delay(300);
        const owner = mockCustomers.find(c => c.id === customerId);
        if(owner) {
            if(rate.active === 'active') owner.rates.forEach(r => r.active = 'not active');
            owner.rates.push({ ...rate, id: uuidv4() });
        }
    },
    updateCustomerRate: async(customerId: string, rate: RateEntry) => {
        await delay(300);
        const owner = mockCustomers.find(c => c.id === customerId);
        if(owner) {
            if(rate.active === 'active') owner.rates.forEach(r => r.active = 'not active');
            const rateIndex = owner.rates.findIndex(r => r.id === rate.id);
            if(rateIndex !== -1) owner.rates[rateIndex] = rate;
        }
    },
    deleteCustomerRate: async(customerId: string, rateId: string) => {
        await delay(300);
        const owner = mockCustomers.find(c => c.id === customerId);
        if(owner) owner.rates = owner.rates.filter(r => r.id !== rateId);
    },

    getCustomerRates: async (): Promise<CustomerRate[]> => { await delay(100); return mockCustomerRates; },
    getMaterials: async (): Promise<Material[]> => { await delay(100); return mockMaterials; },
    getRoyaltyStock: async(): Promise<RoyaltyStock[]> => { await delay(100); return mockRoyaltyStock; },
    addRoyaltyStock: async(stock: Omit<RoyaltyStock, 'id'>): Promise<void> => {
        await delay(300);
        mockRoyaltyStock.push({ ...stock, id: uuidv4() });
    },

    // Chart of Accounts
    getAccounts: async(): Promise<Account[]> => { await delay(100); return mockAccounts; },
    addAccount: async(account: Omit<Account, 'id'>) => { await delay(300); mockAccounts.push({ ...account, id: uuidv4() }); },
    getAccountCategories: async(): Promise<AccountCategory[]> => { await delay(100); return mockAccountCategories; },
    addAccountCategory: async(category: Omit<AccountCategory, 'id'>) => { await delay(300); mockAccountCategories.push({ ...category, id: uuidv4() }); },
    
    // Daily Expenses
    getDailyExpenses: async (supervisorName: string): Promise<{ expenses: DailyExpense[], openingBalance: number }> => {
        await delay(100);
        const data = dailyExpensesStore[supervisorName];
        if (!data) return { expenses: [], openingBalance: 0 };
        return JSON.parse(JSON.stringify(data)); // Deep copy
    },
    addDailyExpense: async (expense: Omit<DailyExpense, 'id' | 'availableBalance' | 'closingBalance'>): Promise<void> => {
        await delay(300);
        const store = dailyExpensesStore[expense.from];
        if (!store) return;
        
        const sorted = [...store.expenses].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const lastExpense = sorted[sorted.length - 1];
        const availableBalance = lastExpense ? lastExpense.closingBalance : store.openingBalance;
        
        const amountChange = expense.type === 'DEBIT' ? -expense.amount : expense.amount;

        const newExpense: DailyExpense = {
            ...expense,
            id: uuidv4(),
            availableBalance,
            closingBalance: availableBalance + amountChange
        };
        store.expenses.push(newExpense);
    },
    updateDailyExpense: async (id: string, expenseData: Omit<DailyExpense, 'id' | 'availableBalance' | 'closingBalance'>): Promise<void> => {
        await delay(300);
        const store = dailyExpensesStore[expenseData.from];
        if (!store) return;
        const index = store.expenses.findIndex(e => e.id === id);
        if (index > -1) {
            const oldExpense = store.expenses[index];
            const updatedExpense = { ...oldExpense, ...expenseData };
            store.expenses[index] = updatedExpense;

            // Recalculate balances for subsequent expenses
            const sorted = store.expenses.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            for(let i = 0; i < sorted.length; i++) {
                const prevBalance = i > 0 ? sorted[i-1].closingBalance : store.openingBalance;
                const amountChange = sorted[i].type === 'DEBIT' ? -sorted[i].amount : sorted[i].amount;
                sorted[i].availableBalance = prevBalance;
                sorted[i].closingBalance = prevBalance + amountChange;
            }
        }
    },
    deleteDailyExpense: async (id: string): Promise<void> => {
        await delay(300);
        for (const supervisor in dailyExpensesStore) {
             const store = dailyExpensesStore[supervisor];
             const initialLength = store.expenses.length;
             store.expenses = store.expenses.filter(e => e.id !== id);
             if (store.expenses.length < initialLength) {
                 // Recalculate balances
                const sorted = store.expenses.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                for(let i = 0; i < sorted.length; i++) {
                    const prevBalance = i > 0 ? sorted[i-1].closingBalance : store.openingBalance;
                    const amountChange = sorted[i].type === 'DEBIT' ? -sorted[i].amount : sorted[i].amount;
                    sorted[i].availableBalance = prevBalance;
                    sorted[i].closingBalance = prevBalance + amountChange;
                }
                break;
             }
        }
    },
    getSupervisorAccounts,

    // Advances
    getAdvances: async (): Promise<Advance[]> => {
        await delay(100);
        return mockAdvances;
    },
    addAdvance: async (advance: Omit<Advance, 'id'>): Promise<void> => {
        await delay(300);
        mockAdvances.push({ ...advance, id: uuidv4() });
    },
    updateAdvance: async(id: string, data: Omit<Advance, 'id'>): Promise<void> => {
        await delay(300);
        const index = mockAdvances.findIndex(a => a.id === id);
        if (index > -1) {
            mockAdvances[index] = { ...data, id };
        }
    },
    deleteAdvance: async(id: string): Promise<void> => {
        await delay(300);
        mockAdvances = mockAdvances.filter(a => a.id !== id);
    }
};