-- LogiTrack Database Schema
-- PostgreSQL Database for Logistics Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'manager', 'supervisor', 'accountant', 'driver')),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account Categories for Chart of Accounts
CREATE TABLE IF NOT EXISTS account_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES account_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category_id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    address TEXT,
    email VARCHAR(255),
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    account_id UUID REFERENCES accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    unit VARCHAR(50) DEFAULT 'ton',
    cost_per_ton DECIMAL(10, 2),
    cost_per_cubic_meter DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Places table (locations where materials are sourced)
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quarries table
CREATE TABLE IF NOT EXISTS quarries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    owner_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    address TEXT,
    quarry_area DECIMAL(10, 2),
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    account_id UUID REFERENCES accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Royalty Owners table
CREATE TABLE IF NOT EXISTS royalty_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    address TEXT,
    quarry_area DECIMAL(10, 2),
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    account_id UUID REFERENCES accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transport Owners table
CREATE TABLE IF NOT EXISTS transport_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    address TEXT,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    account_id UUID REFERENCES accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(100),
    vehicle_capacity DECIMAL(10, 2),
    driver_name VARCHAR(255),
    driver_mobile_number VARCHAR(20),
    transport_owner_id UUID REFERENCES transport_owners(id),
    rc_book_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate Entries table (for all rate types: transport, quarry, customer, royalty)
CREATE TABLE IF NOT EXISTS rate_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('transport', 'quarry', 'customer', 'royalty')),
    entity_id UUID NOT NULL, -- References transport_owners, quarries, customers, or royalty_owners
    from_site VARCHAR(255),
    material_type VARCHAR(255),
    rate_per_ton DECIMAL(10, 2),
    rate_per_km DECIMAL(10, 2),
    rate_per_m3 DECIMAL(10, 2),
    gst VARCHAR(20) CHECK (gst IN ('inclusive', 'exclusive', '')),
    gst_percentage DECIMAL(5, 2) DEFAULT 0,
    gst_amount DECIMAL(10, 2) DEFAULT 0,
    total_rate DECIMAL(10, 2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    active VARCHAR(20) DEFAULT 'not active' CHECK (active IN ('active', 'not active')),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table (Main transaction table)
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    date DATE NOT NULL,
    place VARCHAR(255),
    customer_id UUID REFERENCES customers(id),
    invoice_dc_number VARCHAR(255),
    quarry_id UUID REFERENCES quarries(id),
    royalty_owner_id UUID REFERENCES royalty_owners(id),
    material_id UUID REFERENCES materials(id),
    vehicle_id UUID REFERENCES vehicles(id),
    transporter_name VARCHAR(255),
    transport_owner_mobile_number VARCHAR(20),
    
    -- Weighment details (start)
    empty_weight DECIMAL(10, 2),
    gross_weight DECIMAL(10, 2),
    net_weight DECIMAL(10, 2),
    
    -- Royalty details
    royalty_number VARCHAR(255),
    royalty_tons DECIMAL(10, 2),
    royalty_m3 DECIMAL(10, 2),
    
    -- Calculated fields
    deduction_percentage DECIMAL(5, 2) DEFAULT 0,
    size_change_percentage DECIMAL(5, 2) DEFAULT 0,
    tonnage DECIMAL(10, 2),
    revenue DECIMAL(15, 2),
    material_cost DECIMAL(15, 2),
    transport_cost DECIMAL(15, 2),
    royalty_cost DECIMAL(15, 2),
    profit DECIMAL(15, 2),
    
    -- Status and workflow
    status VARCHAR(50) DEFAULT 'pending upload' CHECK (status IN ('pending upload', 'in transit', 'pending validation', 'completed')),
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
    
    -- Document uploads
    eway_bill_upload TEXT,
    invoice_dc_upload TEXT,
    wayment_slip_upload TEXT,
    royalty_upload TEXT,
    tax_invoice_upload TEXT,
    
    -- Received trip details (destination)
    received_date DATE,
    end_empty_weight DECIMAL(10, 2),
    end_gross_weight DECIMAL(10, 2),
    end_net_weight DECIMAL(10, 2),
    end_wayment_slip_upload TEXT,
    weight_difference DECIMAL(10, 2),
    weight_difference_reason TEXT,
    
    agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily Expenses table
CREATE TABLE IF NOT EXISTS daily_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    date DATE NOT NULL,
    from_account VARCHAR(255) NOT NULL,
    to_account VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('DEBIT', 'CREDIT', 'OPENING_BALANCE')),
    available_balance DECIMAL(15, 2) NOT NULL,
    closing_balance DECIMAL(15, 2) NOT NULL,
    remarks TEXT,
    company_expense_type VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supervisor Opening Balances
CREATE TABLE IF NOT EXISTS supervisor_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advances table
CREATE TABLE IF NOT EXISTS advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    trip_id INTEGER REFERENCES trips(id),
    date DATE NOT NULL,
    from_account VARCHAR(255) NOT NULL,
    to_account VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    voucher_slip_upload TEXT,
    place VARCHAR(255),
    invoice_dc_number VARCHAR(255),
    owner_and_transporter_name VARCHAR(255),
    vehicle_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ledger Entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    from_account_id UUID REFERENCES accounts(id),
    via VARCHAR(255),
    to_account_id UUID REFERENCES accounts(id),
    actual_to VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL,
    to_bank VARCHAR(255),
    split VARCHAR(50),
    payment_sub_type VARCHAR(255),
    payment_type VARCHAR(255),
    remarks TEXT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id),
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Royalty Stock table
CREATE TABLE IF NOT EXISTS royalty_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_date DATE NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Rates table (separate from rate_entries for specific customer rate configurations)
CREATE TABLE IF NOT EXISTS customer_rates (
    id SERIAL PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    material VARCHAR(255) NOT NULL,
    rate VARCHAR(255) NOT NULL,
    location_from VARCHAR(255),
    location_to VARCHAR(255),
    from_date DATE,
    to_date DATE,
    active BOOLEAN DEFAULT true,
    rejection_percent VARCHAR(50),
    rejection_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_customer_id ON trips(customer_id);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_user_id ON daily_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_date ON daily_expenses(date);
CREATE INDEX IF NOT EXISTS idx_advances_user_id ON advances(user_id);
CREATE INDEX IF NOT EXISTS idx_advances_trip_id ON advances(trip_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date ON ledger_entries(date);
CREATE INDEX IF NOT EXISTS idx_rate_entries_entity ON rate_entries(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_rate_entries_active ON rate_entries(active) WHERE active = 'active';

