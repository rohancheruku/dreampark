-- Seed data (aligned with dreampark_schema.sql)

INSERT INTO theme_park (theme_park_id, name, location, number_of_rides) VALUES
(1, 'Wizarding World', 'Dallas, TX', 10),
(2, 'Barbie Dreamland', 'Orlando, FL', 10),
(3, 'Superhero Adventure Park', 'Los Angeles, CA', 10);

INSERT INTO visitor (visitor_id, first_name, last_name, ticket_id, membership_id, email) VALUES
(1, 'Aarav', 'Patel', 1, 1, 'aarav.patel@example.com'),
(2, 'Sophia', 'Martinez', 2, 2, 'sophia.martinez@example.com'),
(3, 'Daniel', 'Johnson', 3, 3, 'daniel.johnson@example.com'),
(4, 'Emily', 'Brown', 4, 4, 'emily.brown@example.com'),
(5, 'Noah', 'Williams', 5, 5, 'noah.williams@example.com'),
(6, 'Mia', 'Garcia', 6, 6, 'mia.garcia@example.com'),
(7, 'Liam', 'Anderson', 7, 7, 'liam.anderson@example.com'),
(8, 'Olivia', 'Thomas', 8, 8, 'olivia.thomas@example.com'),
(9, 'Ethan', 'Lee', 9, 9, 'ethan.lee@example.com'),
(10, 'Ava', 'Wilson', 10, 10, 'ava.wilson@example.com');

INSERT INTO membership (membership_id, type, price, date_started, num_guests, visitor_id, theme_park_id) VALUES
(1, 'Basic', 99.99, '2026-01-05', 1, 1, 1),
(2, 'Premium', 179.99, '2026-01-12', 2, 2, 1),
(3, 'Family', 299.99, '2026-02-01', 4, 3, 1),
(4, 'Basic', 99.99, '2026-02-15', 1, 4, 2),
(5, 'Premium', 179.99, '2026-03-01', 2, 5, 2),
(6, 'Family', 299.99, '2026-03-10', 5, 6, 2),
(7, 'Basic', 99.99, '2026-03-18', 1, 7, 3),
(8, 'Premium', 179.99, '2026-04-02', 2, 8, 3),
(9, 'Family', 299.99, '2026-04-12', 4, 9, 3),
(10, 'Basic', 99.99, '2026-04-20', 1, 10, 3);

INSERT INTO ticket (ticket_id, type, price, duration, visitor_id) VALUES
(1, 'Regular', 49.99, 1, 1),
(2, 'VIP', 89.99, 1, 2),
(3, 'Member', 0.00, 1, 3),
(4, 'Regular', 54.99, 1, 4),
(5, 'VIP', 94.99, 2, 5),
(6, 'Member', 0.00, 1, 6),
(7, 'Regular', 44.99, 1, 7),
(8, 'VIP', 99.99, 2, 8),
(9, 'Member', 0.00, 1, 9),
(10, 'Regular', 59.99, 1, 10);

UPDATE visitor SET membership_id = 1, ticket_id = 1 WHERE visitor_id = 1;
UPDATE visitor SET membership_id = 2, ticket_id = 2 WHERE visitor_id = 2;
UPDATE visitor SET membership_id = 3, ticket_id = 3 WHERE visitor_id = 3;
UPDATE visitor SET membership_id = 4, ticket_id = 4 WHERE visitor_id = 4;
UPDATE visitor SET membership_id = 5, ticket_id = 5 WHERE visitor_id = 5;
UPDATE visitor SET membership_id = 6, ticket_id = 6 WHERE visitor_id = 6;
UPDATE visitor SET membership_id = 7, ticket_id = 7 WHERE visitor_id = 7;
UPDATE visitor SET membership_id = 8, ticket_id = 8 WHERE visitor_id = 8;
UPDATE visitor SET membership_id = 9, ticket_id = 9 WHERE visitor_id = 9;
UPDATE visitor SET membership_id = 10, ticket_id = 10 WHERE visitor_id = 10;

INSERT INTO department (department_id, name, num_employees, dept_head_id) VALUES
(1, 'Ride Operations', 45, NULL),
(2, 'Guest Services', 30, NULL),
(3, 'Maintenance', 40, NULL),
(4, 'Security', 25, NULL),
(5, 'Food Services', 50, NULL),
(6, 'Entertainment', 35, NULL),
(7, 'Retail', 20, NULL),
(8, 'First Aid', 15, NULL),
(9, 'Cleaning Services', 28, NULL),
(10, 'Administration', 18, NULL);

