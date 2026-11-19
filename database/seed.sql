-- =============================================
-- TO-DO APP SAMPLE SEED DATA
-- =============================================

USE todo_app;

-- Sample users
INSERT INTO users (name, email, password_hash, role)
VALUES
    ('Demo User', 'demo.user@example.com', 'DEMO_HASH_REPLACE_WITH_REAL_HASH', 'user'),
    ('Demo Admin', 'demo.admin@example.com', 'DEMO_HASH_REPLACE_WITH_REAL_HASH', 'admin');

-- Sample categories
INSERT INTO categories (user_id, name)
VALUES
    (1, 'College'),
    (1, 'Personal'),
    (2, 'Admin Tasks');

-- Sample tasks
INSERT INTO tasks
    (user_id, category_id, title, description, status, priority, due_date)
VALUES
    (1, 1, 'Complete DB assignment', 'Finish the database schema and testing', 'pending', 'high', NULL),
    (1, 1, 'Prepare project presentation', 'Prepare slides for the project demo', 'in_progress', 'medium', NULL),
    (1, 2, 'Buy groceries', 'Purchase weekly essentials', 'completed', 'low', NULL),
    (2, 3, 'Review project submissions', 'Review team submissions', 'pending', 'high', NULL);
