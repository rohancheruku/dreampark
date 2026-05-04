-- Dream Park: SQLite schema (course model + sql.js / app compatibility)
-- Merged from updated ER design: wait/schedule on ride, employee↔department M:N,
-- department↔theme_park M:N, ticket↔theme_park via ticket_theme_park.

PRAGMA foreign_keys = ON;

CREATE TABLE theme_park (
  theme_park_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  number_of_rides INTEGER CHECK (number_of_rides >= 1)
);

CREATE TABLE visitor (
  visitor_id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ticket_id INTEGER,
  membership_id INTEGER,
  email TEXT
);

CREATE TABLE membership (
  membership_id INTEGER PRIMARY KEY,
  type TEXT CHECK (type IN ('Basic', 'Premium', 'Family')),
  price REAL CHECK (price >= 0),
  date_started TEXT NOT NULL,
  num_guests INTEGER CHECK (num_guests > 0),
  visitor_id INTEGER UNIQUE NOT NULL REFERENCES visitor (visitor_id),
  theme_park_id INTEGER REFERENCES theme_park (theme_park_id)
);

-- Park access for a ticket is via ticket_theme_park (ticket has no theme_park_id column).
CREATE TABLE ticket (
  ticket_id INTEGER PRIMARY KEY,
  type TEXT CHECK (type IN ('Regular', 'VIP', 'Member')),
  price REAL CHECK (price >= 0),
  duration INTEGER CHECK (duration > 0),
  visitor_id INTEGER NOT NULL REFERENCES visitor (visitor_id)
);

CREATE TABLE employee (
  employee_id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn TEXT UNIQUE NOT NULL,
  salary REAL CHECK (salary > 0),
  phone_number TEXT,
  address TEXT
);

CREATE TABLE department (
  department_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  num_employees INTEGER CHECK (num_employees >= 0),
  dept_head_id INTEGER REFERENCES employee (employee_id)
);

CREATE TABLE employee_department (
  employee_id INTEGER,
  department_id INTEGER,
  PRIMARY KEY (employee_id, department_id),
  FOREIGN KEY (employee_id) REFERENCES employee (employee_id),
  FOREIGN KEY (department_id) REFERENCES department (department_id)
);

CREATE TABLE ride (
  ride_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER CHECK (duration > 0),
  capacity INTEGER CHECK (capacity > 0),
  theme_park_id INTEGER NOT NULL REFERENCES theme_park (theme_park_id),
  type TEXT CHECK (
    type IN ('Water', 'Rollercoaster', '3D', 'Carousel', 'Ferris Wheel', 'Vertical')
  ),
  min_height REAL CHECK (min_height >= 0),
  status TEXT CHECK (status IN ('Open', 'Maintenance', 'Construction', 'Closed')),
  wait_minutes INTEGER CHECK (wait_minutes >= 0),
  recorded_at TEXT,
  schedule_date TEXT,
  schedule_start_time TEXT,
  schedule_end_time TEXT
);

CREATE TABLE membership_theme_park (
  membership_id INTEGER,
  theme_park_id INTEGER,
  PRIMARY KEY (membership_id, theme_park_id),
  FOREIGN KEY (membership_id) REFERENCES membership (membership_id),
  FOREIGN KEY (theme_park_id) REFERENCES theme_park (theme_park_id)
);

CREATE TABLE department_theme_park (
  department_id INTEGER,
  theme_park_id INTEGER,
  PRIMARY KEY (department_id, theme_park_id),
  FOREIGN KEY (department_id) REFERENCES department (department_id),
  FOREIGN KEY (theme_park_id) REFERENCES theme_park (theme_park_id)
);

CREATE TABLE ticket_theme_park (
  ticket_id INTEGER,
  theme_park_id INTEGER,
  PRIMARY KEY (ticket_id, theme_park_id),
  FOREIGN KEY (ticket_id) REFERENCES ticket (ticket_id),
  FOREIGN KEY (theme_park_id) REFERENCES theme_park (theme_park_id)
);