INSERT INTO employee (employee_id, first_name, last_name, ssn, salary, phone_number, address) VALUES
(1, 'James', 'Carter', '123456789', 52000.00, '2145551001', '101 Main St'),
(2, 'Sarah', 'Miller', '234567890', 48000.00, '2145551002', '102 Oak St'),
(3, 'Michael', 'Davis', '345678901', 61000.00, '2145551003', '103 Pine St'),
(4, 'Emma', 'Moore', '456789012', 55000.00, '2145551004', '104 Cedar St'),
(5, 'David', 'Taylor', '567890123', 47000.00, '2145551005', '105 Maple St'),
(6, 'Grace', 'Anderson', '678901234', 50000.00, '2145551006', '106 Elm St'),
(7, 'Ryan', 'Thomas', '789012345', 43000.00, '2145551007', '107 Lake St'),
(8, 'Chloe', 'White', '890123456', 58000.00, '2145551008', '108 Hill St'),
(9, 'Nathan', 'Harris', '901234567', 46000.00, '2145551009', '109 Park St'),
(10, 'Lily', 'Martin', '012345678', 65000.00, '2145551010', '110 River St');

INSERT INTO employee_department (employee_id, department_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10);

UPDATE department SET dept_head_id = 1 WHERE department_id = 1;
UPDATE department SET dept_head_id = 2 WHERE department_id = 2;
UPDATE department SET dept_head_id = 3 WHERE department_id = 3;
UPDATE department SET dept_head_id = 4 WHERE department_id = 4;
UPDATE department SET dept_head_id = 5 WHERE department_id = 5;
UPDATE department SET dept_head_id = 6 WHERE department_id = 6;
UPDATE department SET dept_head_id = 7 WHERE department_id = 7;
UPDATE department SET dept_head_id = 8 WHERE department_id = 8;
UPDATE department SET dept_head_id = 9 WHERE department_id = 9;
UPDATE department SET dept_head_id = 10 WHERE department_id = 10;

-- One primary park per department (from prior single theme_park_id column)
INSERT INTO department_theme_park (department_id, theme_park_id) VALUES
(1, 1), (2, 1), (3, 1),
(4, 2), (5, 2), (6, 2),
(7, 3), (8, 3), (9, 3), (10, 3);

INSERT INTO ride (ride_id, name, duration, capacity, theme_park_id, type, min_height, status) VALUES
(1, 'Wizard Flight Coaster', 4, 24, 1, 'Rollercoaster', 4.5, 'Open'),
(2, 'Potion River Rapids', 6, 20, 1, 'Water', 3.5, 'Open'),
(3, 'Dragon Tower Drop', 3, 16, 1, 'Vertical', 4.2, 'Open'),
(4, 'Magic Spell Carousel', 4, 30, 1, 'Carousel', 2.5, 'Open'),
(5, 'Castle Sky Wheel', 7, 36, 1, 'Ferris Wheel', 3.0, 'Open'),
(6, 'Haunted Hall 3D', 5, 22, 1, '3D', 3.2, 'Maintenance'),
(7, 'Flying Broom Rush', 4, 20, 1, 'Rollercoaster', 4.0, 'Open'),
(8, 'Enchanted Forest Boats', 6, 18, 1, 'Water', 3.0, 'Open'),
(9, 'Wizard Spin Ride', 4, 24, 1, 'Carousel', 2.8, 'Closed'),
(10, 'Dark Castle Escape', 5, 20, 1, '3D', 3.5, 'Open'),
(11, 'Barbie Dream Wheel', 6, 36, 2, 'Ferris Wheel', 3.0, 'Open'),
(12, 'Pink Convertible Coaster', 4, 22, 2, 'Rollercoaster', 4.0, 'Open'),
(13, 'Dreamhouse Carousel', 4, 30, 2, 'Carousel', 2.5, 'Open'),
(14, 'Malibu Splash Ride', 5, 20, 2, 'Water', 3.2, 'Open'),
(15, 'Fashion Runway 3D', 5, 25, 2, '3D', 3.0, 'Open'),
(16, 'Glitter Drop Tower', 3, 16, 2, 'Vertical', 4.1, 'Maintenance'),
(17, 'Beach Party Rapids', 6, 18, 2, 'Water', 3.4, 'Open'),
(18, 'Dreamland Spin', 4, 24, 2, 'Carousel', 2.8, 'Open'),
(19, 'Sparkle Sky Wheel', 7, 36, 2, 'Ferris Wheel', 3.0, 'Closed'),
(20, 'Pink Palace Escape', 5, 20, 2, '3D', 3.5, 'Open'),
(21, 'Hero Launch Coaster', 4, 24, 3, 'Rollercoaster', 4.5, 'Open'),
(22, 'Super Splash Rescue', 6, 20, 3, 'Water', 3.5, 'Open'),
(23, 'Villain Drop Tower', 3, 16, 3, 'Vertical', 4.3, 'Open'),
(24, 'City Hero Carousel', 4, 30, 3, 'Carousel', 2.5, 'Open'),
(25, 'Skyline Ferris Wheel', 7, 36, 3, 'Ferris Wheel', 3.0, 'Open'),
(26, 'Battle Zone 3D', 5, 22, 3, '3D', 3.5, 'Maintenance'),
(27, 'Speed Force Coaster', 4, 20, 3, 'Rollercoaster', 4.2, 'Open'),
(28, 'Aqua Hero Rapids', 6, 18, 3, 'Water', 3.3, 'Open'),
(29, 'Power Spin Ride', 4, 24, 3, 'Carousel', 2.8, 'Closed'),
(30, 'Final Mission 3D', 5, 20, 3, '3D', 3.5, 'Open');

