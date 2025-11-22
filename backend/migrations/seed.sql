-- Seed data for initial setup

-- Insert default account categories
INSERT INTO account_categories (id, name) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Customer'),
    ('00000000-0000-0000-0000-000000000002', 'Vendor-Transport'),
    ('00000000-0000-0000-0000-000000000003', 'Vendor-Quarry'),
    ('00000000-0000-0000-0000-000000000004', 'Vendor-Royalty'),
    ('00000000-0000-0000-0000-000000000005', 'Bank Account'),
    ('00000000-0000-0000-0000-000000000006', 'Capital & Loans'),
    ('00000000-0000-0000-0000-000000000007', 'Investment'),
    ('00000000-0000-0000-0000-000000000008', 'Personal Funds'),
    ('00000000-0000-0000-0000-000000000009', 'Operational Expense')
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: malli275)
-- Password hash generated using bcrypt with salt rounds 10
INSERT INTO users (id, username, email, password_hash, display_name, role, avatar, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@logitrack.com', '$2a$10$rK8X8X8X8X8X8X8X8X8Xe8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', 'Admin User', 'admin', 'https://i.pravatar.cc/150?u=admin', true),
    ('00000000-0000-0000-0000-000000000002', 'Manager User', 'manager@logitrack.com', '$2a$10$rK8X8X8X8X8X8X8X8X8Xe8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', 'Manager User', 'manager', 'https://i.pravatar.cc/150?u=manager', true),
    ('00000000-0000-0000-0000-000000000003', 'Malli', 'malli@logitrack.com', '$2a$10$rK8X8X8X8X8X8X8X8X8Xe8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', 'Malli', 'supervisor', 'https://i.pravatar.cc/150?u=malli', true)
ON CONFLICT (username) DO NOTHING;

-- Note: Actual password hashes should be generated using bcrypt in the application
-- The above are placeholders. Run the seed script after setting up the application
-- to generate proper password hashes.