UPDATE ride SET wait_minutes = 42, recorded_at = datetime ('now', '-35 minutes') WHERE ride_id = 1;
UPDATE ride SET wait_minutes = 22, recorded_at = datetime ('now', '-48 minutes') WHERE ride_id = 2;
UPDATE ride SET wait_minutes = 18, recorded_at = datetime ('now', '-32 minutes') WHERE ride_id = 3;
UPDATE ride SET wait_minutes = 12, recorded_at = datetime ('now', '-19 minutes') WHERE ride_id = 4;
UPDATE ride SET wait_minutes = 8, recorded_at = datetime ('now', '-11 minutes') WHERE ride_id = 5;
UPDATE ride SET wait_minutes = 40, recorded_at = datetime ('now', '-44 minutes') WHERE ride_id = 7;
UPDATE ride SET wait_minutes = 31, recorded_at = datetime ('now', '-4 minutes') WHERE ride_id = 10;
UPDATE ride SET wait_minutes = 20, recorded_at = datetime ('now', '-16 minutes') WHERE ride_id = 11;
UPDATE ride SET wait_minutes = 28, recorded_at = datetime ('now', '-41 minutes') WHERE ride_id = 12;
UPDATE ride SET wait_minutes = 24, recorded_at = datetime ('now', '-9 minutes') WHERE ride_id = 14;
UPDATE ride SET wait_minutes = 25, recorded_at = datetime ('now', '-28 minutes') WHERE ride_id = 15;
UPDATE ride SET wait_minutes = 27, recorded_at = datetime ('now', '-2 minutes') WHERE ride_id = 20;
UPDATE ride SET wait_minutes = 33, recorded_at = datetime ('now', '-38 minutes') WHERE ride_id = 21;
UPDATE ride SET wait_minutes = 30, recorded_at = datetime ('now', '-25 minutes') WHERE ride_id = 22;
UPDATE ride SET wait_minutes = 15, recorded_at = datetime ('now', '-14 minutes') WHERE ride_id = 25;
UPDATE ride SET wait_minutes = 38, recorded_at = datetime ('now', '-22 minutes') WHERE ride_id = 27;
UPDATE ride SET wait_minutes = 19, recorded_at = datetime ('now', '-6 minutes') WHERE ride_id = 28;

UPDATE ride SET schedule_date = '2026-05-06', schedule_start_time = '09:00', schedule_end_time = '10:00' WHERE ride_id = 1;
UPDATE ride SET schedule_date = '2026-05-06', schedule_start_time = '10:00', schedule_end_time = '11:00' WHERE ride_id = 2;
UPDATE ride SET schedule_date = '2026-05-06', schedule_start_time = '11:00', schedule_end_time = '12:00' WHERE ride_id = 3;
UPDATE ride SET schedule_date = '2026-05-07', schedule_start_time = '09:30', schedule_end_time = '10:30' WHERE ride_id = 11;
UPDATE ride SET schedule_date = '2026-05-07', schedule_start_time = '10:30', schedule_end_time = '11:30' WHERE ride_id = 21;

INSERT INTO membership_theme_park (membership_id, theme_park_id) VALUES
(1, 1), (1, 2),
(2, 1), (2, 3),
(3, 1), (3, 2), (3, 3),
(4, 2),
(5, 2), (5, 3),
(6, 1), (6, 2),
(7, 3),
(8, 1), (8, 3),
(9, 2), (9, 3),
(10, 1), (10, 2), (10, 3);

INSERT INTO ticket_theme_park (ticket_id, theme_park_id) VALUES
(1, 1),
(2, 1), (2, 2),
(3, 1), (3, 2), (3, 3),
(4, 2),
(5, 2), (5, 3),
(6, 1), (6, 2),
(7, 3),
(8, 1), (8, 3),
(9, 2), (9, 3),
(10, 1), (10, 2), (10, 3);
